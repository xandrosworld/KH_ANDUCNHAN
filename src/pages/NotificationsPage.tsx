import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { svpAxios as api } from '../services/svpAxios';

interface Notice {
  id: string;
  title: string;
  body?: string;
  kind?: string;
  created_at?: string;
  createdAt?: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/notifications')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setError('Chưa tải được thông báo. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-4 sm:px-6">
      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <Bell className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Hệ thống</p>
            <h1 className="text-2xl font-black text-[#25202a]">Thông báo</h1>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c40012]" />
          <p className="mt-3 text-sm font-bold text-[#747b88]">Đang tải thông báo...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <p className="font-black text-[#25202a]">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Bell className="mx-auto mb-3 h-12 w-12 text-red-200" />
          <p className="font-black text-[#25202a]">Chưa có thông báo mới</p>
          <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">
            Các cập nhật về nhà, khách hàng, lịch xem và duyệt vai trò sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black leading-6 text-[#25202a]">{item.title}</p>
                  {item.body ? <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">{item.body}</p> : null}
                  <p className="mt-2 text-xs font-bold text-[#9aa1ad]">{formatNoticeDate(item.createdAt || item.created_at)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNoticeDate(value?: string) {
  if (!value) return 'Vừa cập nhật';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
