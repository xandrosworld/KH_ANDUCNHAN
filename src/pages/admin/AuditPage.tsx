import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

const ACTION_LABEL: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  delete: 'Xóa',
  approve: 'Duyệt',
  reject: 'Từ chối',
};

const ENTITY_LABEL: Record<string, string> = {
  property: 'nhà',
  customer: 'khách hàng',
  customer_need: 'nhu cầu khách',
  viewing_schedule: 'lịch xem',
  referral: 'giới thiệu',
  config_option: 'cấu hình',
  user_role: 'vai trò',
  role_application: 'yêu cầu vai trò',
  property_media_upload: 'hình ảnh/tài liệu nhà',
};

export default function AdminAuditPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/audit-logs', { params: { limit: 50 } }).then(r => setItems(r.data?.items || [])).catch(() => {});
  }, []);

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Nhật ký hệ thống</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#757575]">Chưa có nhật ký</p>
        </div>
      ) : items.map((l: any) => (
        <div key={l.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <div className="flex justify-between">
            <p className="font-medium text-sm">{ACTION_LABEL[l.action] || l.action} {ENTITY_LABEL[l.entityType] || l.entityType}</p>
            <span className="text-xs text-[#757575]">{l.createdAt?.slice(0, 16)}</span>
          </div>
          <p className="text-xs text-[#757575]">{l.actorId || '—'} · {l.entityId || '—'}</p>
        </div>
      ))}
    </div>
  );
}
