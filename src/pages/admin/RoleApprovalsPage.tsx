import { useEffect, useState } from 'react';
import { Check, Clock, X } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { getRoleDisplayName } from '../../data/roles';

const TABS = [
  { label: 'Chờ duyệt', status: 'pending' },
  { label: 'Đã duyệt', status: 'approved' },
  { label: 'Từ chối', status: 'rejected' },
];

export default function RoleApprovalsPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    api.get('/admin/role-applications', { params: { status: tab.status } })
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]));
  };

  useEffect(load, [tab.status]);

  const act = async (id: string, status: string) => {
    await api.patch(`/admin/role-applications/${id}`, { status, adminNotes: notes[id] || '' });
    load();
  };

  return (
    <div className="pb-20">
      <div className="mb-5">
        <h1 className="text-xl font-black text-[#25202a]">Duyệt vai trò</h1>
        <p className="mt-1 text-sm font-medium text-[#667085]">Xem xét các vai trò cần phê duyệt trước khi mở đầy đủ tính năng.</p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.status}
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              tab.status === item.status ? 'bg-[#c40012] text-white' : 'border border-gray-200 bg-white text-[#667085]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <Clock className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="font-semibold text-[#667085]">Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((application: any) => (
            <div key={application.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex justify-between gap-3">
                <div>
                  <p className="font-black text-[#25202a]">{application.userName || application.userEmail || 'Người dùng mới'}</p>
                  <p className="text-sm font-medium text-[#667085]">{application.userEmail} · {application.userPhone || 'Chưa có SĐT'}</p>
                </div>
              </div>

              <div className="mb-3 rounded-xl bg-[#fff8f2] px-3 py-2 text-sm">
                <span className="font-medium text-[#667085]">Vai trò: </span>
                <span className="font-black text-[#25202a]">{getRoleDisplayName(application.roleSlug)}</span>
              </div>

              {application.reason && <p className="mb-3 text-sm font-medium text-[#667085]">Lý do: {application.reason}</p>}

              {tab.status === 'pending' && (
                <div>
                  <input
                    className="svp-input mb-2"
                    placeholder="Ghi chú khi duyệt hoặc từ chối"
                    value={notes[application.id] || ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => act(application.id, 'approved')} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
                      <Check className="h-4 w-4" />
                      Duyệt
                    </button>
                    <button onClick={() => act(application.id, 'rejected')} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 py-2.5 text-sm font-bold text-[#c40012]">
                      <X className="h-4 w-4" />
                      Từ chối
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
