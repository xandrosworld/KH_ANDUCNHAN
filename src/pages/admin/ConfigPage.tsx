import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [configResponse, roleResponse] = await Promise.all([
        api.get('/config'),
        api.get('/admin/role-approval-settings'),
      ]);
      setGroups(configResponse.data?.groups || []);
      setRoleSettings(roleResponse.data?.items || []);
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
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#25202a]">{option.label}</p>
                        <p className="truncate text-xs font-medium text-[#8a919e]">{option.value}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${option.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>
                        {option.isActive === false ? 'Tạm ẩn' : 'Đang dùng'}
                      </span>
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
