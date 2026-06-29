import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-[#c40012]',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export default function SchedulePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/viewing-schedules')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Chuyên viên</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Lịch xem nhà</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi lịch hẹn dẫn khách và trạng thái xác nhận.</p>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => <ScheduleSkeleton key={index} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Calendar className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Chưa có lịch xem nhà</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Khi có lịch dẫn khách, hệ thống sẽ hiển thị để tiện theo dõi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => <ScheduleCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ item }: { item: any }) {
  const status = item.status || 'pending';
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-black text-[#25202a]">{item.propertyTitle || item.propertyName || 'Nguồn nhà cần xem'}</p>
          <p className="mt-1 text-sm font-semibold text-[#747b88]">{item.customerName || 'Khách mua'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[status] || status}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-semibold text-[#747b88] sm:grid-cols-2">
        <p className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#c40012]" />
          {formatDateTime(item.scheduledAt || item.scheduled_at)}
        </p>
        <p className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#c40012]" />
          {item.meetingPoint || item.address || 'Điểm hẹn đang cập nhật'}
        </p>
      </div>
      {item.note && <p className="mt-3 rounded-2xl bg-[#faf7f5] px-3 py-2 text-sm font-medium leading-6 text-[#747b88]">{item.note}</p>}
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa chọn thời gian';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
