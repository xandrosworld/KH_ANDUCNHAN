import { useState, type InputHTMLAttributes } from 'react';
import { CheckCircle2, Home, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { svpApi } from '../../services/svpApi';

const PROVINCES = ['TP.HCM', 'Hà Nội', 'Đồng Nai', 'Bình Dương', 'Long An', 'Bà Rịa - Vũng Tàu'];
const DISTRICTS = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Tân Phú', 'Thủ Đức', 'Bình Tân', 'Nhà Bè', 'Hóc Môn'];
const WARDS = ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 10', 'Phường 12', 'Phường 15', 'Phường 17', 'Hiệp Bình Chánh', 'Linh Đông', 'Tân Sơn Nhì'];

const LEGAL_OPTIONS = [
  { value: 'so_do_so_hong', label: 'Có sổ đỏ / sổ hồng' },
  { value: 'giay_tay_hop_dong', label: 'Giấy tay / hợp đồng' },
  { value: 'dang_hoan_thien', label: 'Đang hoàn thiện pháp lý' },
  { value: 'chua_ro', label: 'Chưa rõ, cần chuyên gia kiểm tra' },
];

const RELATION_OPTIONS = [
  { value: 'chinh_chu', label: 'Tôi là chính chủ' },
  { value: 'nguoi_than', label: 'Người thân của chủ nhà' },
  { value: 'uy_quyen', label: 'Được chủ nhà ủy quyền' },
  { value: 'nguon_gioi_thieu', label: 'Tôi giới thiệu nguồn' },
];

const initialForm = {
  expectedPrice: '',
  province: 'TP.HCM',
  district: '',
  ward: '',
  legalStatus: '',
  ownerRelation: '',
  note: '',
};

export default function OwnerSubmitPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const update = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.expectedPrice || !form.province || !form.district || !form.legalStatus || !form.ownerRelation) {
      setMessage('Vui lòng nhập giá dự kiến, khu vực, pháp lý và vai trò của anh/chị với bất động sản.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const location = [form.ward, form.district, form.province].filter(Boolean).join(', ');
      await svpApi.createProperty({
        title: `Chủ nhà gửi bán ${form.district || form.province || 'bất động sản'}`,
        description: form.note,
        ownerName: user?.fullName || 'Chủ nhà gửi bán',
        ownerPhone: user?.phone || '',
        bookSerial: '',
        price: Number(form.expectedPrice) || 0,
        priceUnit: 'VND',
        areaM2: null,
        district: form.district,
        ward: form.ward,
        address: location,
        hiddenAddress: location,
        companyUnitId: '',
        statusId: 'st_new',
        expertId: '',
        assignedUserId: '',
        signingScore: 0,
        visibilityIds: ['management_admin'],
        tagIds: [],
        extra: {
          sourceRole: 'chu_nha',
          province: form.province,
          expectedPrice: Number(form.expectedPrice) || 0,
          legalStatus: form.legalStatus,
          ownerRelation: form.ownerRelation,
          note: form.note,
          nextAction: 'cho_phan_cong_chuyen_gia',
          submittedAt: new Date().toISOString(),
        },
      });
      navigate('/chu-nha/nha-cua-toi');
    } catch {
      setMessage('Chưa gửi được thông tin. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-3 pb-24 pt-3 sm:px-4">
      <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Chủ nhà cần bán</p>
            <h1 className="mt-1 text-xl font-black leading-tight text-[#25202a]">Gửi thông tin bán nhà</h1>
            <p className="mt-1 text-sm font-semibold leading-5 text-[#747b88]">
              Nhập phần chính trước, chuyên gia sẽ liên hệ bổ sung thông tin sâu.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold leading-5 text-[#c40012]">
          {message}
        </div>
      ) : null}

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <Field label="Giá chào dự kiến" value={form.expectedPrice} onChange={(value) => update('expectedPrice', value)} inputMode="numeric" placeholder="VD: 6800000000" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Tỉnh/Thành" value={form.province} onChange={(value) => update('province', value)} options={PROVINCES} />
          <InputWithList label="Quận/Huyện" value={form.district} onChange={(value) => update('district', value)} options={DISTRICTS} listId="owner-districts" placeholder="Chọn hoặc nhập quận" />
          <InputWithList label="Phường/Xã" value={form.ward} onChange={(value) => update('ward', value)} options={WARDS} listId="owner-wards" placeholder="Chọn hoặc nhập phường" />
        </div>

        <Select label="Tình trạng pháp lý" value={form.legalStatus} onChange={(value) => update('legalStatus', value)} options={LEGAL_OPTIONS.map((item) => item.label)} values={LEGAL_OPTIONS.map((item) => item.value)} />
        <Select label="Vai trò với bất động sản" value={form.ownerRelation} onChange={(value) => update('ownerRelation', value)} options={RELATION_OPTIONS.map((item) => item.label)} values={RELATION_OPTIONS.map((item) => item.value)} />

        <label className="block">
          <span className="mb-1 block text-xs font-black text-[#5f6672]">Ghi chú thêm</span>
          <textarea
            value={form.note}
            onChange={(event) => update('note', event.target.value)}
            placeholder="VD: cần bán nhanh, thời gian rảnh để chuyên gia gọi, thông tin đặc biệt..."
            className="h-24 w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm font-semibold outline-none focus:border-[#c40012]"
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm disabled:opacity-60"
        >
          {submitting ? <CheckCircle2 className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5" />}
          {submitting ? 'Đang gửi...' : 'Gửi cho chuyên gia'}
        </button>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
    </label>
  );
}

function InputWithList({ label, value, onChange, options, listId, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[]; listId: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        list={listId}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
      <datalist id={listId}>
        {options.map((item) => <option key={item} value={item} />)}
      </datalist>
    </label>
  );
}

function Select({ label, value, onChange, options, values }: { label: string; value: string; onChange: (value: string) => void; options: string[]; values?: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      >
        <option value="">Chọn</option>
        {options.map((item, index) => (
          <option key={values?.[index] || item} value={values?.[index] || item}>{item}</option>
        ))}
      </select>
    </label>
  );
}
