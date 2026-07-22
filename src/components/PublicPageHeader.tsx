import { ArrowLeft, CalendarDays, Info, Newspaper } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';

export default function PublicPageHeader() {
  const navigate = useNavigate();
  const { logoUrl, siteName } = useBranding();
  return (
    <header className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => navigate(-1)} aria-label="Quay lại" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-100 text-[#c40012] hover:bg-red-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src={logoUrl} alt={siteName} className="h-10 w-10 shrink-0 rounded-full object-contain" />
          <span className="hidden truncate text-sm font-black text-[#251f25] sm:block sm:text-base">{siteName}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Trang công khai">
          <NavLink to="/gioi-thieu" label="Giới thiệu" icon={Info} />
          <NavLink to="/tin-tuc" label="Tin tức" icon={Newspaper} />
          <NavLink to="/su-kien" label="Sự kiện" icon={CalendarDays} />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Info }) {
  return (
    <Link to={to} title={label} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-extrabold text-[#554d56] hover:bg-red-50 hover:text-[#c40012] sm:px-3">
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
