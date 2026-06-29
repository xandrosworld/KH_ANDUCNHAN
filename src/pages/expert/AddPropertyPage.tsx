import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Sparkles, Upload } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { apiPost } from '../../services/apiClient';
import { svpApi } from '../../services/svpApi';
import type { SvpConfigGroup } from '../../types/svp';
import { propertyFieldLabel } from '../../utils/fieldLabels';

const STEPS = ['Chủ nhà', 'Thông tin nhà', 'Pháp lý & Giá', 'Hình ảnh', 'Xác nhận'];

const emptyForm = {
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  ownerCccd: '',
  ownerNote: '',
  title: '',
  propertyType: '',
  street: '',
  ward: '',
  district: '',
  gpsCoordinates: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  floors: '',
  direction: '',
  bookSerial: '',
  bookSheet: '',
  bookParcel: '',
  legalStatus: '',
  planningStatus: '',
  price: '',
  commission: '',
  commissionNote: '',
  contractStatus: '',
  hiddenAddress: '',
  internalNote: '',
  videoUrl: '',
  description: '',
};

type FileBucket = 'house' | 'book' | 'contract' | 'selfie';
type VerificationKey = 'ownerIdentity' | 'duplicateChecked' | 'legalDocs' | 'planningChecked' | 'commissionAgreed' | 'readyToDistribute';

const VERIFICATION_ITEMS: Array<{ key: VerificationKey; label: string }> = [
  { key: 'ownerIdentity', label: 'Đã xác minh đúng chủ nhà/người được ủy quyền' },
  { key: 'duplicateChecked', label: 'Đã kiểm tra trùng theo SĐT, địa chỉ, GPS, số tờ/thửa' },
  { key: 'legalDocs', label: 'Đã kiểm tra hoặc ghi nhận tình trạng giấy tờ/sổ' },
  { key: 'planningChecked', label: 'Đã kiểm tra hoặc ghi rõ tình trạng quy hoạch' },
  { key: 'commissionAgreed', label: 'Đã thống nhất hoa hồng/thỏa thuận trích thưởng' },
  { key: 'readyToDistribute', label: 'Thông tin đủ điều kiện gửi duyệt/phân phối bán' },
];

export default function ExpertAddPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [verification, setVerification] = useState<Record<VerificationKey, boolean>>({
    ownerIdentity: false,
    duplicateChecked: false,
    legalDocs: false,
    planningChecked: false,
    commissionAgreed: false,
    readyToDistribute: false,
  });
  const [files, setFiles] = useState<Record<FileBucket, File[]>>({ house: [], book: [], contract: [], selfie: [] });

  useEffect(() => {
    svpApi.getConfig().then(setGroups).catch(() => setGroups([]));
  }, []);

  const fieldLabel = (key: string, fallback: string) => propertyFieldLabel(groups, key, fallback);
  const u = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (['ownerPhone', 'street', 'ward', 'district', 'gpsCoordinates', 'bookSerial', 'bookSheet', 'bookParcel'].includes(key)) {
      setDuplicateChecked(false);
      setDuplicates([]);
      setVerification((current) => ({ ...current, duplicateChecked: false }));
    }
  };
  const toggleVerification = (key: VerificationKey) => setVerification((current) => ({ ...current, [key]: !current[key] }));

  const checkDuplicate = async () => {
    try {
      const response = await api.post('/properties/check-duplicate', {
        address: [form.street, form.ward, form.district].filter(Boolean).join(', '),
        bookSerial: form.bookSerial,
        bookSheet: form.bookSheet,
        bookParcel: form.bookParcel,
        ownerPhone: form.ownerPhone,
        gpsCoordinates: form.gpsCoordinates,
      });
      setDuplicates(response.data?.matches || []);
      setDuplicateChecked(true);
      setVerification((current) => ({ ...current, duplicateChecked: true }));
    } catch {
      setDuplicates([]);
      setDuplicateChecked(false);
    }
  };

  const generateAiDesc = async () => {
    try {
      const result = await apiPost<{ description: string }>('/api/ai/description', {
        title: form.title,
        propertyType: form.propertyType,
        price: form.price,
        sqft: form.area,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        address: [form.street, form.ward].filter(Boolean).join(', '),
        city: form.district,
        amenities: [form.direction, form.legalStatus, form.planningStatus].filter(Boolean).join(', '),
        notes: form.internalNote || form.ownerNote,
      });
      const description = result.ok ? result.data?.description || '' : '';
      setAiDesc(description);
      if (description) u('description', description);
    } catch {
      setAiDesc('');
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!form.ownerName || !form.ownerPhone || !form.title || !form.street || !form.district) {
      setMessage('Vui lòng nhập chủ nhà, số điện thoại, tiêu đề, số nhà/tên đường và quận/huyện.');
      setStep(0);
      return;
    }
    if (!isDraft) {
      if (!duplicateChecked) {
        setMessage('Vui lòng bấm kiểm tra trùng trước khi gửi duyệt nguồn nhà.');
        setStep(4);
        return;
      }
      const missingChecks = VERIFICATION_ITEMS.filter((item) => !verification[item.key]).map((item) => item.label);
      if (missingChecks.length) {
        setMessage('Vui lòng hoàn tất checklist xác minh trước khi gửi duyệt.');
        setStep(4);
        return;
      }
      if (duplicates.length > 0 && !form.internalNote.trim()) {
        setMessage('Nguồn có dấu hiệu trùng. Vui lòng ghi hướng xử lý trong ghi chú nội bộ trước khi gửi duyệt.');
        setStep(2);
        return;
      }
    }
    setSubmitting(true);
    setMessage('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        bookSerial: [form.bookSerial, form.bookSheet ? `Tờ ${form.bookSheet}` : '', form.bookParcel ? `Thửa ${form.bookParcel}` : ''].filter(Boolean).join(' - '),
        price: form.price ? Number(form.price) : 0,
        areaM2: form.area ? Number(form.area) : null,
        district: form.district,
        ward: form.ward,
        address: [form.street, form.ward, form.district].filter(Boolean).join(', '),
        hiddenAddress: form.hiddenAddress,
        statusId: isDraft ? 'st_new' : 'st_new',
        expertId: user?.id,
        extra: {
          ownerCccd: form.ownerCccd,
          ownerEmail: form.ownerEmail,
          ownerNote: form.ownerNote,
          propertyType: form.propertyType,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          floors: form.floors,
          direction: form.direction,
          gpsCoordinates: form.gpsCoordinates,
          bookSerial: form.bookSerial,
          bookSheet: form.bookSheet,
          bookParcel: form.bookParcel,
          legalStatus: form.legalStatus,
          planningStatus: form.planningStatus,
          commission: form.commission,
          commissionNote: form.commissionNote,
          contractStatus: form.contractStatus,
          internalNote: form.internalNote,
          videoUrl: form.videoUrl,
          duplicateChecked,
          duplicateMatches: duplicates.length,
          verificationChecklist: verification,
          sourceRole: 'chuyen_gia',
          saveMode: isDraft ? 'draft' : 'submit',
        },
      };
      const response = await api.post('/properties', payload);
      const id = response.data?.item?.id;
      if (id) {
        const categoryMap: Record<FileBucket, string> = {
          house: 'house_image',
          book: 'red_book',
          contract: 'contract_document',
          selfie: 'owner_selfie',
        };
        for (const [category, list] of Object.entries(files) as Array<[FileBucket, File[]]>) {
          for (const file of list) {
            const fd = new FormData();
            fd.append('images', file);
            fd.append('category', categoryMap[category]);
            await api.post(`/properties/${id}/media-upload`, fd);
          }
        }
      }
      navigate('/chuyen-gia/kho-nha');
    } catch {
      setMessage('Không lưu được nhà. Vui lòng kiểm tra lại dữ liệu.');
    }
    setSubmitting(false);
  };

  const addFiles = (bucket: FileBucket, newFiles: FileList | null) => {
    if (newFiles) setFiles((current) => ({ ...current, [bucket]: [...current[bucket], ...Array.from(newFiles)] }));
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
      <h1 className="mb-2 text-xl font-black text-[#25202a]">Đăng nhà mới</h1>
      <p className="mb-4 text-sm font-medium leading-6 text-[#667085]">
        Nhập đủ thông tin để hệ thống kiểm tra trùng, lưu pháp lý và phân quyền hiển thị về sau.
      </p>
      {message && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{message}</div>}

      <div className="mb-6 flex items-center justify-start overflow-x-auto pb-1">
        {STEPS.map((item, index) => (
          <div key={item} className="flex shrink-0 items-center">
            <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${index <= step ? 'bg-[#c40012] text-white' : 'bg-gray-200 text-gray-500'}`}>{index + 1}</div>
            {index < STEPS.length - 1 && <div className={`h-0.5 w-7 ${index < step ? 'bg-[#c40012]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <p className="mb-6 text-center text-sm font-bold text-[#757575]">{STEPS[step]}</p>

      {step === 0 && (
        <div className="space-y-4">
          <Field placeholder={`${fieldLabel('ownerName', 'Tên chủ nhà')} *`} value={form.ownerName} onChange={(value) => u('ownerName', value)} />
          <Field placeholder={`${fieldLabel('ownerPhone', 'SĐT chủ nhà')} *`} value={form.ownerPhone} onChange={(value) => u('ownerPhone', value)} />
          <Field placeholder={fieldLabel('ownerEmail', 'Email chủ nhà nếu có')} value={form.ownerEmail} onChange={(value) => u('ownerEmail', value)} type="email" />
          <Field placeholder={fieldLabel('ownerCccd', 'CCCD/CMND chủ nhà')} value={form.ownerCccd} onChange={(value) => u('ownerCccd', value)} />
          <textarea className="h-24 w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold outline-none focus:border-[#c40012]" placeholder={fieldLabel('ownerNote', 'Ghi chú về chủ nhà')} value={form.ownerNote} onChange={(event) => u('ownerNote', event.target.value)} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field placeholder={`${fieldLabel('title', 'Tiêu đề tin')} *`} value={form.title} onChange={(value) => u('title', value)} />
          <select className="w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold" value={form.propertyType} onChange={(event) => u('propertyType', event.target.value)}>
            <option value="">{fieldLabel('propertyType', 'Loại bất động sản')}</option>
            <option value="nha_pho">Nhà phố</option>
            <option value="biet_thu">Biệt thự</option>
            <option value="can_ho">Căn hộ</option>
            <option value="dat_nen">Đất nền</option>
            <option value="nha_xuong">Nhà xưởng</option>
          </select>
          <Field placeholder={`${fieldLabel('street', 'Số nhà + Tên đường')} *`} value={form.street} onChange={(value) => u('street', value)} />
          <div className="grid grid-cols-2 gap-3">
            <Field placeholder={fieldLabel('ward', 'Phường/Xã')} value={form.ward} onChange={(value) => u('ward', value)} />
            <Field placeholder={`${fieldLabel('district', 'Quận/Huyện')} *`} value={form.district} onChange={(value) => u('district', value)} />
          </div>
          <Field placeholder={fieldLabel('gpsCoordinates', 'Tọa độ/GPS')} value={form.gpsCoordinates} onChange={(value) => u('gpsCoordinates', value)} />
          <Field placeholder={fieldLabel('area', 'Diện tích (m²)')} type="number" value={form.area} onChange={(value) => u('area', value)} />
          <div className="grid grid-cols-3 gap-3">
            <Field placeholder={fieldLabel('bedrooms', 'PN')} type="number" value={form.bedrooms} onChange={(value) => u('bedrooms', value)} />
            <Field placeholder={fieldLabel('bathrooms', 'WC')} type="number" value={form.bathrooms} onChange={(value) => u('bathrooms', value)} />
            <Field placeholder={fieldLabel('floors', 'Tầng')} type="number" value={form.floors} onChange={(value) => u('floors', value)} />
          </div>
          <select className="w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold" value={form.direction} onChange={(event) => u('direction', event.target.value)}>
            <option value="">{fieldLabel('direction', 'Hướng nhà')}</option>
            <option value="dong">Đông</option>
            <option value="tay">Tây</option>
            <option value="nam">Nam</option>
            <option value="bac">Bắc</option>
            <option value="dong_bac">Đông Bắc</option>
            <option value="dong_nam">Đông Nam</option>
            <option value="tay_bac">Tây Bắc</option>
            <option value="tay_nam">Tây Nam</option>
          </select>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field placeholder={fieldLabel('bookSheet', 'Số tờ')} value={form.bookSheet} onChange={(value) => u('bookSheet', value)} />
            <Field placeholder={fieldLabel('bookParcel', 'Thửa đất')} value={form.bookParcel} onChange={(value) => u('bookParcel', value)} />
          </div>
          <Field placeholder={fieldLabel('bookSerial', 'Số sổ/Seri sổ')} value={form.bookSerial} onChange={(value) => u('bookSerial', value)} />
          <select className="w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold" value={form.legalStatus} onChange={(event) => u('legalStatus', event.target.value)}>
            <option value="">{fieldLabel('legalStatus', 'Tình trạng pháp lý')}</option>
            <option value="so_do">Sổ đỏ</option>
            <option value="so_hong">Sổ hồng</option>
            <option value="gpxd">GPXD</option>
            <option value="hop_dong">Hợp đồng</option>
            <option value="chua_co">Chưa có sổ</option>
          </select>
          <Field placeholder={fieldLabel('planningStatus', 'Thông tin quy hoạch')} value={form.planningStatus} onChange={(value) => u('planningStatus', value)} />
          <Field placeholder={fieldLabel('price', 'Giá chào (VNĐ)')} type="number" value={form.price} onChange={(value) => u('price', value)} />
          <Field placeholder={fieldLabel('commission', 'Hoa hồng')} value={form.commission} onChange={(value) => u('commission', value)} />
          <Field placeholder={fieldLabel('commissionNote', 'Ghi chú hoa hồng')} value={form.commissionNote} onChange={(value) => u('commissionNote', value)} />
          <Field placeholder={fieldLabel('contractStatus', 'Hợp đồng trích thưởng/tình trạng ký')} value={form.contractStatus} onChange={(value) => u('contractStatus', value)} />
          <textarea className="h-20 w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold outline-none focus:border-[#c40012]" placeholder="Địa chỉ chi tiết/phần cần bảo mật" value={form.hiddenAddress} onChange={(event) => u('hiddenAddress', event.target.value)} />
          <textarea className="h-24 w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold outline-none focus:border-[#c40012]" placeholder={fieldLabel('internalNote', 'Ghi chú nội bộ')} value={form.internalNote} onChange={(event) => u('internalNote', event.target.value)} />
          <Field placeholder={fieldLabel('videoUrl', 'Link video nhà nếu có')} value={form.videoUrl} onChange={(value) => u('videoUrl', value)} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {([
            ['house', fieldLabel('houseImages', 'Ảnh nhà')],
            ['book', fieldLabel('bookImages', 'Ảnh sổ đỏ/sổ hồng')],
            ['contract', fieldLabel('contractImages', 'Hợp đồng/tài liệu')],
            ['selfie', fieldLabel('ownerSelfie', 'Ảnh selfie với chủ nhà')],
          ] as Array<[FileBucket, string]>).map(([bucket, title]) => (
            <div key={bucket}>
              <p className="mb-2 font-black text-[#25202a]">{title}</p>
              <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-gray-300 p-4 text-center hover:border-[#c40012]">
                <Upload className="mx-auto mb-1 h-6 w-6 text-gray-400" />
                <span className="text-sm font-bold text-[#757575]">Chọn ảnh</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => addFiles(bucket, event.target.files)} />
              </label>
              {files[bucket].length > 0 && <p className="mt-1 text-xs font-bold text-[#757575]">Đã chọn {files[bucket].length} ảnh</p>}
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-black text-[#25202a]">Tóm tắt thông tin</h3>
            <div className="space-y-2 text-sm font-semibold text-[#25202a]">
              <p><span className="text-[#757575]">Chủ nhà:</span> {form.ownerName} - {form.ownerPhone}</p>
              <p><span className="text-[#757575]">Tiêu đề:</span> {form.title}</p>
              <p><span className="text-[#757575]">Địa chỉ:</span> {form.street}, {form.ward}, {form.district}</p>
              <p><span className="text-[#757575]">Sổ:</span> {[form.bookSerial, form.bookSheet && `Tờ ${form.bookSheet}`, form.bookParcel && `Thửa ${form.bookParcel}`].filter(Boolean).join(' - ') || 'Chưa nhập'}</p>
              <p><span className="text-[#757575]">DT:</span> {form.area || '-'}m² · {form.bedrooms || '-'}PN · {form.bathrooms || '-'}WC</p>
              <p><span className="text-[#757575]">Giá:</span> {form.price ? `${Number(form.price).toLocaleString()} VNĐ` : '-'}</p>
              <p><span className="text-[#757575]">Pháp lý:</span> {form.legalStatus || '-'}</p>
            </div>
          </div>
          <button type="button" onClick={checkDuplicate} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500 py-3 font-black text-amber-700"><AlertTriangle className="h-4 w-4" />Kiểm tra trùng</button>
          {duplicateChecked && duplicates.length === 0 && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Chưa phát hiện nguồn trùng theo dữ liệu đã nhập.</div>}
          {duplicates.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">Tìm thấy {duplicates.length} nhà trùng/gần trùng. Cần ghi hướng xử lý trong ghi chú nội bộ.</div>}
          <button type="button" onClick={generateAiDesc} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c40012] py-3 font-black text-[#c40012]"><Sparkles className="h-4 w-4" />AI viết mô tả</button>
          {(aiDesc || form.description) && <textarea className="h-28 w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold" placeholder={fieldLabel('description', 'Mô tả thêm về nhà')} value={form.description} onChange={(event) => u('description', event.target.value)} />}
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-black text-[#25202a]">Checklist xác minh nguồn</h3>
            <div className="space-y-2">
              {VERIFICATION_ITEMS.map((item) => (
                <label key={item.key} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#fffaf7] p-3">
                  <input
                    type="checkbox"
                    checked={verification[item.key]}
                    onChange={() => toggleVerification(item.key)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 accent-[#c40012]"
                  />
                  <span className="text-sm font-semibold leading-6 text-[#4a3b3b]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-300 py-3 font-black"><ArrowLeft className="h-4 w-4" />Quay lại</button>}
        {step < 4 ? (
          <button type="button" onClick={() => setStep((current) => current + 1)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c40012] py-3 font-black text-white">Tiếp theo<ArrowRight className="h-4 w-4" /></button>
        ) : (
          <div className="flex flex-1 gap-2">
            <button type="button" onClick={() => handleSubmit(true)} className="flex-1 rounded-2xl border border-gray-300 py-3 font-black">Lưu nháp</button>
            <button type="button" onClick={() => handleSubmit(false)} disabled={submitting} className="flex-1 rounded-2xl bg-[#c40012] py-3 font-black text-white disabled:opacity-50">{submitting ? 'Đang gửi...' : 'Gửi duyệt'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ placeholder, value, onChange, type = 'text' }: { placeholder: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <input
      className="min-h-12 min-w-0 w-full rounded-2xl border border-gray-200 px-3 font-semibold outline-none focus:border-[#c40012]"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
