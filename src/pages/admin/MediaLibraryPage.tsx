import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clipboard, ImagePlus, Images, Loader2, Pencil, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mediaApi } from '../../services/mediaApi';
import type { MediaItem, MediaSource } from '../../types/media';

const sourceLabels: Record<string, string> = {
  media_library: 'Kho Media',
  branding_logo: 'Logo thương hiệu',
  branding_banner: 'Banner thương hiệu',
  event_banner: 'Banner sự kiện',
  event_section: 'Nội dung sự kiện',
  recruitment_banner: 'Banner tuyển dụng',
  recruitment_section: 'Nội dung tuyển dụng',
  public_page_image: 'Giới thiệu / Tin tức',
  admin_upload: 'Tải lên từ quản trị',
};

export default function MediaLibraryPage() {
  const { hasApprovedRole } = useAuth();
  const canDelete = hasApprovedRole('admin_tong');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (nextPage = 1, append = false) => {
    setLoading(true);
    setMessage('');
    try {
      const result = await mediaApi.list({ q: query, source, page: nextPage, limit: 36 });
      setItems((current) => append ? [...current, ...result.items] : result.items);
      setSources(result.sources);
      setTotal(result.total);
      setPage(result.page);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Chưa tải được Kho Media.');
      if (!append) setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query, source]);

  useEffect(() => { void load(1, false); }, [load]);

  const upload = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []).slice(0, 12);
    if (!files.length) return;
    setUploading(true);
    setMessage('');
    try {
      const result = await mediaApi.upload(files, 'media_library');
      setItems((current) => [...result.items, ...current.filter((item) => !result.items.some((next) => next.id === item.id))]);
      setTotal((current) => current + result.items.length);
      setMessage(`Đã tải ${result.items.length} ảnh vào Kho Media.`);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Chưa tải được ảnh.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    if (!editing || saving) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await mediaApi.update(editing.id, { title: editing.title, altText: editing.altText });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(updated);
      setMessage('Đã lưu tên và mô tả ảnh.');
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Chưa lưu được thông tin ảnh.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: MediaItem) => {
    if (!canDelete || !window.confirm(`Ẩn "${item.title || item.originalName}" khỏi Kho Media? Ảnh đang dùng trong bài viết vẫn được giữ nguyên.`)) return;
    setMessage('');
    try {
      await mediaApi.remove(item.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setTotal((current) => Math.max(0, current - 1));
      if (editing?.id === item.id) setEditing(null);
      setMessage('Đã ẩn ảnh khỏi Kho Media. File và nội dung đang sử dụng ảnh không bị xóa.');
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Chưa ẩn được ảnh.');
    }
  };

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(''), 1_500);
    } catch {
      setMessage('Trình duyệt chưa cho phép sao chép tự động. Bạn có thể mở chi tiết ảnh để lấy đường dẫn.');
    }
  };

  return (
    <div className="min-w-0 pb-10">
      <header className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#c40012]">Quản trị nội dung</p>
          <h1 className="mt-1 text-2xl font-black text-[#25202a]">Kho Media</h1>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[#667085]">Tải, tìm và tái sử dụng ảnh cho logo, banner, sự kiện, tuyển dụng, giới thiệu và tin tức.</p>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white shadow-sm">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          Tải ảnh lên kho
          <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={(event) => void upload(event.target.files)} />
        </label>
      </header>

      {message ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">{message}</div> : null}

      <section className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && setQuery(queryInput.trim())} placeholder="Tìm tên ảnh hoặc mô tả" className="h-11 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#c40012]" />
        </label>
        <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Lọc theo nơi sử dụng" className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-[#514b54] sm:w-56">
          <option value="">Tất cả nguồn ảnh</option>
          {sources.map((item) => <option key={item.value} value={item.value}>{sourceLabels[item.value] || item.value} ({item.total})</option>)}
        </select>
        <button type="button" onClick={() => setQuery(queryInput.trim())} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-black text-[#514b54]"><Search className="h-4 w-4" />Tìm</button>
      </section>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-[#747b88]">
        <span>{total} ảnh trong kho</span>
        <span>JPG, PNG, WebP · tối đa 12 ảnh/lượt</span>
      </div>

      {loading && items.length === 0 ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#c40012]" /></div> : items.length ? (
        <>
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <article key={item.id} className="group min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-[#c40012] hover:shadow-md">
                <button type="button" onClick={() => setEditing({ ...item })} className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-100 text-left">
                  <img src={item.url} alt={item.altText || item.title || ''} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[#c40012] shadow"><Pencil className="h-4 w-4" /></span>
                </button>
                <div className="p-3">
                  <h2 className="truncate text-sm font-black text-[#25202a]">{item.title || item.originalName || 'Ảnh chưa đặt tên'}</h2>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[#747b88]">{sourceLabels[item.sourceContext] || item.sourceContext}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#747b88]">{item.width && item.height ? `${item.width} × ${item.height}px` : 'Không có kích thước'}{item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ''}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => void copyUrl(item)} title="Sao chép đường dẫn" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-xs font-black text-[#514b54]">{copiedId === item.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}{copiedId === item.id ? 'Đã chép' : 'Chép link'}</button>
                    {canDelete ? <button type="button" onClick={() => void remove(item)} title="Ẩn khỏi Kho Media" aria-label={`Ẩn ${item.title || item.originalName} khỏi Kho Media`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button> : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
          {items.length < total ? <div className="mt-5 text-center"><button type="button" disabled={loading} onClick={() => void load(page + 1, true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-black text-[#514b54] disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Tải thêm ảnh</button></div> : null}
        </>
      ) : <div className="mt-5 grid min-h-72 place-items-center border-y border-gray-100 text-center"><div><Images className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-base font-black text-[#514b54]">Kho chưa có ảnh phù hợp</p><p className="mt-1 text-sm font-medium text-[#747b88]">Thử bỏ bộ lọc hoặc tải ảnh mới.</p></div></div>}

      {editing ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="media-detail-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-lg bg-white p-4 shadow-2xl sm:rounded-lg sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="media-detail-title" className="text-lg font-black text-[#25202a]">Thông tin ảnh</h2>
              <button type="button" onClick={() => setEditing(null)} title="Đóng" className="grid h-10 w-10 place-items-center rounded-full text-[#667085] hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
              <img src={editing.url} alt={editing.altText || editing.title || ''} className="max-h-[430px] w-full rounded-lg border border-gray-200 bg-gray-50 object-contain" />
              <div className="space-y-4">
                <label className="block"><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Tên ảnh</span><input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]" /></label>
                <label className="block"><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Mô tả ảnh</span><textarea value={editing.altText} onChange={(event) => setEditing({ ...editing, altText: event.target.value })} rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold leading-6 outline-none focus:border-[#c40012]" /></label>
                <div className="rounded-lg bg-gray-50 px-3 py-3 text-xs font-semibold leading-6 text-[#667085]">
                  <div>{editing.originalName || 'Không có tên tệp gốc'}</div>
                  <div>{editing.width && editing.height ? `${editing.width} × ${editing.height}px` : 'Không có kích thước'}{editing.fileSize ? ` · ${formatBytes(editing.fileSize)}` : ''}</div>
                  <div>{sourceLabels[editing.sourceContext] || editing.sourceContext}</div>
                </div>
                <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white disabled:opacity-60">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}Lưu thông tin</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
