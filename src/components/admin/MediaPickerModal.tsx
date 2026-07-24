import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Images, Loader2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mediaApi } from '../../services/mediaApi';
import type { MediaItem } from '../../types/media';

interface MediaPickerModalProps {
  open: boolean;
  value?: string;
  sourceContext: string;
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

export default function MediaPickerModal({
  open,
  value = '',
  sourceContext,
  onSelect,
  onClose,
}: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const result = await mediaApi.list({ q: search, limit: 60 });
      setItems(result.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chưa tải được Kho Media.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    void load();
  }, [load, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  const upload = async (files: FileList | null) => {
    const selected = Array.from(files || []).slice(0, 12);
    if (!selected.length) return;
    setUploading(true);
    setError('');
    try {
      const result = await mediaApi.upload(selected, sourceContext);
      setItems((current) => [...result.items, ...current.filter((item) => !result.items.some((next) => next.id === item.id))]);
      if (result.items.length === 1) onSelect(result.items[0]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chưa tải được ảnh.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="media-picker-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl sm:rounded-lg">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="media-picker-title" className="flex items-center gap-2 text-lg font-black text-[#25202a]"><Images className="h-5 w-5 text-[#c40012]" />Chọn ảnh từ Kho Media</h2>
            <p className="mt-1 text-xs font-semibold text-[#747b88]">Chọn ảnh đã có hoặc tải ảnh mới. Ảnh mới tự động được lưu vào kho.</p>
          </div>
          <button type="button" onClick={onClose} title="Đóng" aria-label="Đóng Kho Media" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#667085] hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:px-5">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void load(query)} placeholder="Tìm theo tên ảnh hoặc mô tả" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#c40012]" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load(query)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-black text-[#514b54]"><Search className="h-4 w-4" />Tìm</button>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#c40012] px-3 text-xs font-black text-white">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Tải ảnh
              <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={(event) => void upload(event.target.files)} />
            </label>
          </div>
        </div>

        {error ? <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 sm:mx-5">{error}</div> : null}
        <div className="min-h-64 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#c40012]" /></div> : items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const selected = item.url === value;
                return (
                  <button key={item.id} type="button" onClick={() => onSelect(item)} className={`group min-w-0 overflow-hidden rounded-lg border bg-white text-left transition hover:border-[#c40012] hover:shadow-md ${selected ? 'border-[#c40012] ring-2 ring-red-100' : 'border-gray-200'}`}>
                    <span className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                      <img src={item.url} alt={item.altText || item.title || ''} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                      {selected ? <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#c40012] text-white"><Check className="h-4 w-4" /></span> : null}
                    </span>
                    <span className="block px-3 py-2">
                      <span className="block truncate text-xs font-black text-[#25202a]">{item.title || item.originalName || 'Ảnh chưa đặt tên'}</span>
                      <span className="mt-1 block text-[11px] font-semibold text-[#747b88]">{item.width && item.height ? `${item.width} × ${item.height}px` : 'Ảnh trong kho'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : <div className="grid min-h-64 place-items-center text-center"><div><Images className="mx-auto h-9 w-9 text-gray-300" /><p className="mt-3 text-sm font-black text-[#514b54]">Chưa có ảnh phù hợp</p><p className="mt-1 text-xs font-semibold text-[#747b88]">Tải ảnh mới để bắt đầu sử dụng.</p></div></div>}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
          <Link to="/quan-tri/kho-media" onClick={onClose} className="text-xs font-black text-[#c40012] hover:underline">Mở trang Kho Media</Link>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-black text-[#514b54]">Đóng</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
