import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, UserRound, WalletCards } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { useAuth } from '../../contexts/AuthContext';

export default function AddCustomerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    source: 'online',
    districts: '',
    budgetMin: '',
    budgetMax: '',
    areaMin: '',
    areaMax: '',
    propertyType: '',
    note: '',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) {
      setMessage('Vui lòng nhập họ tên và số điện thoại khách hàng.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const created = await api.post('/customers', {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        source: form.source,
        statusId: 'cs_new',
        assignedUserId: user?.id,
        note: form.note.trim(),
      });
      const customerId = created.data?.item?.id;
      if (customerId && hasNeedInfo(form)) {
        await api.post('/customer-needs', {
          customerId,
          districtIds: splitList(form.districts),
          budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
          areaMin: form.areaMin ? Number(form.areaMin) : null,
          areaMax: form.areaMax ? Number(form.areaMax) : null,
          tagIds: form.propertyType ? [form.propertyType] : [],
          description: form.note.trim(),
          statusId: 'new',
        });
      }
      navigate('/chuyen-vien/khach-hang');
    } catch {
      setMessage('Chưa lưu được khách hàng. Vui lòng kiểm tra lại thông tin và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[#747b88]">
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Cộng tác viên</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Thêm khách mua</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">
          Ghi nhận khách, ngân sách và khu vực quan tâm để đối soát nhu cầu, tìm nguồn nhà phù hợp.
        </p>
      </section>

      {message && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[#c40012]">
          {message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
          <SectionTitle icon={UserRound} title="Thông tin khách hàng" desc="Các thông tin dùng để liên hệ và chống trùng dữ liệu." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Họ và tên" value={form.fullName} onChange={(value) => update('fullName', value)} placeholder="Họ tên khách hàng" required />
            <Field label="Số điện thoại" value={form.phone} onChange={(value) => update('phone', value)} placeholder="Số điện thoại" required inputMode="tel" />
            <Field label="Email" value={form.email} onChange={(value) => update('email', value)} placeholder="Email" type="email" />
            <label>
              <span className="mb-1 block text-xs font-black text-[#6f5a5a]">Nguồn khách</span>
              <select value={form.source} onChange={(event) => update('source', event.target.value)} className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#c40012]">
                <option value="online">Online</option>
                <option value="referral">Giới thiệu</option>
                <option value="direct">Trực tiếp</option>
                <option value="zalo">Zalo/Facebook</option>
                <option value="other">Khác</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
          <SectionTitle icon={WalletCards} title="Nhu cầu mua" desc="Nhập càng rõ, bước tìm nhà càng nhanh." />
          <div className="mt-4 space-y-3">
            <Field label="Khu vực mong muốn" value={form.districts} onChange={(value) => update('districts', value)} placeholder="Bình Thạnh, Gò Vấp..." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngân sách từ" value={form.budgetMin} onChange={(value) => update('budgetMin', value)} placeholder="5000000000" type="number" />
              <Field label="Ngân sách đến" value={form.budgetMax} onChange={(value) => update('budgetMax', value)} placeholder="7000000000" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Diện tích từ" value={form.areaMin} onChange={(value) => update('areaMin', value)} placeholder="50" type="number" />
              <Field label="Diện tích đến" value={form.areaMax} onChange={(value) => update('areaMax', value)} placeholder="90" type="number" />
            </div>
            <Field label="Đặc điểm chính" value={form.propertyType} onChange={(value) => update('propertyType', value)} placeholder="Ô tô, mặt tiền, dòng tiền..." />
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <label>
          <span className="mb-1 block text-xs font-black text-[#6f5a5a]">Ghi chú tư vấn</span>
          <textarea
            value={form.note}
            onChange={(event) => update('note', event.target.value)}
            placeholder="Nhu cầu chi tiết, thời gian cần mua, yêu cầu riêng..."
            className="min-h-28 w-full rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#c40012]"
          />
        </label>
      </section>

      <div className="sticky bottom-20 z-10 mt-4 rounded-3xl bg-white/90 p-3 shadow-lg ring-1 ring-gray-100 backdrop-blur sm:bottom-4">
        <button
          onClick={submit}
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-5 text-sm font-black text-white disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu khách hàng
        </button>
      </div>
    </div>
  );
}

function hasNeedInfo(form: Record<string, string>) {
  return ['districts', 'budgetMin', 'budgetMax', 'areaMin', 'areaMax', 'propertyType', 'note'].some((key) => form[key]?.trim());
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-black text-[#25202a]">{title}</h2>
        <p className="mt-1 text-sm font-medium leading-5 text-[#747b88]">{desc}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal' | 'search' | 'url';
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black text-[#6f5a5a]">
        {label} {required && <span className="text-[#c40012]">*</span>}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
    </label>
  );
}
