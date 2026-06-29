import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="p-4 pb-20">
      <h1 className="mb-4 text-xl font-bold text-text-primary">Thông báo</h1>
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <Bell className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p className="font-medium text-text-primary">Chưa có thông báo mới</p>
        <p className="mt-1 text-sm text-text-secondary">
          Các cập nhật về nhà, khách hàng, lịch xem và duyệt vai trò sẽ hiển thị tại đây.
        </p>
      </div>
    </div>
  );
}
