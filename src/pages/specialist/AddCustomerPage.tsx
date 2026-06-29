import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { svpAxios as api } from '../../services/svpAxios';
import { useAuth } from '../../contexts/AuthContext';

export default function AddCustomerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', source: 'online',
    districts: '', budgetMin: '', budgetMax: '', areaMin: '', areaMax: '',
    propertyType: '', note: '',
  });
  const [message, setMessage] = useState('');

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.fullName || !form.phone) {
      setMessage('Vui lòng nhập họ tên và số điện thoại khách hàng.');
      return;
    }
    setMessage('');
    try {
      const created = await api.post('/customers', {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        source: form.source,
        statusId: 'cs_new',
        assignedUserId: user?.id,
        note: form.note,
      });
      const customerId = created.data?.item?.id;
      if (customerId && (form.districts || form.budgetMin || form.budgetMax || form.areaMin || form.areaMax || form.propertyType)) {
        await api.post('/customer-needs', {
          customerId,
          districtIds: form.districts ? form.districts.split(',').map(s => s.trim()).filter(Boolean) : [],
          budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
          areaMin: form.areaMin ? Number(form.areaMin) : null,
          areaMax: form.areaMax ? Number(form.areaMax) : null,
          tagIds: form.propertyType ? [form.propertyType] : [],
          description: form.note,
          statusId: 'new',
        });
      }
      navigate('/chuyen-vien/khach-hang');
    } catch {
      setMessage('Không lưu được khách hàng. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Thêm khách mới</h1>
      {message && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>}
      <div className="space-y-4">
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Họ tên *" value={form.fullName} onChange={e => u('fullName', e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Số điện thoại *" value={form.phone} onChange={e => u('phone', e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Email" value={form.email} onChange={e => u('email', e.target.value)} />
        <select className="w-full border rounded-lg px-3 py-2.5" value={form.source} onChange={e => u('source', e.target.value)}>
          <option value="online">Online</option>
          <option value="referral">Giới thiệu</option>
          <option value="direct">Trực tiếp</option>
          <option value="other">Khác</option>
        </select>

        <h3 className="font-semibold mt-4">Nhu cầu</h3>
        <input className="w-full border rounded-lg px-3 py-2.5" placeholder="Khu vực mong muốn" value={form.districts} onChange={e => u('districts', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2.5" placeholder="Ngân sách từ" type="number" value={form.budgetMin} onChange={e => u('budgetMin', e.target.value)} />
          <input className="border rounded-lg px-3 py-2.5" placeholder="Ngân sách đến" type="number" value={form.budgetMax} onChange={e => u('budgetMax', e.target.value)} />
        </div>
        <textarea className="w-full border rounded-lg px-3 py-2.5 h-20" placeholder="Ghi chú" value={form.note} onChange={e => u('note', e.target.value)} />
        <button onClick={submit} className="w-full bg-[#D32F2F] text-white rounded-lg py-2.5 font-semibold">Lưu</button>
      </div>
    </div>
  );
}
