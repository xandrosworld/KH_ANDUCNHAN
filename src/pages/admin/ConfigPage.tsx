import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChevronDown, ChevronUp, Globe2, GripVertical, Loader2, Pencil, Plus, Save, Send, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

interface ConfigOption {
  id: string;
  label: string;
  value: string;
  score?: number | null;
  isActive?: boolean;
  sortOrder: number;
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
  description?: string;
  roleGroup: string;
  requiresApproval: boolean;
  registrationEnabled?: boolean;
  systemRole?: boolean;
  customRole?: boolean;
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

const lockedPropertyFields = new Set(['ownerName', 'ownerPhone', 'title', 'province', 'district', 'ward', 'price', 'description', 'houseImages']);

const emptyRoleDraft = {
  label: '',
  slug: '',
  description: '',
  roleGroup: 'staff',
  requiresApproval: true,
  registrationEnabled: true,
};

type RoleDraft = typeof emptyRoleDraft;

const emptyOptionDraft = {
  label: '',
  value: '',
  score: '',
};

type OptionDraft = typeof emptyOptionDraft;

const emptyPublicPageDraft = {
  title: '',
  body: '',
  imageUrl: '',
  videoUrl: '',
  linkUrl: '',
};

function optionMetadata(option: ConfigOption): Record<string, unknown> {
  return option.metadata && typeof option.metadata === 'object' ? option.metadata : {};
}

function isLockedOption(groupId: string, option: ConfigOption) {
  return groupId === 'property_field_labels' && (optionMetadata(option).locked === true || lockedPropertyFields.has(option.value));
}

export default function AdminConfigPage() {
  const [groups, setGroups] = useState<ConfigGroup[]>([]);
  const [roleSettings, setRoleSettings] = useState<RoleApprovalSetting[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [savingSlug, setSavingSlug] = useState('');
  const [editingRoleSlug, setEditingRoleSlug] = useState('');
  const [roleDraft, setRoleDraft] = useState<RoleDraft>(emptyRoleDraft);
  const [newRole, setNewRole] = useState<RoleDraft>(emptyRoleDraft);
  const [creatingRole, setCreatingRole] = useState(false);
  const [newOptions, setNewOptions] = useState<Record<string, OptionDraft>>({});
  const [creatingOptionGroup, setCreatingOptionGroup] = useState('');
  const [newPublicPage, setNewPublicPage] = useState(emptyPublicPageDraft);
  const [creatingPublicPage, setCreatingPublicPage] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
  const [savingOptionId, setSavingOptionId] = useState('');
  const [draggingOptionId, setDraggingOptionId] = useState('');
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeRecipient, setNoticeRecipient] = useState('');
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

  const siteDisplayGroup = groups.find((group) => group.id === 'site_display');
  const publicPagesGroup = groups.find((group) => group.id === 'public_pages');
  const otherGroups = groups.filter((group) => !['account_role_approval', 'site_display', 'public_pages'].includes(group.id));
  const editableCatalogGroups = new Set(['company_units', 'property_tags', 'property_statuses', 'visibility_levels', 'signing_criteria', 'price_segments', 'customer_statuses']);
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

  const startEditRole = (setting: RoleApprovalSetting) => {
    setEditingRoleSlug(setting.slug);
    setRoleDraft({
      label: setting.label,
      slug: setting.slug,
      description: setting.description || '',
      roleGroup: setting.roleGroup || 'staff',
      requiresApproval: setting.requiresApproval,
      registrationEnabled: setting.registrationEnabled !== false,
    });
  };

  const updateRoleSetting = async (setting: RoleApprovalSetting, updates: Partial<RoleDraft>) => {
    if (savingSlug) return;
    setSavingSlug(setting.slug);
    setMessage('');

    const previous = roleSettings;
    const optimistic = { ...setting, ...updates };
    setRoleSettings((current) => current.map((item) => item.slug === setting.slug ? optimistic : item));

    try {
      const response = await api.patch(`/admin/role-approval-settings/${encodeURIComponent(setting.slug)}`, updates);
      const updated = response.data?.item as RoleApprovalSetting | undefined;
      if (updated) {
        setRoleSettings((current) => current.map((item) => item.slug === updated.slug ? updated : item));
      }
      setMessage('Đã lưu cấu hình vai trò.');
      setEditingRoleSlug('');
    } catch {
      setRoleSettings(previous);
      setMessage('Chưa lưu được cấu hình vai trò. Vui lòng thử lại.');
    } finally {
      setSavingSlug('');
    }
  };

  const saveRoleDraft = async (setting: RoleApprovalSetting) => {
    const label = roleDraft.label.trim();
    if (!label) {
      setMessage('Tên vai trò không được để trống.');
      return;
    }
    await updateRoleSetting(setting, {
      label,
      description: roleDraft.description.trim(),
      roleGroup: roleDraft.roleGroup.trim() || setting.roleGroup,
      requiresApproval: roleDraft.requiresApproval,
      registrationEnabled: roleDraft.registrationEnabled,
    });
  };

  const createRole = async () => {
    const label = newRole.label.trim();
    if (!label || creatingRole) {
      setMessage('Nhập tên vai trò trước khi thêm.');
      return;
    }
    setCreatingRole(true);
    setMessage('');
    try {
      const response = await api.post('/admin/role-approval-settings', {
        label,
        slug: newRole.slug.trim(),
        description: newRole.description.trim(),
        roleGroup: newRole.roleGroup,
        requiresApproval: newRole.requiresApproval,
        registrationEnabled: newRole.registrationEnabled,
      });
      const created = response.data?.item as RoleApprovalSetting | undefined;
      if (created) setRoleSettings((current) => [...current, created]);
      setNewRole(emptyRoleDraft);
      setMessage('Đã thêm vai trò mới.');
    } catch {
      setMessage('Chưa thêm được vai trò. Kiểm tra mã vai trò có bị trùng không.');
    } finally {
      setCreatingRole(false);
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

  const addOptionToGroup = (groupId: string, option: ConfigOption) => {
    setGroups((current) =>
      current.map((group) => group.id === groupId
        ? {
            ...group,
            options: [...(group.options || []), option].sort((first, second) => first.sortOrder - second.sortOrder || first.label.localeCompare(second.label, 'vi')),
          }
        : group,
      ),
    );
  };

  const updateNewOption = (groupId: string, updates: Partial<OptionDraft>) => {
    setNewOptions((current) => ({
      ...current,
      [groupId]: { ...(current[groupId] || emptyOptionDraft), ...updates },
    }));
  };

  const createConfigOption = async (group: ConfigGroup) => {
    if (creatingOptionGroup) return;
    const draft = newOptions[group.id] || emptyOptionDraft;
    const label = draft.label.trim();
    if (!label) {
      setMessage('Nhập tên lựa chọn trước khi thêm.');
      return;
    }
    setCreatingOptionGroup(group.id);
    setMessage('');
    try {
      const response = await api.post('/config/options', {
        groupId: group.id,
        label,
        value: draft.value.trim() || undefined,
        score: group.id === 'signing_criteria' && draft.score.trim() !== '' ? Number(draft.score) : undefined,
        sortOrder: ((group.options || []).length + 1) * 10,
        isActive: true,
      });
      const created = response.data?.item as ConfigOption | undefined;
      if (created) addOptionToGroup(group.id, created);
      setNewOptions((current) => ({ ...current, [group.id]: emptyOptionDraft }));
      setMessage('Đã thêm lựa chọn mới.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa thêm được lựa chọn. Vui lòng kiểm tra lại.');
    } finally {
      setCreatingOptionGroup('');
    }
  };

  const updateOptionLocal = (optionId: string, updates: Partial<ConfigOption>) => {
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        options: (group.options || []).map((option) => (option.id === optionId ? { ...option, ...updates } : option)),
      })),
    );
  };

  const updateOptionMetadataLocal = (option: ConfigOption, key: string, value: string) => {
    updateOptionLocal(option.id, { metadata: { ...optionMetadata(option), [key]: value } });
  };

  const saveWholeOption = async (option: ConfigOption) => {
    if (savingOptionId) return;
    setSavingOptionId(option.id);
    setMessage('');
    try {
      const response = await api.put(`/config/options/${encodeURIComponent(option.id)}`, {
        label: option.label,
        value: option.value,
        score: option.score ?? null,
        metadata: option.metadata || null,
        isActive: option.isActive !== false,
      });
      const updated = response.data?.item as ConfigOption | undefined;
      if (updated) updateGroupOption(updated);
      setMessage('Đã lưu nội dung cấu hình.');
    } catch {
      setMessage('Chưa lưu được nội dung cấu hình. Vui lòng thử lại.');
    } finally {
      setSavingOptionId('');
    }
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
        score: option.score ?? null,
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
    const group = groups.find((item) => (item.options || []).some((child) => child.id === option.id));
    if (group && isLockedOption(group.id, option)) {
      setMessage('Trường bắt buộc của form đăng nhà không thể ẩn.');
      return;
    }
    setSavingOptionId(option.id);
    setMessage('');
    try {
      const response = await api.put(`/config/options/${encodeURIComponent(option.id)}`, {
        label: option.label,
        value: option.value,
        score: option.score ?? null,
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

  const saveGroupOptionOrder = async (group: ConfigGroup, nextOptions: ConfigOption[], activeOptionId: string) => {
    const payload = nextOptions.map((item, index) => ({ id: item.id, sortOrder: (index + 1) * 10 }));
    const previousGroups = groups;
    setSavingOptionId(activeOptionId);
    setMessage('');
    setGroups((current) => current.map((item) => item.id === group.id
      ? { ...item, options: nextOptions.map((child, index) => ({ ...child, sortOrder: (index + 1) * 10 })) }
      : item,
    ));
    try {
      await api.post('/config/options/reorder', { items: payload });
      setMessage('Đã cập nhật thứ tự hiển thị.');
    } catch {
      setGroups(previousGroups);
      setMessage('Chưa cập nhật được thứ tự. Vui lòng thử lại.');
    } finally {
      setSavingOptionId('');
      setDraggingOptionId('');
    }
  };

  const reorderGroupOption = async (group: ConfigGroup, option: ConfigOption, direction: -1 | 1) => {
    if (savingOptionId) return;
    const sortedOptions = [...(group.options || [])].sort((first, second) => first.sortOrder - second.sortOrder);
    const fromIndex = sortedOptions.findIndex((item) => item.id === option.id);
    const toIndex = fromIndex + direction;
    if (fromIndex < 0 || toIndex < 0 || toIndex >= sortedOptions.length) return;

    const nextOptions = [...sortedOptions];
    [nextOptions[fromIndex], nextOptions[toIndex]] = [nextOptions[toIndex], nextOptions[fromIndex]];
    await saveGroupOptionOrder(group, nextOptions, option.id);
  };

  const dropGroupOption = async (group: ConfigGroup, targetOption: ConfigOption) => {
    if (savingOptionId || !draggingOptionId || draggingOptionId === targetOption.id) return;
    const sortedOptions = [...(group.options || [])].sort((first, second) => first.sortOrder - second.sortOrder);
    const fromIndex = sortedOptions.findIndex((item) => item.id === draggingOptionId);
    const toIndex = sortedOptions.findIndex((item) => item.id === targetOption.id);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const nextOptions = [...sortedOptions];
    const [moved] = nextOptions.splice(fromIndex, 1);
    nextOptions.splice(toIndex, 0, moved);
    await saveGroupOptionOrder(group, nextOptions, moved.id);
  };

  const deleteConfigOption = async (group: ConfigGroup, option: ConfigOption) => {
    if (savingOptionId) return;
    if (isLockedOption(group.id, option)) {
      setMessage('Mục bắt buộc của hệ thống không thể xóa.');
      return;
    }
    const confirmed = window.confirm(`Xóa lựa chọn "${option.label}" khỏi danh mục ${group.name}?`);
    if (!confirmed) return;

    const previousGroups = groups;
    setSavingOptionId(option.id);
    setMessage('');
    setGroups((current) => current.map((item) => item.id === group.id
      ? { ...item, options: (item.options || []).filter((child) => child.id !== option.id) }
      : item,
    ));
    try {
      await api.delete(`/config/options/${encodeURIComponent(option.id)}`);
      setMessage('Đã xóa lựa chọn khỏi danh mục.');
    } catch (error: any) {
      setGroups(previousGroups);
      setMessage(error?.response?.data?.message || 'Chưa xóa được lựa chọn. Vui lòng thử lại.');
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
      const response = await api.post('/admin/notifications', { title, body, recipient: noticeRecipient.trim() || undefined });
      const next = response.data?.item as AdminNotice | undefined;
      setNotices((current) => next ? [{ ...next, createdAt: new Date().toISOString() }, ...current] : current);
      setNoticeTitle('');
      setNoticeBody('');
      setNoticeRecipient('');
      setMessage('Đã gửi thông báo nội bộ.');
    } catch {
      setMessage('Chưa gửi được thông báo. Vui lòng thử lại.');
    } finally {
      setNoticeSaving(false);
    }
  };

  const createPublicNews = async () => {
    if (creatingPublicPage) return;
    const title = newPublicPage.title.trim();
    const body = newPublicPage.body.trim();
    if (!title || !body) {
      setMessage('Nhập tiêu đề và nội dung tin tức trước khi thêm.');
      return;
    }
    setCreatingPublicPage(true);
    setMessage('');
    try {
      const response = await api.post('/config/options', {
        groupId: 'public_pages',
        label: title,
        value: `news_${Date.now()}`,
        metadata: {
          type: 'news',
          body,
          imageUrl: newPublicPage.imageUrl.trim(),
          videoUrl: newPublicPage.videoUrl.trim(),
          linkUrl: newPublicPage.linkUrl.trim(),
        },
        sortOrder: ((publicPagesGroup?.options || []).length + 1) * 10,
        isActive: true,
      });
      const created = response.data?.item as ConfigOption | undefined;
      if (created) addOptionToGroup('public_pages', created);
      setNewPublicPage(emptyPublicPageDraft);
      setMessage('Đã thêm tin tức đơn giản.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa thêm được tin tức. Vui lòng thử lại.');
    } finally {
      setCreatingPublicPage(false);
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
            <input
              className="svp-input"
              data-testid="admin-notice-recipient"
              placeholder="Người nhận cụ thể (SVP ID / SĐT / email), bỏ trống để gửi tất cả"
              value={noticeRecipient}
              onChange={(event) => setNoticeRecipient(event.target.value)}
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
            <div className="rounded-2xl border border-red-100 bg-[#fff8f2] p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#25202a]">
                <Plus className="h-4 w-4 text-[#c40012]" />
                Thêm vai trò đăng ký
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_160px_1fr_140px_auto]">
                <input
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                  placeholder="Tên vai trò"
                  value={newRole.label}
                  onChange={(event) => setNewRole((current) => ({ ...current, label: event.target.value }))}
                />
                <input
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                  placeholder="ma_vai_tro"
                  value={newRole.slug}
                  onChange={(event) => setNewRole((current) => ({ ...current, slug: event.target.value }))}
                />
                <input
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                  placeholder="Ghi chú ngắn dưới vai trò"
                  value={newRole.description}
                  onChange={(event) => setNewRole((current) => ({ ...current, description: event.target.value }))}
                />
                <select
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                  value={newRole.roleGroup}
                  onChange={(event) => setNewRole((current) => ({ ...current, roleGroup: event.target.value }))}
                >
                  <option value="public">Cơ bản</option>
                  <option value="staff">Nhân sự</option>
                  <option value="management">Quản lý</option>
                  <option value="partner">Đối tác</option>
                </select>
                <button
                  type="button"
                  onClick={createRole}
                  disabled={creatingRole}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#c40012] px-4 text-xs font-black text-white disabled:opacity-60"
                >
                  {creatingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Thêm
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-[#667085] ring-1 ring-red-50">
                  <input
                    type="checkbox"
                    checked={newRole.requiresApproval}
                    onChange={(event) => setNewRole((current) => ({ ...current, requiresApproval: event.target.checked }))}
                    className="h-4 w-4 accent-[#c40012]"
                  />
                  Vai trò này cần duyệt trước khi dùng đầy đủ
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-[#667085] ring-1 ring-red-50">
                  <input
                    type="checkbox"
                    checked={newRole.registrationEnabled}
                    onChange={(event) => setNewRole((current) => ({ ...current, registrationEnabled: event.target.checked }))}
                    className="h-4 w-4 accent-[#c40012]"
                  />
                  Hiển thị vai trò này ở form đăng ký
                </label>
              </div>
            </div>

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
                          {setting.registrationEnabled === false ? ' • Đang ẩn khỏi đăng ký' : ' • Hiện ở đăng ký'}
                        </p>
                        {setting.description ? <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">{setting.description}</p> : null}
                      </div>
                      {editingRoleSlug === setting.slug ? (
                        <div className="mb-3 space-y-2 rounded-xl bg-white p-2 ring-1 ring-red-50">
                          <input
                            className="min-h-9 w-full rounded-lg border border-red-100 px-3 text-xs font-bold outline-none focus:border-[#c40012]"
                            value={roleDraft.label}
                            onChange={(event) => setRoleDraft((current) => ({ ...current, label: event.target.value }))}
                          />
                          <input
                            className="min-h-9 w-full rounded-lg border border-red-100 px-3 text-xs font-bold outline-none focus:border-[#c40012]"
                            value={roleDraft.description}
                            placeholder="Ghi chú hiển thị dưới vai trò"
                            onChange={(event) => setRoleDraft((current) => ({ ...current, description: event.target.value }))}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              className="min-h-9 rounded-lg border border-red-100 px-2 text-xs font-bold outline-none focus:border-[#c40012]"
                              value={roleDraft.roleGroup}
                              onChange={(event) => setRoleDraft((current) => ({ ...current, roleGroup: event.target.value }))}
                            >
                              <option value="public">Cơ bản</option>
                              <option value="staff">Nhân sự</option>
                              <option value="management">Quản lý</option>
                              <option value="partner">Đối tác</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => saveRoleDraft(setting)}
                              disabled={savingSlug === setting.slug}
                              className="rounded-lg bg-[#c40012] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                            >
                              Lưu sửa
                            </button>
                          </div>
                        </div>
                      ) : null}
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
                        <button
                          type="button"
                          disabled={savingSlug === setting.slug || setting.slug === 'admin'}
                          onClick={() => updateRoleSetting(setting, { registrationEnabled: setting.registrationEnabled === false })}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            setting.registrationEnabled === false
                              ? 'border border-gray-200 bg-white text-gray-500'
                              : 'bg-blue-600 text-white shadow-sm'
                          } disabled:opacity-50`}
                        >
                          {setting.registrationEnabled === false ? 'Hiện ĐK' : 'Ẩn ĐK'}
                        </button>
                        <button
                          type="button"
                          onClick={() => editingRoleSlug === setting.slug ? setEditingRoleSlug('') : startEditRole(setting)}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-[#667085]"
                        >
                          {editingRoleSlug === setting.slug ? 'Đóng' : 'Sửa tên'}
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

      {siteDisplayGroup ? (
        <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
              <Globe2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-[#25202a]">Hiển thị website</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
                Sửa nhanh logo, tên hệ thống, khẩu hiệu và chân trang hiển thị ở khu vực đăng nhập công khai.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[...(siteDisplayGroup.options || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((option) => (
              <div key={option.id} className="rounded-2xl border border-red-50 bg-[#fff8f2] p-3">
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-[#8c6b6b]">{option.label}</label>
                <div className="flex gap-2">
                  <input
                    className="min-h-10 min-w-0 flex-1 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                    value={option.value}
                    onChange={(event) => updateOptionLocal(option.id, { value: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => saveWholeOption(option)}
                    disabled={savingOptionId === option.id}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#c40012] px-3 text-xs font-black text-white disabled:opacity-60"
                  >
                    {savingOptionId === option.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Lưu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {publicPagesGroup ? (
        <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
              <Globe2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-[#25202a]">Giới thiệu / Tin tức</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
                Bản V1 cho phép sửa nội dung đơn giản: tiêu đề, nội dung, ảnh, video/link và bật tắt hiển thị.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-red-100 bg-[#fff8f2] p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#25202a]">
                <Plus className="h-4 w-4 text-[#c40012]" />
                Thêm tin tức đơn giản
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012] md:col-span-2"
                  value={newPublicPage.title}
                  onChange={(event) => setNewPublicPage((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Tiêu đề tin tức"
                />
                <textarea
                  className="min-h-20 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold leading-6 outline-none focus:border-[#c40012] md:col-span-2"
                  value={newPublicPage.body}
                  onChange={(event) => setNewPublicPage((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Nội dung ngắn"
                />
                <input
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                  value={newPublicPage.imageUrl}
                  onChange={(event) => setNewPublicPage((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="Link ảnh nếu có"
                />
                <input
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                  value={newPublicPage.videoUrl}
                  onChange={(event) => setNewPublicPage((current) => ({ ...current, videoUrl: event.target.value }))}
                  placeholder="Link video nếu có"
                />
                <input
                  className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012] md:col-span-2"
                  value={newPublicPage.linkUrl}
                  onChange={(event) => setNewPublicPage((current) => ({ ...current, linkUrl: event.target.value }))}
                  placeholder="Link xem thêm nếu có"
                />
                <button
                  type="button"
                  onClick={createPublicNews}
                  disabled={creatingPublicPage}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#c40012] px-4 text-xs font-black text-white disabled:opacity-60 md:col-span-2"
                >
                  {creatingPublicPage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Thêm tin tức
                </button>
              </div>
            </div>
            {[...(publicPagesGroup.options || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((option) => {
              const meta = optionMetadata(option);
              const isAbout = option.value === 'about' || meta.type === 'about';
              return (
                <article key={option.id} className="rounded-2xl border border-red-50 bg-[#fff8f2] p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#c40012]">{isAbout ? 'Trang giới thiệu' : 'Tin tức'}</span>
                    <button
                      type="button"
                      onClick={() => saveWholeOption({ ...option, isActive: option.isActive === false })}
                      disabled={savingOptionId === option.id}
                      className={`rounded-full px-3 py-1 text-xs font-black ${option.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}
                    >
                      {option.isActive === false ? 'Đang ẩn' : 'Đang hiện'}
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012] md:col-span-2"
                      value={option.label}
                      onChange={(event) => updateOptionLocal(option.id, { label: event.target.value })}
                      placeholder="Tiêu đề"
                    />
                    {isAbout ? (
                      <input
                        className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012] md:col-span-2"
                        value={String(meta.subtitle || '')}
                        onChange={(event) => updateOptionMetadataLocal(option, 'subtitle', event.target.value)}
                        placeholder="Dòng mô tả ngắn"
                      />
                    ) : null}
                    <textarea
                      className="min-h-24 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold leading-6 outline-none focus:border-[#c40012] md:col-span-2"
                      value={String(meta.body || '')}
                      onChange={(event) => updateOptionMetadataLocal(option, 'body', event.target.value)}
                      placeholder="Nội dung"
                    />
                    <input
                      className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                      value={String(meta.imageUrl || '')}
                      onChange={(event) => updateOptionMetadataLocal(option, 'imageUrl', event.target.value)}
                      placeholder="Link ảnh"
                    />
                    <input
                      className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                      value={String(meta.videoUrl || '')}
                      onChange={(event) => updateOptionMetadataLocal(option, 'videoUrl', event.target.value)}
                      placeholder="Link video"
                    />
                    <input
                      className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012] md:col-span-2"
                      value={String(meta.linkUrl || '')}
                      onChange={(event) => updateOptionMetadataLocal(option, 'linkUrl', event.target.value)}
                      placeholder="Link xem thêm"
                    />
                    <button
                      type="button"
                      onClick={() => saveWholeOption(option)}
                      disabled={savingOptionId === option.id}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#c40012] px-4 text-xs font-black text-white disabled:opacity-60 md:col-span-2"
                    >
                      {savingOptionId === option.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Lưu nội dung
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

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
                  {editableCatalogGroups.has(group.id) ? (
                    <div className="my-3 rounded-2xl border border-red-100 bg-[#fff8f2] p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#25202a]">
                        <Plus className="h-4 w-4 text-[#c40012]" />
                        Thêm lựa chọn
                      </div>
                      <div className={`grid gap-2 ${group.id === 'signing_criteria' ? 'md:grid-cols-[1fr_160px_100px_auto]' : 'md:grid-cols-[1fr_180px_auto]'}`}>
                        <input
                          className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                          value={(newOptions[group.id] || emptyOptionDraft).label}
                          onChange={(event) => updateNewOption(group.id, { label: event.target.value })}
                          placeholder="Tên hiển thị"
                        />
                        <input
                          className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                          value={(newOptions[group.id] || emptyOptionDraft).value}
                          onChange={(event) => updateNewOption(group.id, { value: event.target.value })}
                          placeholder="Mã nội bộ (có thể bỏ trống)"
                        />
                        {group.id === 'signing_criteria' ? (
                          <input
                            className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#c40012]"
                            value={(newOptions[group.id] || emptyOptionDraft).score}
                            onChange={(event) => updateNewOption(group.id, { score: event.target.value })}
                            placeholder="Điểm"
                            inputMode="numeric"
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => createConfigOption(group)}
                          disabled={creatingOptionGroup === group.id}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#c40012] px-4 text-xs font-black text-white disabled:opacity-60"
                        >
                          {creatingOptionGroup === group.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          Thêm
                        </button>
                      </div>
                    </div>
                  ) : group.id === 'property_field_labels' ? (
                    <div className="my-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-[#735a18]">
                      V1 cho phép sửa tên và ẩn/hiện các trường không bắt buộc. Tạo field hoàn toàn mới được tách sang phase cấu hình nâng cao để tránh phá form nghiệp vụ.
                    </div>
                  ) : null}
                  {[...(group.options || [])].sort((first, second) => first.sortOrder - second.sortOrder).map((option, optionIndex, sortedOptions) => {
                    const locked = isLockedOption(group.id, option);
                    return (
                    <div
                      key={option.id}
                      draggable={editingOptionId !== option.id && !savingOptionId}
                      onDragStart={() => setDraggingOptionId(option.id)}
                      onDragOver={(event) => {
                        if (draggingOptionId && draggingOptionId !== option.id) event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        void dropGroupOption(group, option);
                      }}
                      onDragEnd={() => setDraggingOptionId('')}
                      className={`flex items-center justify-between gap-3 border-b border-gray-50 py-3 last:border-0 ${draggingOptionId === option.id ? 'opacity-60' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        {editingOptionId === option.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              value={editingLabel}
                              onChange={(event) => setEditingLabel(event.target.value)}
                              className="min-h-10 min-w-0 flex-1 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold text-[#25202a] outline-none focus:border-[#c40012]"
                              autoFocus
                            />
                            {group.id === 'signing_criteria' ? (
                              <input
                                value={option.score ?? ''}
                                onChange={(event) => updateOptionLocal(option.id, { score: event.target.value === '' ? null : Number(event.target.value) })}
                                className="min-h-10 rounded-xl border border-red-100 bg-white px-3 text-sm font-bold text-[#25202a] outline-none focus:border-[#c40012] sm:w-24"
                                placeholder="Điểm"
                                inputMode="numeric"
                              />
                            ) : null}
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
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span
                                title="Kéo thả để sắp xếp"
                                className="hidden h-8 w-8 shrink-0 cursor-grab place-items-center rounded-xl border border-gray-100 bg-white text-[#9aa2af] active:cursor-grabbing sm:grid"
                              >
                                <GripVertical className="h-4 w-4" />
                              </span>
                              <p className="min-w-0 truncate text-sm font-bold text-[#25202a]">{option.label}</p>
                              {locked ? (
                                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-700">
                                  Bắt buộc
                                </span>
                              ) : null}
                              {group.id === 'signing_criteria' && option.score != null ? (
                                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-black text-blue-700">
                                  {Number(option.score) > 0 ? '+' : ''}{option.score} điểm
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-xs font-medium text-[#8a919e]">{option.value}</p>
                          </>
                        )}
                      </div>
                      {editingOptionId !== option.id && (
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Đưa lên"
                            onClick={() => reorderGroupOption(group, option, -1)}
                            disabled={savingOptionId === option.id || optionIndex === 0}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-gray-100 bg-white text-[#667085] disabled:opacity-35"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Đưa xuống"
                            onClick={() => reorderGroupOption(group, option, 1)}
                            disabled={savingOptionId === option.id || optionIndex === sortedOptions.length - 1}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-gray-100 bg-white text-[#667085] disabled:opacity-35"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
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
                            disabled={savingOptionId === option.id || locked}
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black disabled:opacity-60 ${option.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}
                          >
                            {locked ? 'Bắt buộc' : savingOptionId === option.id ? 'Đang lưu...' : option.isActive === false ? 'Tạm ẩn' : 'Đang dùng'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteConfigOption(group, option)}
                            disabled={savingOptionId === option.id || locked}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-[#c40012] disabled:opacity-35"
                          >
                            <X className="h-3.5 w-3.5" />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
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
