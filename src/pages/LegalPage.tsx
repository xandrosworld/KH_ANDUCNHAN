import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LegalDocument from '../components/LegalDocument';
import { legalDocuments, type LegalDocumentType } from '../data/legalDocuments';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBranding } from '../contexts/BrandingContext';

interface LegalPageProps {
  type: LegalDocumentType;
}

export default function LegalPage({ type }: LegalPageProps) {
  const { logoUrl, bannerUrl, siteName } = useBranding();
  const document = legalDocuments[type];
  usePageTitle(`${document.title} | Sổ Đỏ Vạn Phúc`);

  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#25202a]">
      <div
        className="fixed inset-x-0 top-0 h-[260px] bg-cover bg-center opacity-45"
        style={{ backgroundImage: `url('${bannerUrl}')` }}
      />
      <div className="fixed inset-x-0 top-0 h-[300px] bg-gradient-to-b from-white/70 via-white/85 to-[#fff8f2]" />

      <div className="relative mx-auto w-full max-w-4xl px-3 py-4 sm:px-6 sm:py-7">
        <nav className="mb-4 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eadfd7] bg-white/90 px-4 text-sm font-bold text-[#4f5663] shadow-sm transition hover:border-[#c40012]/35 hover:text-[#c40012]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
          <img src={logoUrl} alt={siteName} className="h-11 w-11 rounded-full object-contain shadow-md" />
        </nav>

        <div className="rounded-[24px] bg-white/95 p-4 shadow-[0_18px_60px_rgba(88,40,20,0.12)] ring-1 ring-black/5 backdrop-blur sm:p-7">
          <LegalDocument document={document} />
        </div>
      </div>
    </main>
  );
}
