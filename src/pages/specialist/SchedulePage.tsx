import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

export default function SchedulePage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/viewing-schedules').then(r => setItems(r.data?.items || [])).catch(() => {});
  }, []);

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const statusLabel: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Hủy',
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Lịch xem nhà</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#757575]">Chưa có lịch xem nào</p>
        </div>
      ) : items.map((s: any) => (
        <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{s.propertyTitle || 'Nhà'}</p>
              <p className="text-sm text-[#757575]">{s.customerName || '—'}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full h-fit ${statusColor[s.status] || 'bg-gray-100'}`}>
              {statusLabel[s.status] || s.status}
            </span>
          </div>
          <p className="text-xs text-[#757575] mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {s.scheduledAt || '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
