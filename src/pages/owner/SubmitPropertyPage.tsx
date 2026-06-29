import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { svpAxios as api } from '../../services/svpAxios';

const STEPS = ['Thông tin cơ bản', 'Chi tiết', 'Hình ảnh'];

export default function OwnerSubmitPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ propertyType: '', street: '', ward: '', district: '', area: '', bedrooms: '', bathrooms: '', direction: '', price: '', description: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.propertyType || !form.street || !form.district) {
      setMessage('Vui lòng nhập loại nhà, đường và quận/huyện trước khi gửi.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const typeLabel = {
        nha_pho: 'nhà phố',
        biet_thu: 'biệt thự',
        can_ho: 'căn hộ',
        dat_nen: 'đất nền',
        nha_xuong: 'nhà xưởng',
      }[form.propertyType] || 'bất động sản';
      const address = [form.street, form.ward, form.district].filter(Boolean).join(', ');
      const res = await api.post('/properties', {
        title: `Chủ nhà gửi bán ${typeLabel} ${form.district || form.street}`,
        description: form.description,
        ownerName: user?.fullName,
        ownerPhone: user?.phone,
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
          sourceRole: 'chu_nha',
        },
      });
      const propId = res.data?.item?.id;
      if (propId && files.length) { for (const f of files) { const fd = new FormData(); fd.append('file', f); fd.append('category', 'house'); await api.post(`/properties/${propId}/media-upload`, fd); } }
      navigate('/chu-nha/nha-cua-toi');
    } catch { setMessage('Không gửi được yêu cầu. Vui lòng kiểm tra lại thông tin.'); }
    setSubmitting(false);
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Gửi nhu cầu bán nhà</h1>
      {message && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>}
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-[#D32F2F] text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-[#D32F2F]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-[#757575] mb-6">{STEPS[step]}</p>

      {step === 0 && (
        <div className="space-y-4">
          <select className="w-full border rounded-lg px-3 py-2.5" value={form.propertyType} onChange={e => update('propertyType', e.target.value)}>
            <option value="">Loại bất động sản</option>
            <option value="nha_pho">Nhà phố</option><option value="biet_thu">Biệt thự</option><option value="can_ho">Căn hộ</option><option value="dat_nen">Đất nền</option><option value="nha_xuong">Nhà xưởng</option>
          </select>
          <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Tên đường" value={form.street} onChange={e => update('street', e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Phường/Xã" value={form.ward} onChange={e => update('ward', e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Quận/Huyện" value={form.district} onChange={e => update('district', e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Diện tích (m²)" type="number" value={form.area} onChange={e => update('area', e.target.value)} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <input className="border rounded-lg px-3 py-2.5" placeholder="Phòng ngủ" type="number" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} />
            <input className="border rounded-lg px-3 py-2.5" placeholder="WC" type="number" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} />
            <select className="border rounded-lg px-3 py-2.5" value={form.direction} onChange={e => update('direction', e.target.value)}>
              <option value="">Hướng</option><option value="dong">Đông</option><option value="tay">Tây</option><option value="nam">Nam</option><option value="bac">Bắc</option>
            </select>
          </div>
          <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Giá mong muốn (VNĐ)" type="number" value={form.price} onChange={e => update('price', e.target.value)} />
          <textarea className="w-full border rounded-lg px-3 py-2.5 h-32" placeholder="Mô tả thêm về nhà..." value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#D32F2F]">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-[#757575]">Chạm để chọn ảnh hoặc kéo thả vào đây</p>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files || []))} />
          </label>
          {files.length > 0 && <p className="mt-3 text-sm text-[#757575]">Đã chọn {files.length} ảnh</p>}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5"><ArrowLeft className="w-4 h-4" />Quay lại</button>}
        {step < 2 ? (
          <button onClick={() => setStep(s => s + 1)} className="flex-1 flex items-center justify-center gap-2 bg-[#D32F2F] text-white rounded-lg py-2.5">Tiếp theo<ArrowRight className="w-4 h-4" /></button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#D32F2F] text-white rounded-lg py-2.5 font-semibold disabled:opacity-50">
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        )}
      </div>
    </div>
  );
}
