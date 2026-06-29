import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, Sparkles, AlertTriangle } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { apiPost } from '../../services/apiClient';

const STEPS = ['Chủ nhà', 'Thông tin nhà', 'Pháp lý & Giá', 'Hình ảnh', 'Xác nhận'];

export default function ExpertAddPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [aiDesc, setAiDesc] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    ownerName: '', ownerPhone: '', ownerCccd: '', ownerNote: '',
    title: '', propertyType: '', street: '', ward: '', district: '', area: '', bedrooms: '', bathrooms: '', floors: '', direction: '',
    bookSerial: '', legalStatus: '', price: '', commission: '', commissionNote: '', internalNote: '',
    description: '',
  });
  const [files, setFiles] = useState<{ house: File[]; book: File[]; contract: File[]; selfie: File[] }>({ house: [], book: [], contract: [], selfie: [] });

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const checkDuplicate = async () => {
    try { const r = await api.post('/properties/check-duplicate', { address: `${form.street} ${form.ward} ${form.district}`, bookSerial: form.bookSerial, ownerPhone: form.ownerPhone }); setDuplicates(r.data?.matches || []); } catch { setDuplicates([]); }
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
        amenities: [form.direction, form.legalStatus].filter(Boolean).join(', '),
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
      setMessage('Vui lòng nhập chủ nhà, số điện thoại, tiêu đề, đường và quận/huyện.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        bookSerial: form.bookSerial,
        price: form.price ? Number(form.price) : 0,
        areaM2: form.area ? Number(form.area) : null,
        district: form.district,
        ward: form.ward,
        address: [form.street, form.ward, form.district].filter(Boolean).join(', '),
        statusId: 'st_new',
        expertId: user?.id,
        extra: {
          ownerCccd: form.ownerCccd,
          ownerNote: form.ownerNote,
          propertyType: form.propertyType,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          floors: form.floors,
          direction: form.direction,
          legalStatus: form.legalStatus,
          commission: form.commission,
          commissionNote: form.commissionNote,
          internalNote: form.internalNote,
          sourceRole: 'chuyen_gia',
          saveMode: isDraft ? 'draft' : 'submit',
        },
      };
      const r = await api.post('/properties', payload);
      const id = r.data?.item?.id;
      if (id) { for (const [cat, list] of Object.entries(files)) { for (const f of list) { const fd = new FormData(); fd.append('file', f); fd.append('category', cat); await api.post(`/properties/${id}/media-upload`, fd); } } }
      navigate('/chuyen-gia/kho-nha');
    } catch { setMessage('Không lưu được nhà. Vui lòng kiểm tra lại dữ liệu.'); }
    setSubmitting(false);
  };

  const addFiles = (cat: keyof typeof files, newFiles: FileList | null) => { if (newFiles) setFiles(f => ({ ...f, [cat]: [...f[cat], ...Array.from(newFiles)] })); };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Đăng nhà mới</h1>
      {message && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>}
      <div className="flex items-center justify-center mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (<div key={s} className="flex items-center"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= step ? 'bg-[#D32F2F] text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>{i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-[#D32F2F]' : 'bg-gray-200'}`} />}</div>))}
      </div>
      <p className="text-center text-sm text-[#757575] mb-6">{STEPS[step]}</p>

      {step === 0 && (<div className="space-y-4">
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Tên chủ nhà *" value={form.ownerName} onChange={e => u('ownerName', e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="SĐT chủ nhà *" value={form.ownerPhone} onChange={e => u('ownerPhone', e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="CCCD/CMND" value={form.ownerCccd} onChange={e => u('ownerCccd', e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2.5 h-20" placeholder="Ghi chú về chủ nhà" value={form.ownerNote} onChange={e => u('ownerNote', e.target.value)} />
      </div>)}

      {step === 1 && (<div className="space-y-4">
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Tiêu đề tin *" value={form.title} onChange={e => u('title', e.target.value)} />
        <select className="w-full border rounded-lg px-3 py-2.5" value={form.propertyType} onChange={e => u('propertyType', e.target.value)}>
          <option value="">Loại BĐS</option><option value="nha_pho">Nhà phố</option><option value="biet_thu">Biệt thự</option><option value="can_ho">Căn hộ</option><option value="dat_nen">Đất nền</option><option value="nha_xuong">Nhà xưởng</option>
        </select>
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Số nhà + Tên đường" value={form.street} onChange={e => u('street', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2.5" placeholder="Phường/Xã" value={form.ward} onChange={e => u('ward', e.target.value)} />
          <input className="border rounded-lg px-3 py-2.5" placeholder="Quận/Huyện" value={form.district} onChange={e => u('district', e.target.value)} />
        </div>
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Diện tích (m²)" type="number" value={form.area} onChange={e => u('area', e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2.5" placeholder="PN" type="number" value={form.bedrooms} onChange={e => u('bedrooms', e.target.value)} />
          <input className="border rounded-lg px-3 py-2.5" placeholder="WC" type="number" value={form.bathrooms} onChange={e => u('bathrooms', e.target.value)} />
          <input className="border rounded-lg px-3 py-2.5" placeholder="Tầng" type="number" value={form.floors} onChange={e => u('floors', e.target.value)} />
        </div>
        <select className="w-full border rounded-lg px-3 py-2.5" value={form.direction} onChange={e => u('direction', e.target.value)}>
          <option value="">Hướng nhà</option><option value="dong">Đông</option><option value="tay">Tây</option><option value="nam">Nam</option><option value="bac">Bắc</option><option value="dong_bac">Đông Bắc</option><option value="dong_nam">Đông Nam</option><option value="tay_bac">Tây Bắc</option><option value="tay_nam">Tây Nam</option>
        </select>
      </div>)}

      {step === 2 && (<div className="space-y-4">
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Số tờ / Số thửa" value={form.bookSerial} onChange={e => u('bookSerial', e.target.value)} />
        <select className="w-full border rounded-lg px-3 py-2.5" value={form.legalStatus} onChange={e => u('legalStatus', e.target.value)}>
          <option value="">Tình trạng pháp lý</option><option value="so_do">Sổ đỏ</option><option value="so_hong">Sổ hồng</option><option value="gpxd">GPXD</option><option value="hop_dong">Hợp đồng</option><option value="chua_co">Chưa có sổ</option>
        </select>
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Giá chào (VNĐ)" type="number" value={form.price} onChange={e => u('price', e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Hoa hồng (%)" type="number" value={form.commission} onChange={e => u('commission', e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Ghi chú hoa hồng" value={form.commissionNote} onChange={e => u('commissionNote', e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2.5 h-20" placeholder="Ghi chú nội bộ" value={form.internalNote} onChange={e => u('internalNote', e.target.value)} />
      </div>)}

      {step === 3 && (<div className="space-y-4">
        {(['house', 'book', 'contract', 'selfie'] as const).map(cat => (
          <div key={cat}>
            <p className="font-medium mb-2">{cat === 'house' ? 'Ảnh nhà' : cat === 'book' ? 'Ảnh sổ (đỏ/hồng)' : cat === 'contract' ? 'Hợp đồng' : 'Ảnh selfie với chủ nhà'}</p>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#D32F2F]">
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" /><span className="text-sm text-[#757575]">Chọn ảnh</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(cat, e.target.files)} />
            </label>
            {files[cat].length > 0 && <p className="text-xs text-[#757575] mt-1">Đã chọn {files[cat].length} ảnh</p>}
          </div>
        ))}
      </div>)}

      {step === 4 && (<div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3">Tóm tắt thông tin</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-[#757575]">Chủ nhà:</span> {form.ownerName} - {form.ownerPhone}</p>
            <p><span className="text-[#757575]">Tiêu đề:</span> {form.title}</p>
            <p><span className="text-[#757575]">Địa chỉ:</span> {form.street}, {form.ward}, {form.district}</p>
            <p><span className="text-[#757575]">DT:</span> {form.area}m² · {form.bedrooms}PN · {form.bathrooms}WC</p>
            <p><span className="text-[#757575]">Giá:</span> {form.price ? Number(form.price).toLocaleString() + ' VNĐ' : '—'}</p>
            <p><span className="text-[#757575]">Pháp lý:</span> {form.legalStatus || '—'}</p>
          </div>
        </div>
        <button onClick={checkDuplicate} className="w-full border border-amber-500 text-amber-700 rounded-lg py-2.5 font-medium flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4" />Kiểm tra trùng</button>
        {duplicates.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">Tìm thấy {duplicates.length} nhà trùng khớp!</div>}
        <button onClick={generateAiDesc} className="w-full border border-[#D32F2F] text-[#D32F2F] rounded-lg py-2.5 font-medium flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" />AI viết mô tả</button>
        {aiDesc && <textarea className="w-full border rounded-lg px-3 py-2.5 h-24" value={form.description} onChange={e => u('description', e.target.value)} />}
      </div>)}

      <div className="flex gap-3 mt-6">
        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5"><ArrowLeft className="w-4 h-4" />Quay lại</button>}
        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)} className="flex-1 flex items-center justify-center gap-2 bg-[#D32F2F] text-white rounded-lg py-2.5">Tiếp theo<ArrowRight className="w-4 h-4" /></button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button onClick={() => handleSubmit(true)} className="flex-1 border border-gray-300 rounded-lg py-2.5">Lưu nháp</button>
            <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex-1 bg-[#D32F2F] text-white rounded-lg py-2.5 font-semibold disabled:opacity-50">{submitting ? 'Đang gửi...' : 'Gửi duyệt'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
