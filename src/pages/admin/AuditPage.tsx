import { useEffect, useMemo, useState } from 'react';
import { Clock3, FileText, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

const ACTION_LABEL: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  delete: 'Xóa',
  approve: 'Duyệt',
  reject: 'Từ chối',
};

const ENTITY_LABEL: Record<string, string> = {
  property: 'nguồn nhà',
  customer: 'khách hàng',
  customer_need: 'nhu cầu khách',
  viewing_schedule: 'lịch xem nhà',
  referral: 'giới thiệu',
  config_option: 'cấu hình vận hành',
  user_role: 'vai trò người dùng',
  role_application: 'yêu cầu vai trò',
  role_approval_setting: 'cài đặt duyệt tài khoản',
  property_media_upload: 'hình ảnh/tài liệu nhà',
};

export default function AdminAuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/audit-logs', { params: { limit: 80 } })
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => {
      const action = ACTION_LABEL[item.action] || item.action || '';
      const entity = ENTITY_LABEL[item.entityType] || item.entityType || '';
      return [action, entity, item.actorId, item.entityId].some((value) => String(value || '').toLowerCase().includes(keyword));
    });
  }, [items, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Nhật ký hệ thống</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[#747b88]">
              Theo dõi các thay đổi quan trọng để kiểm tra, đối soát và truy vết khi cần.
            </p>
          </div>
          <button onClick={load} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-[#c40012]">
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo hành động, đối tượng, người thực hiện..."
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
          />
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => <AuditSkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <FileText className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Chưa có nhật ký phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Các thao tác quan trọng sẽ được lưu lại tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => <AuditItem key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

function AuditItem({ item }: { item: any }) {
  const action = ACTION_LABEL[item.action] || 'Cập nhật';
  const entity = ENTITY_LABEL[item.entityType] || 'dữ liệu hệ thống';
  const time = formatTime(item.createdAt || item.created_at);
  const actor = item.actorName || item.actorEmail || item.actorId || 'Hệ thống';
  const reference = item.entityCode || item.entityId || '';

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-black text-[#25202a]">{action} {entity}</p>
              <p className="mt-1 text-sm font-medium text-[#747b88]">Người thực hiện: {shortText(actor)}</p>
            </div>
            <p className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#8a919e]">
              <Clock3 className="h-3.5 w-3.5" />
              {time}
            </p>
          </div>
          {reference && (
            <p className="mt-3 rounded-xl bg-[#faf7f5] px-3 py-2 text-xs font-bold text-[#747b88]">
              Mã tham chiếu: {shortText(reference)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex gap-3">
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

function formatTime(value?: string) {
  if (!value) return 'Vừa xong';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function shortText(value: string) {
  if (!value) return '';
  return value.length > 42 ? `${value.slice(0, 18)}...${value.slice(-10)}` : value;
}
