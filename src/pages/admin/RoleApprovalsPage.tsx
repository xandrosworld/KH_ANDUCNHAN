import { useEffect, useState } from 'react';
import { Check, Clock, Loader2, UserCheck, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/role-applications', { params: { status: tab.status } })
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab.status]);

  const act = async (id: string, status: string) => {
    setActingId(id);
    try {
      await api.patch(`/admin/role-applications/${id}`, { status, adminNotes: notes[id] || '' });
      load();
    } finally {
      setActingId('');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Duyệt vai trò</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">
          Xem xét các vai trò cần phê duyệt trước khi mở đầy đủ tính năng cho người dùng.
        </p>
      </section>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((item) => (
          <button
            key={item.status}
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              tab.status === item.status ? 'bg-[#c40012] text-white' : 'bg-white text-[#747b88] ring-1 ring-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => <ApprovalSkeleton key={index} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Clock className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Không có yêu cầu nào</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Khi người dùng xin vai trò cần duyệt, yêu cầu sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((application) => (
            <div key={application.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#25202a]">{application.userName || application.userEmail || 'Người dùng mới'}</p>
                      <p className="mt-1 text-sm font-semibold text-[#747b88]">{application.userEmail || application.userPhone || 'Chưa có liên hệ'}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#faf7f5] px-2.5 py-1 text-xs font-black text-[#747b88]">
                      {getRoleDisplayName(application.roleSlug)}
                    </span>
                  </div>

                  {application.reason && <p className="mt-3 rounded-2xl bg-[#faf7f5] px-3 py-2 text-sm font-medium leading-6 text-[#747b88]">Lý do: {application.reason}</p>}

                  {tab.status === 'pending' && (
                    <div className="mt-4">
                      <input
                        className="svp-input mb-2"
                        placeholder="Ghi chú khi duyệt hoặc từ chối"
                        value={notes[application.id] || ''}
                        onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => act(application.id, 'approved')}
                          disabled={actingId === application.id}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black text-white disabled:opacity-60"
                        >
                          {actingId === application.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Duyệt
                        </button>
                        <button
                          onClick={() => act(application.id, 'rejected')}
                          disabled={actingId === application.id}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 text-sm font-black text-[#c40012] disabled:opacity-60"
                        >
                          <X className="h-4 w-4" />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex gap-3">
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
