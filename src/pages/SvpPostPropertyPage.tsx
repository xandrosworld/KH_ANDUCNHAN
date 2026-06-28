import { useEffect, useMemo, useRef, useState } from 'react';
import Form from '@rjsf/core';
import type { IChangeEvent } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';
import { ArrowLeft, Building2, CheckCircle2, ImagePlus, Loader2, Save, Sparkles, Tag, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpConfigGroup, SvpConfigOption, SvpProperty } from '../types/svp';
import { activeOptions } from '../utils/svpDisplay';

interface SvpPropertyFormData {
  title: string;
  ownerName: string;
  ownerPhone: string;
  bookSerial: string;
  price: number;
  areaM2?: number;
  district: string;
  ward: string;
  address: string;
  hiddenAddress: string;
  companyUnitId: string;
  statusId: string;
  description: string;
}

const emptyForm: SvpPropertyFormData = {
  title: '',
  ownerName: '',
  ownerPhone: '',
  bookSerial: '',
  price: 0,
  areaM2: undefined,
  district: '',
  ward: '',
  address: '',
  hiddenAddress: '',
  companyUnitId: '',
  statusId: '',
  description: '',
};

const svpValidator = validator as ValidatorType<SvpPropertyFormData, RJSFSchema>;

type PendingMediaCategory = 'approval_document' | 'red_book' | 'house_image' | 'owner_selfie' | 'contract_document';

interface PendingMediaFile {
  id: string;
  file: File;
  previewUrl: string;
  category: PendingMediaCategory;
  caption: string;
}

const mediaCategoryOptions: Array<{ id: PendingMediaCategory; label: string }> = [
  { id: 'approval_document', label: 'Ảnh duyệt hồ sơ' },
  { id: 'red_book', label: 'Sổ đỏ / giấy tờ' },
  { id: 'house_image', label: 'Ảnh nhà' },
  { id: 'owner_selfie', label: 'Ảnh tự sướng' },
  { id: 'contract_document', label: 'Hợp đồng / tài liệu' },
];

function oneOfFromOptions(options: SvpConfigOption[]) {
  return options.map((option) => ({
    const: option.id,
    title: option.label,
  }));
}

const SvpPostPropertyPage = () => {
  usePageTitle('Đăng Bí Kíp');
  const navigate = useNavigate();
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [formData, setFormData] = useState<SvpPropertyFormData>(emptyForm);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [visibilityIds, setVisibilityIds] = useState<string[]>([]);
  const [criteriaIds, setCriteriaIds] = useState<string[]>([]);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaFile[]>([]);
  const [mediaCategory, setMediaCategory] = useState<PendingMediaCategory>('house_image');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pendingMediaRef = useRef<PendingMediaFile[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadConfig() {
      setLoading(true);
      setError('');
      try {
        const nextGroups = await svpApi.getConfig();
        if (!alive) return;
        const defaultCompany = activeOptions(nextGroups, 'company_units')[0]?.id || '';
        const defaultStatus = activeOptions(nextGroups, 'property_statuses')[0]?.id || '';
        setGroups(nextGroups);
        setFormData((current) => ({
          ...current,
          companyUnitId: current.companyUnitId || defaultCompany,
          statusId: current.statusId || defaultStatus,
        }));
      } catch (loadError) {
        if (alive) setError(loadError instanceof Error ? loadError.message : 'Không tải được cấu hình form');
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadConfig();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    pendingMediaRef.current = pendingMedia;
  }, [pendingMedia]);

  useEffect(() => () => {
    pendingMediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const companyOptions = useMemo(() => activeOptions(groups, 'company_units'), [groups]);
  const statusOptions = useMemo(() => activeOptions(groups, 'property_statuses'), [groups]);
  const tagOptions = useMemo(() => activeOptions(groups, 'property_tags'), [groups]);
  const visibilityOptions = useMemo(() => activeOptions(groups, 'visibility_levels'), [groups]);
  const criteriaOptions = useMemo(() => activeOptions(groups, 'signing_criteria'), [groups]);

  const signingScore = useMemo(
    () => criteriaOptions
      .filter((option) => criteriaIds.includes(option.id))
      .reduce((total, option) => total + Number(option.score || 0), 0),
    [criteriaIds, criteriaOptions],
  );

  const schema = useMemo<RJSFSchema>(() => ({
    title: '',
    type: 'object',
    required: ['title', 'ownerName', 'ownerPhone', 'price', 'district', 'address', 'companyUnitId', 'statusId'],
    properties: {
      title: { type: 'string', title: 'Tiêu đề (*)' },
      ownerName: { type: 'string', title: 'Chủ nhà (*)' },
      ownerPhone: { type: 'string', title: 'Số điện thoại chủ nhà (*)' },
      bookSerial: { type: 'string', title: 'Số seri sổ' },
      price: { type: 'number', title: 'Giá (*)', minimum: 0 },
      areaM2: { type: 'number', title: 'Diện tích (m²) (*)', minimum: 0 },
      district: { type: 'string', title: 'Quận/Huyện (*)' },
      ward: { type: 'string', title: 'Phường/Xã' },
      address: { type: 'string', title: 'Địa điểm nhà (*)' },
      hiddenAddress: { type: 'string', title: 'Địa chỉ ẩn / thông tin bảo mật' },
      companyUnitId: { type: 'string', title: 'Công ty thành viên (*)', oneOf: oneOfFromOptions(companyOptions) },
      statusId: { type: 'string', title: 'Trạng thái (*)', oneOf: oneOfFromOptions(statusOptions) },
      description: { type: 'string', title: 'Mô tả chi tiết' },
    },
  }), [companyOptions, statusOptions]);

  const uiSchema = useMemo<UiSchema<SvpPropertyFormData>>(() => ({
    'ui:submitButtonOptions': { norender: true },
    title: { 'ui:placeholder': 'VD: Nhà mặt tiền Bình Thạnh, 72m2, ô tô ngủ trong nhà' },
    ownerPhone: { 'ui:placeholder': 'Nhập số để môi giới liên hệ đúng người' },
    bookSerial: { 'ui:placeholder': 'Số vào sổ, CCCD chủ nhà hoặc ghi chú giấy tờ' },
    hiddenAddress: {
      'ui:widget': 'textarea',
      'ui:options': { rows: 3 },
      'ui:placeholder': 'Thông tin chi tiết chỉ hiện với nhóm được phân quyền',
    },
    description: {
      'ui:widget': 'textarea',
      'ui:options': { rows: 5 },
      'ui:placeholder': 'Mô tả cấu trúc nhà, dòng tiền, lợi thế, ghi chú chủ nhà...',
    },
  }), []);

  const toggleId = (id: string, values: string[], setter: (value: string[]) => void) => {
    setter(values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
  };

  const labelForMediaCategory = (id: PendingMediaCategory) =>
    mediaCategoryOptions.find((option) => option.id === id)?.label || 'Ảnh / tài liệu';

  const handleMediaFiles = (files?: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (selected.length === 0) {
      setError('Chỉ hỗ trợ upload ảnh jpg/png/webp trên form đăng nhà.');
      return;
    }
    if (pendingMedia.length + selected.length > 41) {
      setError('Tối đa 41 ảnh cho một hồ sơ nhà.');
      return;
    }
    setError('');
    setPendingMedia((current) => [
      ...current,
      ...selected.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        category: mediaCategory,
        caption: labelForMediaCategory(mediaCategory),
      })),
    ]);
  };

  const updatePendingMedia = (id: string, updates: Partial<Pick<PendingMediaFile, 'category' | 'caption'>>) => {
    setPendingMedia((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...updates };
      if (updates.category && !updates.caption) {
        next.caption = labelForMediaCategory(updates.category);
      }
      return next;
    }));
  };

  const removePendingMedia = (id: string) => {
    setPendingMedia((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  const buildPropertyInput = (data: SvpPropertyFormData): Omit<SvpProperty, 'id' | 'code' | 'createdAt' | 'updatedAt'> => ({
    title: data.title.trim(),
    description: data.description.trim(),
    ownerName: data.ownerName.trim(),
    ownerPhone: data.ownerPhone.trim(),
    bookSerial: data.bookSerial.trim(),
    price: Number(data.price || 0),
    priceUnit: 'VND',
    areaM2: data.areaM2 ? Number(data.areaM2) : null,
    district: data.district.trim(),
    ward: data.ward.trim(),
    address: data.address.trim(),
    hiddenAddress: data.hiddenAddress.trim(),
    companyUnitId: data.companyUnitId,
    statusId: data.statusId,
    signingScore,
    visibilityIds,
    tagIds,
    extra: {
      source: 'svp_rjsf_form_v1',
      signingCriteriaIds: criteriaIds,
      completeness: {
        hasBookSerial: Boolean(data.bookSerial.trim()),
        hasHiddenAddress: Boolean(data.hiddenAddress.trim()),
        tagCount: tagIds.length,
      },
    },
  });

  const handleSubmit = async (event: IChangeEvent<SvpPropertyFormData>) => {
    setSaving(true);
    setError('');
    try {
      const submitted = event.formData || emptyForm;
      const created = await svpApi.createProperty(buildPropertyInput(submitted));
      for (const item of pendingMedia) {
        await svpApi.uploadPropertyMediaImages(
          created.id,
          [item.file],
          item.caption.trim() || labelForMediaCategory(item.category),
          item.category,
        );
      }
      navigate(`/nha/${created.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không lưu được nhà');
    } finally {
      setSaving(false);
    }
  };

  const selectedTagCount = tagIds.length;
  const selectedVisibilityCount = visibilityIds.length;

  return (
    <PageShell maxWidth="max-w-[1280px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/nha" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-[#D7DAE3] hover:border-[#F6D37A]/50 hover:text-[#F6D37A]">
            <ArrowLeft className="h-4 w-4" />
            Danh sách nhà
          </Link>
          <Link to="/admin/config" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-[#D7DAE3] hover:border-[#F6D37A]/50 hover:text-[#F6D37A]">
            <Building2 className="h-4 w-4" />
            Cấu hình form
          </Link>
        </div>

        <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
                <Sparkles className="h-4 w-4" />
                Thông tin cơ bản
              </div>
              <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Đăng Bí Kíp</h1>
              <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
                Nhập đúng các trường thông tin nhà theo mẫu khách đang dùng.
              </p>
            </div>
            <div className="rounded-md border border-[#F6D37A]/25 bg-[#F6D37A]/10 px-4 py-3 text-right">
              <div className="text-[12px] font-semibold text-[#F6D37A]">Điểm ký nhà</div>
              <div className="mt-1 text-2xl font-black text-[#F5F0E6]">{signingScore}</div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
            {loading ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-[#A7ABB6]">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
                Đăng tai cau hinh form...
              </div>
            ) : (
              <Form<SvpPropertyFormData>
                className="svp-rjsf"
                schema={schema}
                uiSchema={uiSchema}
                validator={svpValidator}
                formData={formData}
                noHtml5Validate
                onChange={(event) => {
                  if (event.formData) setFormData(event.formData);
                }}
                onSubmit={(event) => void handleSubmit(event)}
              >
                <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[13px] text-[#8A8F98]">
                    {selectedTagCount} đặc điểm, {selectedVisibilityCount} quyền xem, {criteriaIds.length} tiêu chí ký nhà, {pendingMedia.length} ảnh/tài liệu
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-5 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3] disabled:cursor-wait disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {pendingMedia.length > 0 ? 'Đăng Bí Kíp' : 'Đăng Bí Kíp'}
                  </button>
                </div>
              </Form>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
              <div className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#F5F0E6]">
                <ImagePlus className="h-4 w-4 text-[#F6D37A]" />
                Ảnh / tài liệu
              </div>
              <div className="space-y-3">
                <select
                  value={mediaCategory}
                  onChange={(event) => setMediaCategory(event.target.value as PendingMediaCategory)}
                  className="min-h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[13px] text-[#F5F0E6] outline-none focus:border-[#F6D37A]/60"
                >
                  {mediaCategoryOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#F6D37A]/35 bg-[#F6D37A]/8 px-3 text-center text-[13px] font-semibold text-[#D7DAE3] hover:border-[#F6D37A]/70">
                  <ImagePlus className="mb-2 h-5 w-5 text-[#F6D37A]" />
                  Chọn nhiều ảnh: HĐ, sổ đỏ, ảnh nhà, tự sướng
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      handleMediaFiles(event.target.files);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>

              {pendingMedia.length > 0 && (
                <div className="mt-4 space-y-3">
                  {pendingMedia.map((item) => (
                    <div key={item.id} className="grid grid-cols-[76px_minmax(0,1fr)_32px] gap-3 rounded-md border border-white/10 bg-white/[0.035] p-2">
                      <img src={item.previewUrl} alt={item.caption} className="h-[76px] w-[76px] rounded-md object-cover" />
                      <div className="min-w-0 space-y-2">
                        <select
                          value={item.category}
                          onChange={(event) => updatePendingMedia(item.id, { category: event.target.value as PendingMediaCategory })}
                          className="min-h-8 w-full rounded-md border border-white/10 bg-black/30 px-2 text-[12px] text-[#F5F0E6] outline-none"
                        >
                          {mediaCategoryOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                        <input
                          value={item.caption}
                          onChange={(event) => updatePendingMedia(item.id, { caption: event.target.value })}
                          className="min-h-8 w-full rounded-md border border-white/10 bg-black/30 px-2 text-[12px] text-[#F5F0E6] outline-none placeholder:text-[#666B76]"
                          placeholder="Chú thích ảnh"
                        />
                        <div className="truncate text-[11px] text-[#8A8F98]">{item.file.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingMedia(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-[#A7ABB6] hover:border-red-300/40 hover:text-red-100"
                        aria-label="Xóa ảnh chờ upload"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
              <div className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#F5F0E6]">
                <Tag className="h-4 w-4 text-[#F6D37A]" />
                Đặc điểm nhà
              </div>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((option) => {
                  const active = tagIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleId(option.id, tagIds, setTagIds)}
                      className={`min-h-9 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                        active
                          ? 'border-[#F6D37A] bg-[#F6D37A] text-[#101114]'
                          : 'border-white/10 bg-white/[0.035] text-[#D7DAE3] hover:border-[#F6D37A]/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
              <div className="mb-4 text-[14px] font-bold text-[#F5F0E6]">Quyền xem thông tin</div>
              <div className="space-y-2">
                {visibilityOptions.map((option) => {
                  const active = visibilityIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleId(option.id, visibilityIds, setVisibilityIds)}
                      className={`flex min-h-11 w-full items-center justify-between rounded-md border px-3 text-left text-[13px] font-semibold transition-colors ${
                        active
                          ? 'border-[#F6D37A]/80 bg-[#F6D37A]/12 text-[#F5F0E6]'
                          : 'border-white/10 bg-white/[0.035] text-[#D7DAE3] hover:border-[#F6D37A]/50'
                      }`}
                    >
                      <span>{option.label}</span>
                      {active && <CheckCircle2 className="h-4 w-4 text-[#F6D37A]" />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
              <div className="mb-4 text-[14px] font-bold text-[#F5F0E6]">Tiêu chí tính điểm ký nhà</div>
              <div className="space-y-2">
                {criteriaOptions.map((option) => {
                  const active = criteriaIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleId(option.id, criteriaIds, setCriteriaIds)}
                      className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                        active
                          ? 'border-[#F6D37A]/80 bg-[#F6D37A]/12'
                          : 'border-white/10 bg-white/[0.035] hover:border-[#F6D37A]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[13px] font-semibold text-[#F5F0E6]">{option.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${
                          Number(option.score || 0) >= 0
                            ? 'bg-emerald-400/10 text-emerald-200'
                            : 'bg-red-400/10 text-red-200'
                        }`}>
                          {Number(option.score || 0) > 0 ? '+' : ''}{option.score ?? 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PageShell>
  );
};

export default SvpPostPropertyPage;
