import { X } from 'lucide-react';
import LegalDocument from './LegalDocument';
import { legalDocuments, type LegalDocumentType } from '../data/legalDocuments';

interface LegalModalProps {
  type: LegalDocumentType | null;
  onClose: () => void;
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  const document = legalDocuments[type];

  return (
    <div data-testid={`legal-modal-${type}`} className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0 sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label={document.title}>
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[26px] bg-[#fffaf7] shadow-2xl sm:max-w-3xl sm:rounded-[26px]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#eadfd7] bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#c40012]">Sổ Đỏ Vạn Phúc</p>
            <h2 className="truncate text-lg font-black text-[#25202a]">{document.title}</h2>
          </div>
          <button
            type="button"
            data-testid="legal-modal-close"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadfd7] bg-white text-[#6b7280] transition hover:border-[#c40012]/40 hover:text-[#c40012]"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-66px)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <LegalDocument document={document} compact />
          <div className="sticky bottom-0 -mx-4 mt-4 border-t border-[#eadfd7] bg-[#fffaf7]/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#d10016] to-[#b50013] text-sm font-black text-white shadow-[0_10px_24px_rgba(190,0,16,0.18)]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
