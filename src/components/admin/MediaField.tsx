import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Images, Loader2, X } from 'lucide-react';
import { mediaApi } from '../../services/mediaApi';
import MediaPickerModal from './MediaPickerModal';

interface MediaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sourceContext: string;
  help?: string;
  disabled?: boolean;
  className?: string;
  previewMode?: 'banner' | 'logo' | 'content';
}

export default function MediaField({
  label,
  value,
  onChange,
  sourceContext,
  help,
  disabled = false,
  className = '',
  previewMode = 'banner',
}: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setPreviewFailed(false), [value]);

  const upload = async (file?: File) => {
    if (!file || disabled) return;
    setUploading(true);
    setError('');
    try {
      const result = await mediaApi.upload([file], sourceContext);
      const item = result.items[0];
      if (item) onChange(item.url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chưa tải được ảnh.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const previewClass = previewMode === 'logo'
    ? 'h-24 w-24 rounded-full object-contain'
    : previewMode === 'content'
      ? 'aspect-[16/9] w-full rounded-lg object-cover sm:max-w-sm'
      : 'aspect-[16/7] w-full rounded-lg object-cover';

  return (
    <div className={`min-w-0 ${className}`} data-testid={`media-field-${sourceContext}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="block text-xs font-black uppercase text-[#716a73]">{label}</span>
        {value && !disabled ? <button type="button" onClick={() => onChange('')} title="Bỏ ảnh đang chọn" className="inline-flex items-center gap-1 text-[11px] font-black text-[#c40012]"><X className="h-3.5 w-3.5" />Bỏ ảnh</button> : null}
      </div>
      {value && !previewFailed ? <img src={value} alt="" onError={() => setPreviewFailed(true)} className={`${previewClass} mb-2 border border-gray-200 bg-gray-50`} /> : null}
      <input value={value} onChange={(event) => onChange(event.target.value)} readOnly={disabled} placeholder="Đường dẫn ảnh" className="h-11 w-full min-w-0 rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012] disabled:bg-gray-50" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={disabled} onClick={() => setPickerOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 text-xs font-black text-[#c40012] disabled:cursor-not-allowed disabled:opacity-50"><Images className="h-4 w-4" />Chọn từ kho</button>
        <label className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#c40012] px-3 text-xs font-black text-white ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Tải ảnh mới
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || uploading} className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
        </label>
      </div>
      {help ? <p className="mt-1.5 text-xs font-semibold leading-5 text-[#77717a]">{help}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-bold text-red-700">{error}</p> : null}
      <MediaPickerModal open={pickerOpen} value={value} sourceContext={sourceContext} onClose={() => setPickerOpen(false)} onSelect={(item) => { onChange(item.url); setPickerOpen(false); }} />
    </div>
  );
}
