import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { svpAxios as api } from '../../services/svpAxios';
import { svpApi } from '../../services/svpApi';
import type { SvpConfigGroup } from '../../types/svp';
import { propertyFieldLabel } from '../../utils/fieldLabels';

const STEPS = ['Thông tin nhà', 'Pháp lý & vị trí', 'Hình ảnh'];

const emptyForm = {
  propertyType: '',
  street: '',
  ward: '',
  district: '',
  gpsCoordinates: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  direction: '',
  bookSerial: '',
  bookSheet: '',
  bookParcel: '',
  legalStatus: '',
  planningStatus: '',
  price: '',
  videoUrl: '',
  description: '',
};

export default function OwnerSubmitPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [ownerConfirm, setOwnerConfirm] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    svpApi.getConfig().then(setGroups).catch(() => setGroups([]));
  }, []);

  const label = (key: string, fallback: string) => propertyFieldLabel(groups, key, fallback);
  const update = (key: keyof typeof emptyForm, val: string) => setForm((current) => ({ ...current, [key]: val }));

  const handleSubmit = async () => {
    if (!form.propertyType || !form.street || !form.district) {
      setMessage('Vui lòng nhập loại bất động sản, số nhà/tên đường và quận/huyện trước khi gửi.');
      setStep(0);
      return;
    }
    if (!ownerConfirm) {
      setMessage('Vui lòng xác nhận thông tin đã nhập là đúng để đội Chuyên gia liên hệ xác minh.');
      setStep(2);
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const typeLabel: Record<string, string> = {
        nha_pho: 'nhà phố',
        biet_thu: 'biệt thự',
        can_ho: 'căn hộ',
        dat_nen: 'đất nền',
        nha_xuong: 'nhà xưởng',
      };
      const address = [form.street, form.ward, form.district].filter(Boolean).join(', ');
      const res = await api.post('/properties', {
        title: `Chủ nhà gửi bán ${typeLabel[form.propertyType] || 'bất động sản'} ${form.district || form.street}`,
        description: form.description,
        ownerName: user?.fullName,
        ownerPhone: user?.phone,
        bookSerial: [form.bookSerial, form.bookSheet ? `Tờ ${form.bookSheet}` : '', form.bookParcel ? `Thửa ${form.bookParcel}` : ''].filter(Boolean).join(' - '),
        price: form.price ? Number(form.price) : 0,
        areaM2: form.area ? Number(form.area) : null,
        district: form.district,
        ward: form.ward,
        address,
        statusId: 'st_new',
        extra: {
          propertyType: form.propertyType,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          direction: form.direction,
          gpsCoordinates: form.gpsCoordinates,
          bookSerial: form.bookSerial,
          bookSheet: form.bookSheet,
          bookParcel: form.bookParcel,
          legalStatus: form.legalStatus,
          planningStatus: form.planningStatus,
          videoUrl: form.videoUrl,
          ownerConfirm,
          sourceRole: 'chu_nha',
        },
      });
      const propId = res.data?.item?.id;
      if (propId && files.length) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('images', file);
          fd.append('category', 'house_image');
          await api.post(`/properties/${propId}/media-upload`, fd);
        }
      }
      navigate('/chu-nha/nha-cua-toi');
    } catch {
      setMessage('Không gửi được yêu cầu. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.');
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
      <h1 className="mb-2 text-xl font-black text-[#25202a]">Gửi nhu cầu bán nhà</h1>
      <p className="mb-4 text-sm font-medium leading-6 text-[#667085]">
        Anh/chị nhập thông tin chính trước, đội Chuyên gia sẽ kiểm tra và liên hệ xác minh.
      </p>
      {message && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{message}</div>}

      <div className="mb-6 flex items-center justify-center">
        {STEPS.map((item, index) => (
          <div key={item} className="flex items-center">
            <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${index <= step ? 'bg-[#c40012] text-white' : 'bg-gray-200 text-gray-500'}`}>{index + 1}</div>
            {index < STEPS.length - 1 && <div className={`h-0.5 w-12 ${index < step ? 'bg-[#c40012]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <p className="mb-6 text-center text-sm font-bold text-[#757575]">{STEPS[step]}</p>

      {step === 0 && (
        <div className="space-y-4">
          <select className="w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold" value={form.propertyType} onChange={(event) => update('propertyType', event.target.value)}>
            <option value="">{label('propertyType', 'Loại bất động sản')}</option>
            <option value="nha_pho">Nhà phố</option>
            <option value="biet_thu">Biệt thự</option>
            <option value="can_ho">Căn hộ</option>
            <option value="dat_nen">Đất nền</option>
            <option value="nha_xuong">Nhà xưởng</option>
          </select>
          <Field placeholder={label('street', 'Số nhà + Tên đường')} value={form.street} onChange={(value) => update('street', value)} />
          <div className="grid grid-cols-2 gap-3">
            <Field placeholder={label('ward', 'Phường/Xã')} value={form.ward} onChange={(value) => update('ward', value)} />
            <Field placeholder={label('district', 'Quận/Huyện')} value={form.district} onChange={(value) => update('district', value)} />
          </div>
          <Field placeholder={label('area', 'Diện tích (m²)')} type="number" value={form.area} onChange={(value) => update('area', value)} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field placeholder={label('gpsCoordinates', 'Tọa độ/GPS nếu có')} value={form.gpsCoordinates} onChange={(value) => update('gpsCoordinates', value)} />
          <div className="grid grid-cols-3 gap-3">
            <Field placeholder={label('bedrooms', 'Phòng ngủ')} type="number" value={form.bedrooms} onChange={(value) => update('bedrooms', value)} />
            <Field placeholder={label('bathrooms', 'WC')} type="number" value={form.bathrooms} onChange={(value) => update('bathrooms', value)} />
            <select className="min-h-12 min-w-0 rounded-2xl border border-gray-200 px-2 text-sm font-semibold" value={form.direction} onChange={(event) => update('direction', event.target.value)}>
              <option value="">{label('direction', 'Hướng')}</option>
              <option value="dong">Đông</option>
              <option value="tay">Tây</option>
              <option value="nam">Nam</option>
              <option value="bac">Bắc</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field placeholder={label('bookSheet', 'Số tờ')} value={form.bookSheet} onChange={(value) => update('bookSheet', value)} />
            <Field placeholder={label('bookParcel', 'Thửa đất')} value={form.bookParcel} onChange={(value) => update('bookParcel', value)} />
          </div>
          <Field placeholder={label('bookSerial', 'Số sổ/Seri sổ')} value={form.bookSerial} onChange={(value) => update('bookSerial', value)} />
          <select className="w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold" value={form.legalStatus} onChange={(event) => update('legalStatus', event.target.value)}>
            <option value="">{label('legalStatus', 'Tình trạng pháp lý')}</option>
            <option value="so_do">Sổ đỏ</option>
            <option value="so_hong">Sổ hồng</option>
            <option value="hop_dong">Hợp đồng/giấy tờ khác</option>
            <option value="chua_ro">Chưa rõ</option>
          </select>
          <Field placeholder={label('planningStatus', 'Thông tin quy hoạch nếu biết')} value={form.planningStatus} onChange={(value) => update('planningStatus', value)} />
          <Field placeholder={label('price', 'Giá mong muốn (VNĐ)')} type="number" value={form.price} onChange={(value) => update('price', value)} />
          <Field placeholder={label('videoUrl', 'Link video nhà nếu có')} value={form.videoUrl} onChange={(value) => update('videoUrl', value)} />
          <textarea className="h-28 w-full rounded-2xl border border-gray-200 px-3 py-3 font-semibold" placeholder={label('description', 'Mô tả thêm về nhà')} value={form.description} onChange={(event) => update('description', event.target.value)} />
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-[#c40012]">
            <Upload className="mx-auto mb-2 h-10 w-10 text-gray-400" />
            <p className="font-bold text-[#25202a]">{label('houseImages', 'Ảnh nhà')}</p>
            <p className="mt-1 text-sm text-[#757575]">Có thể chọn nhiều ảnh, định dạng JPG/PNG/WebP.</p>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
          </label>
          {files.length > 0 && <p className="mt-3 text-sm font-bold text-[#757575]">Đã chọn {files.length} ảnh</p>}
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4">
            <input
              type="checkbox"
              checked={ownerConfirm}
              onChange={(event) => setOwnerConfirm(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 accent-[#c40012]"
            />
            <span className="text-sm font-semibold leading-6 text-[#4a3b3b]">
              Tôi xác nhận thông tin đã nhập là đúng và đồng ý để Sổ Đỏ Vạn Phúc liên hệ xác minh, ký hợp đồng và phân phối bán theo quy trình.
            </span>
          </label>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-300 py-3 font-black"><ArrowLeft className="h-4 w-4" />Quay lại</button>}
        {step < 2 ? (
          <button type="button" onClick={() => setStep((current) => current + 1)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c40012] py-3 font-black text-white">Tiếp theo<ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-2xl bg-[#c40012] py-3 font-black text-white disabled:opacity-50">
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ placeholder, value, onChange, type = 'text' }: { placeholder: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <input
      className="min-h-12 w-full rounded-2xl border border-gray-200 px-3 font-semibold outline-none focus:border-[#c40012]"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
