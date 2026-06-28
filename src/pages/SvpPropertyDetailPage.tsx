import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, History, ImagePlus, Loader2, Phone, ShieldCheck, Tag, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpConfigGroup, SvpProperty, SvpPropertyMedia, SvpPropertyTimelineEvent, SvpPropertyVersion } from '../types/svp';
import { activeOptions, formatDateTime, formatVnd, optionLabel, optionLabels } from '../utils/svpDisplay';

const SvpPropertyDetailPage = () => {
  const { id } = useParams();
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [property, setProperty] = useState<SvpProperty | null>(null);
  const [media, setMedia] = useState<SvpPropertyMedia[]>([]);
  const [timeline, setTimeline] = useState<SvpPropertyTimelineEvent[]>([]);
  const [versions, setVersions] = useState<SvpPropertyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState('');
  const [savingMedia, setSavingMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [error, setError] = useState('');

  usePageTitle(property?.title || 'Chi tiết nhà');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [nextGroups, nextProperty, nextTimeline, nextVersions, nextMedia] = await Promise.all([
        svpApi.getConfig(),
        svpApi.getProperty(id),
        svpApi.getPropertyTimeline(id),
        svpApi.getPropertyVersions(id),
        svpApi.listPropertyMedia(id),
      ]);
      setGroups(nextGroups);
      setProperty(nextProperty);
      setTimeline(nextTimeline);
      setVersions(nextVersions);
      setMedia(nextMedia);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được chi tiết nhà');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const statusOptions = useMemo(() => activeOptions(groups, 'property_statuses'), [groups]);
  const tagLabels = useMemo(
    () => optionLabels(groups, 'property_tags', property?.tagIds || []),
    [groups, property?.tagIds],
  );
  const visibilityLabels = useMemo(
    () => optionLabels(groups, 'visibility_levels', property?.visibilityIds || []),
    [groups, property?.visibilityIds],
  );

  const updateStatus = async (nextStatusId: string) => {
    if (!property) return;
    setSavingStatus(nextStatusId);
    setError('');
    try {
      const updated = await svpApi.updateProperty(property.id, { statusId: nextStatusId });
      setProperty(updated);
      const [nextTimeline, nextVersions] = await Promise.all([
        svpApi.getPropertyTimeline(property.id),
        svpApi.getPropertyVersions(property.id),
      ]);
      setTimeline(nextTimeline);
      setVersions(nextVersions);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Không cập nhật được trạng thái');
    } finally {
      setSavingStatus('');
    }
  };

  const addMedia = async (url: string, caption = mediaCaption) => {
    if (!property || !url.trim()) return;
    setSavingMedia(true);
    setError('');
    try {
      const created = await svpApi.createPropertyMedia({
        propertyId: property.id,
        mediaType: url.startsWith('data:video') ? 'video' : 'image',
        url: url.trim(),
        caption: caption.trim(),
        sortOrder: media.length + 1,
      });
      setMedia((current) => [created, ...current]);
      setMediaUrl('');
      setMediaCaption('');
      setTimeline(await svpApi.getPropertyTimeline(property.id));
    } catch (mediaError) {
      setError(mediaError instanceof Error ? mediaError.message : 'Không thêm được media');
    } finally {
      setSavingMedia(false);
    }
  };

  const handleFileMedia = async (file?: File) => {
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    await addMedia(dataUrl, mediaCaption || file.name);
  };

  const latestVersion = versions[0];
  const latestSnapshotTitle = typeof latestVersion?.snapshot.title === 'string' ? latestVersion.snapshot.title : property?.title;

  return (
    <PageShell maxWidth="max-w-[1320px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/nha" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-[#D7DAE3] hover:border-[#F6D37A]/50 hover:text-[#F6D37A]">
            <ArrowLeft className="h-4 w-4" />
            Danh sách nhà
          </Link>
          <Link to="/post-property" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#F6D37A] px-3 text-[13px] font-black text-[#101114] hover:bg-[#FFE8A3]">
            Thêm nhà
          </Link>
        </div>

        {error && (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-white/10 bg-[#08090C] text-[#A7ABB6]">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
            Đăng tai ho so nha...
          </div>
        ) : !property ? (
          <div className="rounded-lg border border-white/10 bg-[#08090C] px-5 py-16 text-center">
            <div className="text-xl font-bold text-[#F5F0E6]">Không tìm thấy nhà</div>
            <p className="mt-2 text-[14px] text-[#A7ABB6]">Mã nhà khong ton tai hoac da bi xoa.</p>
          </div>
        ) : (
          <>
            <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#F6D37A]/10 px-3 py-1 text-[12px] font-black text-[#F6D37A]">{property.code}</span>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-semibold text-[#D7DAE3]">
                      {optionLabel(groups, 'property_statuses', property.statusId)}
                    </span>
                  </div>
                  <h1 className="mt-4 text-2xl font-black text-[#F5F0E6] sm:text-4xl">{property.title}</h1>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-[#A7ABB6]">
                    <span>{formatVnd(property.price)}</span>
                    {property.areaM2 ? <span>{property.areaM2} m2</span> : null}
                    <span>{property.district || '-'}{property.ward ? `, ${property.ward}` : ''}</span>
                    <span>{optionLabel(groups, 'company_units', property.companyUnitId)}</span>
                  </div>
                </div>
                <div className="grid min-w-[220px] grid-cols-2 gap-3 rounded-lg border border-[#F6D37A]/20 bg-[#F6D37A]/10 p-4">
                  <div>
                    <div className="text-[12px] font-bold text-[#F6D37A]">Điểm ky</div>
                    <div className="mt-1 text-2xl font-black text-[#F5F0E6]">{property.signingScore}</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#F6D37A]">Version</div>
                    <div className="mt-1 text-2xl font-black text-[#F5F0E6]">{versions.length}</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <main className="space-y-6">
                <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                  <h2 className="mb-4 text-lg font-bold text-[#F5F0E6]">Thông tin chi tiết</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBlock icon={<UserRound className="h-4 w-4" />} label="Chủ nhà / phụ trách" value={property.ownerName || '-'} />
                    <InfoBlock icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={property.ownerPhone || '-'} />
                    <InfoBlock icon={<ShieldCheck className="h-4 w-4" />} label="Sổ đỏ / giấy tờ" value={property.bookSerial || '-'} />
                    <InfoBlock icon={<Clock3 className="h-4 w-4" />} label="Cập nhật" value={formatDateTime(property.updatedAt || property.createdAt)} />
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <TextPanel title="Địa chỉ hiển thị" value={property.address || '-'} />
                    <TextPanel title="Địa chỉ ẩn / thông tin bảo mật" value={property.hiddenAddress || '-'} />
                  </div>
                  <TextPanel title="Mô tả" value={property.description || '-'} className="mt-4" />
                </section>

                <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#F5F0E6]">
                    <History className="h-5 w-5 text-[#F6D37A]" />
                    Timeline
                  </h2>
                  <div className="space-y-3">
                    {timeline.length === 0 ? (
                      <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-[14px] text-[#A7ABB6]">
                        Chưa có sự kiện nào.
                      </div>
                    ) : timeline.map((event) => (
                      <div key={event.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="font-bold text-[#F5F0E6]">{event.title}</div>
                          <div className="text-[12px] text-[#8A8F98]">{formatDateTime(event.createdAt)}</div>
                        </div>
                        {event.description && <div className="mt-2 text-[13px] leading-6 text-[#A7ABB6]">{event.description}</div>}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                  <h2 className="mb-4 text-lg font-bold text-[#F5F0E6]">Version không ghi đè</h2>
                  <div className="space-y-3">
                    {versions.length === 0 ? (
                      <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-[14px] text-[#A7ABB6]">
                        Chưa có bản ghi version.
                      </div>
                    ) : versions.map((version) => {
                      const snapshotPrice = typeof version.snapshot.price === 'number' ? version.snapshot.price : property.price;
                      return (
                        <div key={version.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="font-bold text-[#F5F0E6]">Version {version.versionNo}</div>
                            <div className="text-[12px] text-[#8A8F98]">{formatDateTime(version.createdAt)}</div>
                          </div>
                          <div className="mt-2 text-[13px] text-[#A7ABB6]">{version.changeNote || 'Cập nhật du lieu'}</div>
                          <div className="mt-3 rounded-md bg-black/25 px-3 py-2 text-[12px] text-[#D7DAE3]">
                            {String(version.snapshot.title || latestSnapshotTitle)} - {formatVnd(snapshotPrice)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </main>

              <aside className="space-y-5">
                <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#F5F0E6]">
                    <ImagePlus className="h-4 w-4 text-[#F6D37A]" />
                    Hình ảnh / media
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {media.slice(0, 4).map((item) => (
                      <div key={item.id} className="aspect-square overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
                        {item.mediaType === 'video' ? (
                          <video src={item.url} controls className="h-full w-full object-cover" />
                        ) : (
                          <img src={item.url} alt={item.caption || property.title} className="h-full w-full object-cover" />
                        )}
                      </div>
                    ))}
                    {media.length === 0 && (
                      <div className="col-span-2 rounded-md border border-white/10 bg-white/[0.035] p-4 text-[13px] text-[#8A8F98]">
                        Chưa có media.
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <input
                      value={mediaUrl}
                      onChange={(event) => setMediaUrl(event.target.value)}
                      placeholder="Dán URL ảnh/video"
                      className="min-h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[13px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
                    />
                    <input
                      value={mediaCaption}
                      onChange={(event) => setMediaCaption(event.target.value)}
                      placeholder="Chú thích"
                      className="min-h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[13px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => void addMedia(mediaUrl)}
                        disabled={savingMedia || !mediaUrl.trim()}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-3 text-[13px] font-black text-[#101114] disabled:cursor-wait disabled:opacity-70"
                      >
                        {savingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        Thêm URL
                      </button>
                      <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-[#D7DAE3] hover:border-[#F6D37A]/50 hover:text-[#F6D37A]">
                        <ImagePlus className="h-4 w-4" />
                        Upload local
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(event) => void handleFileMedia(event.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                  <h2 className="mb-4 text-[14px] font-bold text-[#F5F0E6]">Đổi trạng thái nhanh</h2>
                  <div className="space-y-2">
                    {statusOptions.map((status) => {
                      const active = property.statusId === status.id;
                      return (
                        <button
                          key={status.id}
                          type="button"
                          disabled={active || Boolean(savingStatus)}
                          onClick={() => void updateStatus(status.id)}
                          className={`flex min-h-11 w-full items-center justify-between rounded-md border px-3 text-left text-[13px] font-semibold transition-colors ${
                            active
                              ? 'border-[#F6D37A]/70 bg-[#F6D37A]/12 text-[#F5F0E6]'
                              : 'border-white/10 bg-white/[0.035] text-[#D7DAE3] hover:border-[#F6D37A]/50 disabled:cursor-wait disabled:opacity-60'
                          }`}
                        >
                          <span>{status.label}</span>
                          {savingStatus === status.id ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <CheckCircle2 className="h-4 w-4 text-[#F6D37A]" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#F5F0E6]">
                    <Tag className="h-4 w-4 text-[#F6D37A]" />
                    Đặc điểm nhà
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tagLabels.length > 0 ? tagLabels.map((label) => (
                      <span key={label} className="rounded-full bg-[#F6D37A]/10 px-3 py-1 text-[12px] font-bold text-[#F6D37A]">
                        {label}
                      </span>
                    )) : <span className="text-[13px] text-[#8A8F98]">Chưa gắn tag.</span>}
                  </div>
                </section>

                <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                  <h2 className="mb-4 text-[14px] font-bold text-[#F5F0E6]">Quyền xem</h2>
                  <div className="space-y-2">
                    {visibilityLabels.length > 0 ? visibilityLabels.map((label) => (
                      <div key={label} className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-[13px] font-semibold text-[#D7DAE3]">
                        {label}
                      </div>
                    )) : <span className="text-[13px] text-[#8A8F98]">Chưa cấu hình quyền xem.</span>}
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
};

interface InfoBlockProps {
  icon: ReactNode;
  label: string;
  value: string;
}

const InfoBlock = ({ icon, label, value }: InfoBlockProps) => (
  <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
    <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8A8F98]">
      <span className="text-[#F6D37A]">{icon}</span>
      {label}
    </div>
    <div className="mt-2 break-words text-[15px] font-semibold text-[#F5F0E6]">{value}</div>
  </div>
);

interface TextPanelProps {
  title: string;
  value: string;
  className?: string;
}

const TextPanel = ({ title, value, className = '' }: TextPanelProps) => (
  <div className={`rounded-md border border-white/10 bg-white/[0.035] p-4 ${className}`}>
    <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8A8F98]">{title}</div>
    <div className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 text-[#D7DAE3]">{value}</div>
  </div>
);

export default SvpPropertyDetailPage;
