import { useEffect, useMemo, useState, type Dispatch, type InputHTMLAttributes, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Sparkles, UploadCloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiPost } from '../../services/apiClient';
import { svpAxios as api } from '../../services/svpAxios';
import { svpApi } from '../../services/svpApi';
import type { SvpConfigGroup, SvpConfigOption } from '../../types/svp';
import { propertyFieldLabel, propertyFieldVisible } from '../../utils/fieldLabels';

const PROVINCES = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Thủ Đức', 'Bình Dương', 'Đồng Nai', 'Long An', 'Bà Rịa - Vũng Tàu', 'Cần Thơ', 'Hải Phòng', 'Khánh Hòa', 'Thanh Hóa'];
const DISTRICTS = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Tân Phú', 'Thủ Đức', 'Bình Tân', 'Nhà Bè', 'Hóc Môn'];
const WARDS = ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 10', 'Phường 12', 'Phường 15', 'Phường 17', 'Hiệp Bình Chánh', 'Linh Đông', 'Tân Sơn Nhì'];
const WARDS_BY_DISTRICT: Record<string, string[]> = {
  'Hóc Môn': [
    'Xã Hóc Môn',
    'Xã Bà Điểm',
    'Xã Xuân Thới Sơn',
    'Xã Đông Thạnh',
    'Thị trấn Hóc Môn',
    'Bà Điểm',
    'Đông Thạnh',
    'Nhị Bình',
    'Tân Hiệp',
    'Tân Thới Nhì',
    'Tân Xuân',
    'Thới Tam Thôn',
    'Trung Chánh',
    'Xuân Thới Đông',
    'Xuân Thới Sơn',
    'Xuân Thới Thượng',
  ],
  'Thủ Đức': ['Hiệp Bình Chánh', 'Linh Đông', 'Linh Trung', 'Linh Tây', 'Tam Bình', 'Tam Phú', 'Trường Thọ', 'Bình Thọ'],
  'Gò Vấp': ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'],
  'Tân Phú': ['Tân Sơn Nhì', 'Tây Thạnh', 'Sơn Kỳ', 'Tân Quý', 'Tân Thành', 'Phú Thọ Hòa', 'Phú Thạnh', 'Phú Trung', 'Hòa Thạnh', 'Hiệp Tân', 'Tân Thới Hòa'],
};
const LEGAL_STATUS = ['Sổ đỏ / sổ hồng', 'Hợp đồng mua bán', 'Giấy tay', 'Đang hoàn thiện', 'Cần kiểm tra thêm'];
type DuplicateRule = {
  hasDuplicates: boolean;
  canSubmit: boolean;
  currentExpertCount: number;
  maxExpertsAllowed: number;
  highestSigningScore: number | null;
  submittedSigningScore: number;
  message: string;
};

type DuplicateMatch = {
  id?: string;
  code?: string;
  title?: string;
  address?: string;
  district?: string;
  bookSerial?: string;
  ownerName?: string;
  expertName?: string;
  signingScore?: number;
};

const initialForm = {
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  ownerNote: '',
  title: '',
  province: 'TP.HCM',
  district: '',
  ward: '',
  houseNumber: '',
  streetName: '',
  street: '',
  hiddenAddress: '',
  gpsCoordinates: '',
  bookSerial: '',
  price: '',
  area: '',
  floors: '',
  width: '',
  length: '',
  legalStatus: '',
  commission: '',
  source: '',
  propertyFeature: '',
  companyUnitId: '',
  viewPermission: '',
  description: '',
  internalNote: '',
};

function parseMoney(value: string) {
  const normalized = String(value || '').replace(/[^\d.]/g, '');
  return Number(normalized || 0);
}

function formatPriceShort(value: string) {
  const amount = parseMoney(value);
  if (!amount) return '';
  if (amount >= 1_000_000_000) {
    const billion = amount / 1_000_000_000;
    return `${Number.isInteger(billion) ? billion.toFixed(0) : billion.toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    const million = amount / 1_000_000;
    return `${Number.isInteger(million) ? million.toFixed(0) : million.toFixed(1)} triệu`;
  }
  return amount.toLocaleString('vi-VN');
}

function priceSegmentLabel(price: string, options: SvpConfigOption[]) {
  const amount = parseMoney(price);
  if (!amount) return '';
  const configured = options.find((option) => {
    const metadata = option.metadata || {};
    const min = Number(metadata.min || 0);
    const maxRaw = metadata.max;
    const max = maxRaw === null || maxRaw === undefined || maxRaw === '' ? Infinity : Number(maxRaw);
    return amount >= min && amount < max;
  });
  if (configured?.label) return configured.label;
  const billion = amount / 1_000_000_000;
  if (billion < 3) return 'Nhỏ 3';
  if (billion < 6) return '3 đến 6';
  if (billion < 10) return '6 đến 10';
  if (billion < 20) return '10 đến 20';
  if (billion < 50) return 'Triệu đô';
  if (billion < 100) return 'Tỷ phú';
  return 'Đại tỷ phú';
}

function buildAutoTitle(form: typeof initialForm, priceSegments: SvpConfigOption[], memberName: string) {
  const specs = [
    form.area ? `${form.area}m2` : '',
    form.floors ? `${form.floors}T` : '',
    form.width || form.length ? `${form.width || '?'}x${form.length || '?'}` : '',
    formatPriceShort(form.price),
  ].filter(Boolean).join(' ');

  return [
    [form.houseNumber, form.bookSerial ? `(${form.bookSerial})` : '', form.streetName].filter(Boolean).join(' '),
    specs,
    priceSegmentLabel(form.price, priceSegments),
    memberName ? `HĐ ${memberName}` : '',
    form.commission ? `HH ${form.commission}` : '',
    form.source ? `Nguồn ${form.source}` : '',
  ].filter(Boolean).join(' | ').replace(/\s+/g, ' ').trim();
}

function buildDuplicateMessage(rule: DuplicateRule | null, matches: DuplicateMatch[]) {
  if (!matches.length) return 'Không trùng. Hệ thống ghi nhận và cho hiển thị ngay.';
  const targets = matches.slice(0, 3).map((item) => {
    const parts = [
      item.code || item.id,
      item.title,
      item.ownerName ? `chủ ${item.ownerName}` : '',
      item.expertName ? `ký bởi ${item.expertName}` : '',
      item.signingScore !== undefined ? `${item.signingScore} điểm` : '',
    ].filter(Boolean);
    return parts.join(' - ');
  }).join('; ');
  const prefix = rule?.canSubmit
    ? 'Nhà có dấu hiệu trùng nhưng điểm ký hiện tại đủ điều kiện lên bài.'
    : 'Nhà đã trùng và chưa đủ điều kiện đăng.';
  return `${prefix} Trùng với: ${targets}. ${rule?.message || ''}`.trim();
}

export default function ExpertAddPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [form, setForm] = useState(initialForm);
  const [signingCriteriaIds, setSigningCriteriaIds] = useState<string[]>([]);
  const [selectedVisibilityIds, setSelectedVisibilityIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [privateFiles, setPrivateFiles] = useState<File[]>([]);
  const [publicFiles, setPublicFiles] = useState<File[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [duplicateRule, setDuplicateRule] = useState<DuplicateRule | null>(null);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    svpApi.getConfig().then(setGroups).catch(() => setGroups([]));
  }, []);

  const optionsOf = (groupId: string) =>
    groups.find((group) => group.id === groupId)?.options.filter((option) => option.isActive) || [];

  const signingCriteria = optionsOf('signing_criteria');
  const companyUnits = optionsOf('company_units');
  const visibilityOptions = optionsOf('visibility_levels');
  const propertyTags = optionsOf('property_tags');
  const priceSegments = optionsOf('price_segments');
  const fieldLabel = (key: string, fallback: string) => propertyFieldLabel(groups, key, fallback);
  const showField = (key: string) => propertyFieldVisible(groups, key);
  const wardOptions = WARDS_BY_DISTRICT[form.district] || WARDS;

  const signingScore = useMemo(() => {
    return signingCriteria
      .filter((item) => signingCriteriaIds.includes(item.id))
      .reduce((total, item) => total + Number(item.score || 0), 0);
  }, [signingCriteria, signingCriteriaIds]);

  const autoTitle = useMemo(() => buildAutoTitle(form, priceSegments, user?.fullName || ''), [form, priceSegments, user?.fullName]);
  const allowedVisibilityIds = useMemo(
    () => visibilityOptions.map((option) => option.id).filter((id) => !selectedVisibilityIds.includes(id)),
    [selectedVisibilityIds, visibilityOptions],
  );

  useEffect(() => {
    setForm((current) => current.title === autoTitle ? current : { ...current, title: autoTitle });
  }, [autoTitle]);

  const update = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'houseNumber' || key === 'streetName') {
        next.street = [key === 'houseNumber' ? value : current.houseNumber, key === 'streetName' ? value : current.streetName].filter(Boolean).join(' ').trim();
      }
      if (key === 'district' && value !== current.district) {
        next.ward = '';
      }
      return next;
    });
    if (['ownerPhone', 'houseNumber', 'streetName', 'street', 'ward', 'district', 'province', 'gpsCoordinates', 'bookSerial'].includes(key)) {
      setDuplicateChecked(false);
      setDuplicateRule(null);
      setDuplicates([]);
    }
  };

  const toggleSigning = (id: string) => {
    setDuplicateChecked(false);
    setDuplicateRule(null);
    setDuplicates([]);
    setSigningCriteriaIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleMultiOption = (id: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const runDuplicateCheck = async () => {
    setMessage('');
    const address = [form.street, form.ward, form.district, form.province].filter(Boolean).join(', ');
    const response = await api.post('/properties/check-duplicate', {
      address,
      bookSerial: form.bookSerial,
      ownerPhone: form.ownerPhone,
      gpsCoordinates: form.gpsCoordinates,
      signingScore,
    });
    const matches = response.data?.matches || [];
    const rule = response.data?.rule || null;
    setDuplicates(matches);
    setDuplicateRule(rule);
    setDuplicateChecked(true);
    if (matches.length > 0) {
      setMessage(buildDuplicateMessage(rule, matches));
    }
    return { matches, rule };
  };

  const checkDuplicate = async () => {
    try {
      await runDuplicateCheck();
    } catch {
      setDuplicateChecked(false);
      setDuplicateRule(null);
      setMessage('Chưa kiểm tra trùng được. Vui lòng thử lại.');
    }
  };

  const generateAiDescription = async () => {
    setAiBusy(true);
    setMessage('');
    try {
      const result = await apiPost<{ description: string }>('/api/ai/description', {
        title: form.title,
        propertyType: selectedTagIds
          .map((id) => propertyTags.find((item) => item.id === id)?.label)
          .filter(Boolean)
          .join(', '),
        price: form.price,
        sqft: form.area,
        address: [form.street, form.ward, form.district].filter(Boolean).join(', '),
        city: form.province,
        amenities: [form.legalStatus, form.commission, form.internalNote].filter(Boolean).join(', '),
        notes: form.description || form.ownerNote,
      });
      const description = result.data?.description || '';
      if (!result.ok || !description) {
        setMessage(result.error || 'AI chưa tạo được mô tả. Có thể nhập thủ công trước.');
        return;
      }
      update('description', description);
    } catch {
      setMessage('AI chưa phản hồi. Có thể nhập mô tả thủ công trước.');
    } finally {
      setAiBusy(false);
    }
  };

  const uploadMediaGroups = async (propertyId: string) => {
    if (privateFiles.length) {
      await svpApi.uploadPropertyMediaImages(
        propertyId,
        privateFiles,
        'Ảnh duyệt nội bộ: sổ đỏ, hợp đồng, tự sướng với nhà',
        'private_approval',
      );
    }
    if (publicFiles.length) {
      await svpApi.uploadPropertyMediaImages(
        propertyId,
        publicFiles,
        'Ảnh nhà công khai cho người xem',
        'public_house',
      );
    }
  };

  const handleSubmit = async () => {
    if (!form.ownerName || !form.ownerPhone || !autoTitle || !form.province || !form.district || !form.price) {
      setMessage('Vui lòng nhập tên chủ, SĐT chủ, tỉnh/thành, quận/huyện, số nhà/tên đường hoặc thông tin đủ để tạo tiêu đề, và giá chào.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const checked = await runDuplicateCheck();
      if (checked.rule?.hasDuplicates && !checked.rule.canSubmit) {
        setMessage(buildDuplicateMessage(checked.rule, checked.matches));
        return;
      }
      const address = [form.street, form.ward, form.district, form.province].filter(Boolean).join(', ');
      const property = await svpApi.createProperty({
        title: autoTitle,
        description: form.description,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        bookSerial: form.bookSerial,
        price: Number(form.price) || 0,
        priceUnit: 'VND',
        areaM2: form.area ? Number(form.area) : null,
        province: form.province,
        district: form.district,
        ward: form.ward,
        address,
        hiddenAddress: form.hiddenAddress || address,
        companyUnitId: form.companyUnitId,
        statusId: 'st_active',
        expertId: user?.id || '',
        assignedUserId: '',
        signingScore,
        visibilityIds: allowedVisibilityIds,
        tagIds: selectedTagIds,
        extra: {
          sourceRole: 'chuyen_gia',
          autoPublish: true,
          autoTitle,
          province: form.province,
          ownerEmail: form.ownerEmail,
          ownerNote: form.ownerNote,
          houseNumber: form.houseNumber,
          streetName: form.streetName,
          street: form.street,
          gpsCoordinates: form.gpsCoordinates,
          legalStatus: form.legalStatus,
          commission: form.commission,
          source: form.source,
          floors: form.floors,
          width: form.width,
          length: form.length,
          priceSegment: priceSegmentLabel(form.price, priceSegments),
          internalNote: form.internalNote,
          listingDescription: form.description,
          visibilityMode: 'excluded',
          excludedVisibilityIds: selectedVisibilityIds,
          visibilityIds: allowedVisibilityIds,
          tagIds: selectedTagIds,
          publicMediaCount: publicFiles.length,
          privateApprovalMediaCount: privateFiles.length,
          signingCriteriaIds,
          signingScore,
          duplicateChecked: true,
          duplicateMatches: checked.matches,
          duplicateRule: checked.rule,
          duplicateRuleNote: 'Bài đúng đủ trường và không trùng thì lên luôn; nếu trùng, người sau phải có điểm ký cao hơn và tối đa 3 Chuyên gia trên một nguồn.',
          enforceDuplicateRule: true,
          submittedAt: new Date().toISOString(),
        },
        enforceDuplicateRule: true,
      });
      await uploadMediaGroups(property.id);
      navigate('/chuyen-gia/kho-nha', {
        state: {
          createdPropertyId: property.id,
          createdPropertyCode: property.code,
          createdPropertyTitle: property.title,
        },
      });
    } catch {
      setMessage('Chưa gửi duyệt được nguồn nhà. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-3 pb-24 pt-3 sm:px-4">
      <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Chuyên gia đăng nhà</p>
        <h1 className="mt-1 text-xl font-black leading-tight text-[#25202a]">Tạo nguồn nhà chờ duyệt</h1>
        <p className="mt-1 text-sm font-semibold leading-5 text-[#747b88]">
          Nhập một lần, lưu được thông tin chủ, nhà, ảnh nội bộ, ảnh công khai và điểm ký.
        </p>
      </section>

      {message ? (
        <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold leading-5 text-[#c40012]">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-3 font-black text-[#25202a]">Thông tin chủ</h2>
          <div className="grid gap-3">
            <Field label={fieldLabel('ownerName', 'Tên chủ nhà')} value={form.ownerName} onChange={(value) => update('ownerName', value)} />
            <Field label={fieldLabel('ownerPhone', 'SĐT chủ nhà')} value={form.ownerPhone} onChange={(value) => update('ownerPhone', value)} inputMode="tel" />
          </div>
          <details className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <summary className="cursor-pointer text-xs font-black text-[#5f6672]">Thông tin phụ của chủ nhà</summary>
            <div className="mt-3 grid gap-3">
              {showField('ownerEmail') ? <Field label={fieldLabel('ownerEmail', 'Email chủ nhà (không bắt buộc)')} value={form.ownerEmail} onChange={(value) => update('ownerEmail', value)} type="email" /> : null}
              {showField('ownerNote') ? <Textarea label={fieldLabel('ownerNote', 'Ghi chú về chủ')} value={form.ownerNote} onChange={(value) => update('ownerNote', value)} rows={3} /> : null}
            </div>
          </details>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-3 font-black text-[#25202a]">Thông tin nhà</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadonlyField className="sm:col-span-2" label={fieldLabel('title', 'Tiêu đề tự động')} value={autoTitle || 'Hệ thống sẽ tự ghép từ số nhà, đường, thông số, phân khúc, HĐ, hoa hồng và nguồn.'} />
            <InputWithList label={fieldLabel('province', 'Tỉnh/Thành phố')} value={form.province} onChange={(value) => update('province', value)} listId="expert-provinces" options={PROVINCES} />
            <InputWithList label={fieldLabel('district', 'Quận/Huyện')} value={form.district} onChange={(value) => update('district', value)} listId="expert-districts" options={DISTRICTS} />
            <InputWithList label={fieldLabel('ward', 'Phường/Xã')} value={form.ward} onChange={(value) => update('ward', value)} listId="expert-wards" options={wardOptions} />
            {showField('street') ? <Field label="Số nhà" value={form.houseNumber} onChange={(value) => update('houseNumber', value)} /> : null}
            {showField('street') ? <Field label="Tên đường" value={form.streetName} onChange={(value) => update('streetName', value)} /> : null}
            {showField('hiddenAddress') ? <Field label={fieldLabel('hiddenAddress', 'Địa chỉ ẩn nội bộ')} value={form.hiddenAddress} onChange={(value) => update('hiddenAddress', value)} /> : null}
            {showField('bookSerial') ? <Field label={fieldLabel('bookSerial', 'Seri / mã sổ')} value={form.bookSerial} onChange={(value) => update('bookSerial', value)} /> : null}
            {showField('gpsCoordinates') ? <Field label={fieldLabel('gpsCoordinates', 'Tọa độ GPS')} value={form.gpsCoordinates} onChange={(value) => update('gpsCoordinates', value)} /> : null}
            <Field label={fieldLabel('price', 'Giá chào')} value={form.price} onChange={(value) => update('price', value)} inputMode="numeric" />
            <ReadonlyField label="Phân khúc" value={priceSegmentLabel(form.price, priceSegments) || 'Tự tính theo giá chào'} />
            {showField('area') ? <Field label={fieldLabel('area', 'Diện tích m2')} value={form.area} onChange={(value) => update('area', value)} inputMode="decimal" /> : null}
            {showField('floors') ? <Field label={fieldLabel('floors', 'Số tầng')} value={form.floors} onChange={(value) => update('floors', value)} inputMode="decimal" /> : null}
            <Field label="Chiều ngang / rộng" value={form.width} onChange={(value) => update('width', value)} inputMode="decimal" />
            <Field label="Chiều dài" value={form.length} onChange={(value) => update('length', value)} inputMode="decimal" />
            {showField('legalStatus') ? <Select label={fieldLabel('legalStatus', 'Pháp lý')} value={form.legalStatus} onChange={(value) => update('legalStatus', value)} options={LEGAL_STATUS} /> : null}
            {showField('commission') ? <Field label={fieldLabel('commission', 'Hoa hồng / thỏa thuận')} value={form.commission} onChange={(value) => update('commission', value)} /> : null}
            <Field label="Nguồn" value={form.source} onChange={(value) => update('source', value)} placeholder="VD: Chủ gửi, tự khai thác, cộng tác viên..." />
            <SelectFromOptions label="Công ty thành viên" value={form.companyUnitId} onChange={(value) => update('companyUnitId', value)} options={companyUnits} />
            <MultiOptionPicker label="Không cho xem (nếu cần hạn chế)" selectedIds={selectedVisibilityIds} options={visibilityOptions} onToggle={(id) => toggleMultiOption(id, setSelectedVisibilityIds)} emptyHint="Mặc định: tất cả nhóm phù hợp đều được xem để bán nhanh." />
            <MultiOptionPicker label="Đặc điểm / tag chính" selectedIds={selectedTagIds} options={propertyTags} onToggle={(id) => toggleMultiOption(id, setSelectedTagIds)} />
          </div>
        </section>
      </div>

      <section className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-[#25202a]">{fieldLabel('description', 'Mô tả chi tiết')}</h2>
            <p className="mt-1 text-xs font-semibold text-[#7b8190]">Có thể nhập dài theo mẫu trợ lý gửi.</p>
          </div>
          <button
            type="button"
            onClick={generateAiDescription}
            disabled={aiBusy}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 text-xs font-black text-[#c40012] disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {aiBusy ? 'AI...' : 'AI viết'}
          </button>
        </div>
        <Textarea label="" value={form.description} onChange={(value) => update('description', value)} rows={7} placeholder="Nhập mô tả nhà, điểm mạnh, pháp lý, hiện trạng, lý do bán, lưu ý khi dẫn khách..." />
      </section>

      <section className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-[#25202a]">Điểm ký nhà</h2>
            <p className="mt-1 text-xs font-semibold text-[#7b8190]">Chọn tiêu chí, hệ thống tự tính điểm.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-black ${signingScore >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-[#c40012]'}`}>
            {signingScore > 0 ? '+' : ''}{signingScore} điểm
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {signingCriteria.length ? signingCriteria.map((item) => (
            <label key={item.id} className="flex items-center gap-2 rounded-2xl border border-gray-100 px-3 py-2 text-sm font-bold text-[#25202a]">
              <input type="checkbox" checked={signingCriteriaIds.includes(item.id)} onChange={() => toggleSigning(item.id)} className="h-4 w-4 accent-[#c40012]" />
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-[#7b8190]">{Number(item.score || 0) > 0 ? '+' : ''}{item.score || 0}</span>
            </label>
          )) : (
            <p className="text-sm font-semibold text-[#7b8190]">Chưa có tiêu chí điểm ký trong cấu hình.</p>
          )}
        </div>
      </section>

      {showField('houseImages') || showField('bookImages') || showField('contractImages') || showField('ownerSelfie') ? (
      <section className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 font-black text-[#25202a]">Ảnh và tài liệu</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FileBox
            title={fieldLabel('bookImages', 'Ảnh duyệt nội bộ')}
            desc="Sổ đỏ, hợp đồng, tự sướng với nhà. Chỉ admin/chuyên gia phụ trách xem."
            files={privateFiles}
            onChange={setPrivateFiles}
          />
          <FileBox
            title={fieldLabel('houseImages', 'Ảnh công khai')}
            desc="Ảnh nhà dùng cho người xem theo phân quyền."
            files={publicFiles}
            onChange={setPublicFiles}
          />
        </div>
      </section>
      ) : null}

      <section className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={checkDuplicate}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-700"
          >
            <AlertTriangle className="h-5 w-5" />
            Kiểm tra trùng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white disabled:opacity-60"
          >
            <CheckCircle2 className="h-5 w-5" />
            {submitting ? 'Đang đăng...' : 'Đăng nhà'}
          </button>
        </div>
        {duplicateChecked ? (
          <div className={`mt-3 rounded-2xl px-3 py-2 text-sm font-bold ${
            duplicates.length
              ? duplicateRule?.canSubmit
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-[#c40012]'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            {duplicates.length
              ? buildDuplicateMessage(duplicateRule, duplicates)
              : 'Không trùng. Khi bấm Đăng nhà, hệ thống ghi nhận và cho hiển thị ngay.'}
          </div>
        ) : null}
        {showField('internalNote') ? <Textarea className="mt-3" label={fieldLabel('internalNote', 'Ghi chú nội bộ')} value={form.internalNote} onChange={(value) => update('internalNote', value)} rows={3} placeholder="Cách xử lý trùng, lưu ý chủ nhà, điều kiện dẫn khách..." /> : null}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', inputMode, className = '', placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']; className?: string; placeholder?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <input
        value={value}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
    </label>
  );
}

function ReadonlyField({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <div className="flex min-h-11 w-full items-center rounded-2xl border border-red-100 bg-[#fff8f2] px-3 text-sm font-black leading-5 text-[#25202a]">
        {value}
      </div>
    </label>
  );
}

function Textarea({ label, value, onChange, rows, placeholder = '', className = '' }: { label: string; value: string; onChange: (value: string) => void; rows: number; placeholder?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span> : null}
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
    </label>
  );
}

function InputWithList({ label, value, onChange, options, listId }: { label: string; value: string; onChange: (value: string) => void; options: string[]; listId: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        list={listId}
        className="min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
      <datalist id={listId}>
        {options.map((item) => <option key={item} value={item} />)}
      </datalist>
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#c40012]">
        <option value="">Chọn</option>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

function SelectFromOptions({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: SvpConfigOption[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#c40012]">
        <option value="">Chọn</option>
        {options.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  );
}

function MultiOptionPicker({ label, selectedIds, options, onToggle, emptyHint }: { label: string; selectedIds: string[]; options: SvpConfigOption[]; onToggle: (id: string) => void; emptyHint?: string }) {
  return (
    <div className="block sm:col-span-2">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2">
        {options.length ? options.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`min-h-9 rounded-xl px-3 text-xs font-black transition ${
                selected
                  ? 'bg-[#c40012] text-white shadow-sm'
                  : 'bg-[#fff8f2] text-[#6b4f52] ring-1 ring-red-100'
              }`}
            >
              {item.label}
            </button>
          );
        }) : (
          <span className="px-1 py-2 text-xs font-semibold text-[#7b8190]">Chưa có lựa chọn trong cấu hình.</span>
        )}
      </div>
      <p className="mt-1 text-[11px] font-semibold text-[#7b8190]">{selectedIds.length ? `Đã chọn ${selectedIds.length} mục.` : emptyHint || ''}</p>
    </div>
  );
}

function FileBox({ title, desc, files, onChange }: { title: string; desc: string; files: File[]; onChange: (files: File[]) => void }) {
  return (
    <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-gray-200 p-4 transition hover:border-[#c40012]">
      <UploadCloud className="mb-2 h-7 w-7 text-[#c40012]" />
      <p className="font-black text-[#25202a]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#7b8190]">{desc}</p>
      <p className="mt-2 text-xs font-black text-[#c40012]">{files.length ? `Đã chọn ${files.length} file` : 'Chọn ảnh'}</p>
      <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onChange(Array.from(event.target.files || []))} />
    </label>
  );
}
