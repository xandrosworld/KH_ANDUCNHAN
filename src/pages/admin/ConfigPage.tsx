import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChevronDown, ChevronUp, Loader2, Pencil, Save, Send, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

interface ConfigOption {
  id: string;
  label: string;
  value: string;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

interface ConfigGroup {
  id: string;
  name: string;
  description?: string | null;
  options?: ConfigOption[];
}

interface RoleApprovalSetting {
  id: string;
  slug: string;
  label: string;
  roleGroup: string;
  requiresApproval: boolean;
  sortOrder: number;
}

interface AdminNotice {
  id: string;
  title: string;
  body?: string;
  created_at?: string;
  createdAt?: string;
}

const roleGroupLabels: Record<string, string> = {
  public: 'Cơ bản',
  staff: 'Nhân sự',
  management: 'Quản lý',
  partner: 'Đối tác',
};

export default function AdminConfigPage() {
  const [groups, setGroups] = useState<ConfigGroup[]>([]);
  const [roleSettings, setRoleSettings] = useState<RoleApprovalSetting[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [savingSlug, setSavingSlug] = useState('');
  const [editingOptionId, setEditingOptionId] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
  const [savingOptionId, setSavingOptionId] = useState('');
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [configResponse, roleResponse, noticeResponse] = await Promise.all([
        api.get('/config'),
        api.get('/admin/role-approval-settings'),
        api.get('/admin/notifications'),
      ]);
      setGroups(configResponse.data?.groups || []);
      setRoleSettings(roleResponse.data?.items || []);
      setNotices(noticeResponse.data?.items || []);
    } catch {
      setMessage('Chưa tải được cấu hình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const roleGroups = useMemo(() => {
    return roleSettings.reduce<Record<string, RoleApprovalSetting[]>>((acc, item) => {
      const groupName = roleGroupLabels[item.roleGroup] || item.roleGroup || 'Khác';
      acc[groupName] = acc[groupName] || [];
      acc[groupName].push(item);
      return acc;
    }, {});
  }, [roleSettings]);

  const otherGroups = groups.filter((group) => group.id !== 'account_role_approval');
  const toggleGroup = (groupId: string) => {
    setExpanded((current) =>
      current.includes(groupId) ? current.filter((item) => item !== groupId) : [...current, groupId],
    );
  };

  const updateRoleApproval = async (setting: RoleApprovalSetting, requiresApproval: boolean) => {
    if (setting.requiresApproval === requiresApproval || savingSlug) return;
    setSavingSlug(setting.slug);
    setMessage('');

    const previous = roleSettings;
    setRoleSettings((current) =>
      current.map((item) => item.slug === setting.slug ? { ...item, requiresApproval } : item),
    );

    try {
      const response = await api.patch(`/admin/role-approval-settings/${encodeURIComponent(setting.slug)}`, {
        requiresApproval,
      });
      const updated = response.data?.item as RoleApprovalSetting | undefined;
      if (updated) {
        setRoleSettings((current) => current.map((item) => item.slug === updated.slug ? updated : item));
      }
      setMessage('Đã lưu cấu hình duyệt tài khoản.');
    } catch {
      setRoleSettings(previous);
      setMessage('Chưa lưu được cấu hình. Vui lòng thử lại.');
    } finally {
      setSavingSlug('');
    }
  };

  const updateGroupOption = (updated: ConfigOption) => {
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        options: (group.options || []).map((option) => (option.id === updated.id ? updated : option)),
      })),
    );
  };

  const startEditOption = (option: ConfigOption) => {
    setEditingOptionId(option.id);
    setEditingLabel(option.label);
  };

  const cancelEditOption = () => {
    setEditingOptionId('');
    setEditingLabel('');
  };

  const saveOptionLabel = async (option: ConfigOption) => {
    const nextLabel = editingLabel.trim();
    if (!nextLabel || savingOptionId) return;
    setSavingOptionId(option.id);
    setMessage('');
    try {
      const response = await api.put(`/config/options/${encodeURIComponent(option.id)}`, {
        label: nextLabel,
        value: option.value,
        metadata: option.metadata || null,
        isActive: option.isActive !== false,
      });
      const updated = response.data?.item as ConfigOption | undefined;
      if (updated) updateGroupOption(updated);
      setMessage('Đã lưu tên hiển thị.');
      cancelEditOption();
    } catch {
      setMessage('Chưa lưu được tên hiển thị. Vui lòng thử lại.');
    } finally {
      setSavingOptionId('');
    }
  };

  const toggleOptionActive = async (option: ConfigOption) => {
    if (savingOptionId) return;
    setSavingOptionId(option.id);
    setMessage('');
    try {
      const response = await api.put(`/config/options/${encodeURIComponent(option.id)}`, {
        label: option.label,
        value: option.value,
        metadata: option.metadata || null,
        isActive: option.isActive === false,
      });
      const updated = response.data?.item as ConfigOption | undefined;
      if (updated) updateGroupOption(updated);
      setMessage(option.isActive === false ? 'Đã bật lại lựa chọn.' : 'Đã tạm ẩn lựa chọn.');
    } catch {
      setMessage('Chưa cập nhật được lựa chọn. Vui lòng thử lại.');
    } finally {
      setSavingOptionId('');
    }
  };

  const publishNotice = async () => {
    const title = noticeTitle.trim();
    const body = noticeBody.trim();
    if (!title || noticeSaving) {
      setMessage('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    setNoticeSaving(true);
    setMessage('');
    try {
      const response = await api.post('/admin/notifications', { title, body });
      const next = response.data?.item as AdminNotice | undefined;
      setNotices((current) => next ? [{ ...next, createdAt: new Date().toISOString() }, ...current] : current);
      setNoticeTitle('');
      setNoticeBody('');
      setMessage('Đã gửi thông báo nội bộ.');
    } catch {
      setMessage('Chưa gửi được thông báo. Vui lòng thử lại.');
    } finally {
      setNoticeSaving(false);
    }
  };

  return (
    <div className="pb-20">
      <div className="mb-5">
        <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Thiết lập hệ thống</p>
        <h1 className="text-xl font-black text-[#25202a]">Cấu hình vận hành</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
          Quản trị chủ động thay đổi tên gọi, danh mục và loại tài khoản cần duyệt mà không phải sửa chương trình.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[#c40012]">
          {message}
        </div>
      )}

      <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <Bell className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-[#25202a]">Thông báo nội bộ</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
              Gửi thông báo ngắn đến trang Thông báo của người dùng trong hệ thống.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            <input
              className="svp-input"
              data-testid="admin-notice-title"
              placeholder="Tiêu đề thông báo"
              value={noticeTitle}
              onChange={(event) => setNoticeTitle(event.target.value)}
            />
            <textarea
              className="min-h-28 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#25202a] outline-none focus:border-[#c40012]"
              data-testid="admin-notice-body"
              placeholder="Nội dung thông báo"
              value={noticeBody}
              onChange={(event) => setNoticeBody(event.target.value)}
            />
            <button
              type="button"
              data-testid="admin-notice-publish"
              disabled={noticeSaving}
              onClick={publishNotice}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm disabled:opacity-60"
            >
              {noticeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gửi thông báo
            </button>
          </div>

          <div className="rounded-2xl bg-[#fff8f2] p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#8c6b6b]">Thông báo gần đây</p>
            {notices.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-5 text-sm font-bold text-[#667085]">Chưa có thông báo nào.</div>
            ) : (
              <div className="space-y-2">
                {notices.slice(0, 4).map((notice) => (
                  <div key={notice.id} className="rounded-xl bg-white p-3 ring-1 ring-red-50">
                    <p className="line-clamp-1 text-sm font-black text-[#25202a]">{notice.title}</p>
                    {notice.body ? <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#667085]">{notice.body}</p> : null}
                    <p className="mt-2 text-[11px] font-bold text-[#9aa1ad]">{formatNoticeDate(notice.createdAt || notice.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-[#25202a]">Duyệt tài khoản</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
              Chọn loại tài khoản được vào dùng ngay sau đăng ký, hoặc phải chờ quản trị viên duyệt trước khi mở đầy đủ tính năng.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl bg-[#fff8f2] px-4 py-3 text-sm font-bold text-[#667085]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải cấu hình...
          </div>
        ) : roleSettings.length === 0 ? (
          <div className="rounded-xl bg-[#fff8f2] px-4 py-3 text-sm font-bold text-[#667085]">
            Chưa có cấu hình loại tài khoản.
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(roleGroups).map(([groupName, items]) => (
              <div key={groupName}>
                <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#8c6b6b]">{groupName}</div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((setting) => (
                    <div key={setting.slug} className="rounded-2xl border border-[#efe4df] bg-[#fffaf7] p-3">
                      <div className="mb-3">
                        <p className="text-sm font-black text-[#25202a]">{setting.label}</p>
                        <p className="mt-0.5 text-xs font-semibold text-[#8a8080]">
                          {setting.requiresApproval ? 'Đang yêu cầu phê duyệt' : 'Đang cho dùng ngay'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={savingSlug === setting.slug}
                          onClick={() => updateRoleApproval(setting, false)}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            !setting.requiresApproval
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'border border-emerald-100 bg-white text-emerald-700'
                          } disabled:opacity-60`}
                        >
                          Dùng ngay
                        </button>
                        <button
                          type="button"
                          disabled={savingSlug === setting.slug}
                          onClick={() => updateRoleApproval(setting, true)}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            setting.requiresApproval
                              ? 'bg-[#c40012] text-white shadow-sm'
                              : 'border border-red-100 bg-white text-[#c40012]'
                          } disabled:opacity-60`}
                        >
                          Cần duyệt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-[13px] font-semibold leading-5 text-[#735a18]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Cấu hình này áp dụng cho tài khoản đăng ký mới và các yêu cầu xin thêm vai trò sau thời điểm lưu.
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[#c40012]" />
          <h2 className="text-base font-black text-[#25202a]">Danh mục dữ liệu</h2>
        </div>

        {loading && otherGroups.length === 0 ? null : otherGroups.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm font-bold text-[#667085] shadow-sm">Chưa có danh mục cấu hình.</div>
        ) : (
          otherGroups.map((group) => (
            <div key={group.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <button onClick={() => toggleGroup(group.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <span>
                  <span className="block font-black text-[#25202a]">{group.name}</span>
                  {group.description ? <span className="mt-0.5 block text-xs font-medium text-[#667085]">{group.description}</span> : null}
                </span>
                {expanded.includes(group.id) ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
              </button>
              {expanded.includes(group.id) && (
                <div className="border-t border-gray-100 px-4 pb-3">
                  {(group.options || []).map((option) => (
                    <div key={option.id} className="flex items-center justify-between gap-3 border-b border-gray-50 py-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        {editingOptionId === option.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              value={editingLabel}
                              onChange={(event) => setEditingLabel(event.target.value)}
                              className="min-h-10 min-w-0 flex-1 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold text-[#25202a] outline-none focus:border-[#c40012]"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveOptionLabel(option)}
                                disabled={savingOptionId === option.id}
                                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#c40012] px-3 text-xs font-black text-white disabled:opacity-60"
                              >
                                {savingOptionId === option.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditOption}
                                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-black text-[#667085]"
                              >
                                <X className="h-3.5 w-3.5" />
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="truncate text-sm font-bold text-[#25202a]">{option.label}</p>
                            <p className="truncate text-xs font-medium text-[#8a919e]">{option.value}</p>
                          </>
                        )}
                      </div>
                      {editingOptionId !== option.id && (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditOption(option)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 text-xs font-black text-[#667085]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleOptionActive(option)}
                            disabled={savingOptionId === option.id}
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black disabled:opacity-60 ${option.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}
                          >
                            {savingOptionId === option.id ? 'Đang lưu...' : option.isActive === false ? 'Tạm ẩn' : 'Đang dùng'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function formatNoticeDate(value?: string) {
  if (!value) return 'Vừa tạo';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
