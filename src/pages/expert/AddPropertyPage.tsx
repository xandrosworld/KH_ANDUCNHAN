import { useEffect, useMemo, useState, type Dispatch, type InputHTMLAttributes, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Sparkles, UploadCloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiPost } from '../../services/apiClient';
import { svpAxios as api } from '../../services/svpAxios';
import { svpApi } from '../../services/svpApi';
import type { SvpConfigGroup, SvpConfigOption } from '../../types/svp';

const PROVINCES = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Thủ Đức', 'Bình Dương', 'Đồng Nai', 'Long An', 'Bà Rịa - Vũng Tàu', 'Cần Thơ', 'Hải Phòng', 'Khánh Hòa', 'Thanh Hóa'];
const DISTRICTS = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Tân Phú', 'Thủ Đức', 'Bình Tân', 'Nhà Bè', 'Hóc Môn'];
const WARDS = ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 10', 'Phường 12', 'Phường 15', 'Phường 17', 'Hiệp Bình Chánh', 'Linh Đông', 'Tân Sơn Nhì'];
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

const initialForm = {
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  ownerNote: '',
  title: '',
  province: 'TP.HCM',
  district: '',
  ward: '',
  street: '',
  hiddenAddress: '',
  gpsCoordinates: '',
  bookSerial: '',
  price: '',
  area: '',
  legalStatus: '',
  commission: '',
  propertyFeature: '',
  companyUnitId: '',
  viewPermission: '',
  description: '',
  internalNote: '',
};

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

  const signingScore = useMemo(() => {
    return signingCriteria
      .filter((item) => signingCriteriaIds.includes(item.id))
      .reduce((total, item) => total + Number(item.score || 0), 0);
  }, [signingCriteria, signingCriteriaIds]);

  const update = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (['ownerPhone', 'street', 'ward', 'district', 'province', 'gpsCoordinates', 'bookSerial'].includes(key)) {
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

  const checkDuplicate = async () => {
    setMessage('');
    try {
      const address = [form.street, form.ward, form.district, form.province].filter(Boolean).join(', ');
      const response = await api.post('/properties/check-duplicate', {
        address,
        bookSerial: form.bookSerial,
        ownerPhone: form.ownerPhone,
        gpsCoordinates: form.gpsCoordinates,
        signingScore,
      });
      setDuplicates(response.data?.matches || []);
      setDuplicateRule(response.data?.rule || null);
      setDuplicateChecked(true);
      if ((response.data?.matches || []).length > 0) {
        setMessage(response.data?.rule?.message || 'Nguồn có dấu hiệu trùng. Hệ thống vẫn lưu điểm ký để admin xét duyệt theo quy trình.');
      }
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
    if (!form.ownerName || !form.ownerPhone || !form.title || !form.province || !form.district || !form.price) {
      setMessage('Vui lòng nhập tên chủ, SĐT chủ, tiêu đề, tỉnh/thành, quận/huyện và giá chào.');
      return;
    }
    if (!duplicateChecked) {
      setMessage('Vui lòng bấm kiểm tra trùng trước khi gửi duyệt.');
      return;
    }
    if (duplicateRule?.hasDuplicates && !duplicateRule.canSubmit) {
      setMessage(duplicateRule.message || 'Nguồn trùng chưa đủ điều kiện gửi duyệt theo điểm ký và giới hạn tối đa 3 Chuyên gia.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const address = [form.street, form.ward, form.district, form.province].filter(Boolean).join(', ');
      const property = await svpApi.createProperty({
        title: form.title,
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
        statusId: 'st_new',
        expertId: user?.id || '',
        assignedUserId: '',
        signingScore,
        visibilityIds: selectedVisibilityIds,
        tagIds: selectedTagIds,
        extra: {
          sourceRole: 'chuyen_gia',
          province: form.province,
          ownerEmail: form.ownerEmail,
          ownerNote: form.ownerNote,
          street: form.street,
          gpsCoordinates: form.gpsCoordinates,
          legalStatus: form.legalStatus,
          commission: form.commission,
          internalNote: form.internalNote,
          listingDescription: form.description,
          visibilityIds: selectedVisibilityIds,
          tagIds: selectedTagIds,
          publicMediaCount: publicFiles.length,
          privateApprovalMediaCount: privateFiles.length,
          signingCriteriaIds,
          signingScore,
          duplicateChecked,
          duplicateMatches: duplicates,
          duplicateRule,
          duplicateRuleNote: 'Nguoi sau co diem ky cao hon moi nen duyet; toi da 3 chuyen gia tren mot nguon trung.',
          submittedAt: new Date().toISOString(),
        },
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
            <Field label="Tên chủ nhà" value={form.ownerName} onChange={(value) => update('ownerName', value)} />
            <Field label="SĐT chủ nhà" value={form.ownerPhone} onChange={(value) => update('ownerPhone', value)} inputMode="tel" />
          </div>
          <details className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <summary className="cursor-pointer text-xs font-black text-[#5f6672]">Thông tin phụ của chủ nhà</summary>
            <div className="mt-3 grid gap-3">
              <Field label="Email chủ nhà (không bắt buộc)" value={form.ownerEmail} onChange={(value) => update('ownerEmail', value)} type="email" />
              <Textarea label="Ghi chú về chủ" value={form.ownerNote} onChange={(value) => update('ownerNote', value)} rows={3} />
            </div>
          </details>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-3 font-black text-[#25202a]">Thông tin nhà</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Tiêu đề tin" value={form.title} onChange={(value) => update('title', value)} />
            <InputWithList label="Tỉnh/Thành phố" value={form.province} onChange={(value) => update('province', value)} listId="expert-provinces" options={PROVINCES} />
            <InputWithList label="Quận/Huyện" value={form.district} onChange={(value) => update('district', value)} listId="expert-districts" options={DISTRICTS} />
            <InputWithList label="Phường/Xã" value={form.ward} onChange={(value) => update('ward', value)} listId="expert-wards" options={WARDS} />
            <Field label="Số nhà + tên đường" value={form.street} onChange={(value) => update('street', value)} />
            <Field label="Địa chỉ ẩn nội bộ" value={form.hiddenAddress} onChange={(value) => update('hiddenAddress', value)} />
            <Field label="Seri / mã sổ" value={form.bookSerial} onChange={(value) => update('bookSerial', value)} />
            <Field label="Tọa độ GPS" value={form.gpsCoordinates} onChange={(value) => update('gpsCoordinates', value)} />
            <Field label="Giá chào" value={form.price} onChange={(value) => update('price', value)} inputMode="numeric" />
            <Field label="Diện tích m2" value={form.area} onChange={(value) => update('area', value)} inputMode="decimal" />
            <Select label="Pháp lý" value={form.legalStatus} onChange={(value) => update('legalStatus', value)} options={LEGAL_STATUS} />
            <Field label="Hoa hồng / thỏa thuận" value={form.commission} onChange={(value) => update('commission', value)} />
            <SelectFromOptions label="Công ty thành viên" value={form.companyUnitId} onChange={(value) => update('companyUnitId', value)} options={companyUnits} />
            <MultiOptionPicker label="Quyền xem" selectedIds={selectedVisibilityIds} options={visibilityOptions} onToggle={(id) => toggleMultiOption(id, setSelectedVisibilityIds)} />
            <MultiOptionPicker label="Đặc điểm / tag chính" selectedIds={selectedTagIds} options={propertyTags} onToggle={(id) => toggleMultiOption(id, setSelectedTagIds)} />
          </div>
        </section>
      </div>

      <section className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-[#25202a]">Mô tả chi tiết</h2>
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

      <section className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 font-black text-[#25202a]">Ảnh và tài liệu</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FileBox
            title="Ảnh duyệt nội bộ"
            desc="Sổ đỏ, hợp đồng, tự sướng với nhà. Chỉ admin/chuyên gia phụ trách xem."
            files={privateFiles}
            onChange={setPrivateFiles}
          />
          <FileBox
            title="Ảnh công khai"
            desc="Ảnh nhà dùng cho người xem theo phân quyền."
            files={publicFiles}
            onChange={setPublicFiles}
          />
        </div>
      </section>

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
            {submitting ? 'Đang gửi...' : 'Gửi duyệt'}
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
              ? duplicateRule?.message || `Có ${duplicates.length} nguồn nghi trùng. Admin sẽ xét điểm ký và tối đa 3 chuyên gia.`
              : 'Chưa thấy nguồn trùng theo dữ liệu đã nhập.'}
          </div>
        ) : null}
        <Textarea className="mt-3" label="Ghi chú nội bộ" value={form.internalNote} onChange={(value) => update('internalNote', value)} rows={3} placeholder="Cách xử lý trùng, lưu ý chủ nhà, điều kiện dẫn khách..." />
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', inputMode, className = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <input
        value={value}
        type={type}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
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

function MultiOptionPicker({ label, selectedIds, options, onToggle }: { label: string; selectedIds: string[]; options: SvpConfigOption[]; onToggle: (id: string) => void }) {
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
      {selectedIds.length ? (
        <p className="mt-1 text-[11px] font-semibold text-[#7b8190]">Đã chọn {selectedIds.length} mục.</p>
      ) : null}
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
