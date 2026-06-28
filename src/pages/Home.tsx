
import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SearchHero from '../components/SearchHero';
import HomesForYou from '../components/HomesForYou';
import LatestListings from '../components/LatestListings';
import PlatformStats from '../components/PlatformStats';
import MarketGuides from '../components/MarketGuides';
import CrystalField from '../components/CrystalField';
import RecommendationSection from '../components/RecommendationSection';
import MobileNav from '../components/MobileNav';
import ScrollToTopButton from '../components/ScrollToTopButton';
import Sidebar from '../components/Sidebar';
import logoImg from '../assets/logo-new.png';
import { useLanguage } from '../contexts/LanguageContext';

/* ─── Footer dropdown column ─── */
type FooterItem = {
  label: string;
  to?: string;
};

type FooterItemConfig = {
  label?: string;
  labelKey?: string;
  to?: string;
};

type FooterColumnConfig = {
  labelKey: string;
  items: FooterItemConfig[];
};

const DropdownCol = ({ label, items }: { label: string; items: FooterItem[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="footer-dropdown-col flex-1 min-w-[180px] border-r border-white/10 last:border-r-0 px-6 first:pl-0 last:pr-0">
      <button
        onClick={() => setOpen(!open)}
        className="footer-dropdown-trigger flex items-center gap-1 text-[15px] font-semibold text-[#F6D37A] hover:text-[#FFE8A3] transition-colors w-full py-2"
      >
        {label}
        <ChevronDown
          className={`w-4 h-4 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="mt-1 space-y-1 pb-2">
          {items.map((item) => (
            <li key={item.label}>
              {item.to ? (
                <Link to={item.to} className="footer-dropdown-link text-[13px] text-[#A7ABB6] hover:text-[#F6D37A] transition-colors block py-0.5">
                  {item.label}
                </Link>
              ) : (
                <span className="footer-dropdown-link text-[13px] text-[#6F7481] block py-0.5">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const footerCols: FooterColumnConfig[] = [
  {
    labelKey: 'footer.realEstate',
    items: [
      { labelKey: 'footer.homesForSale', to: '/buy' },
      { labelKey: 'footer.foreclosures', to: '/buy?q=foreclosures' },
      { labelKey: 'footer.newConstruction', to: '/buy?q=new%20construction' },
      { labelKey: 'footer.recentlySold', to: '/buy' },
      { labelKey: 'footer.allHomes', to: '/buy' },
    ],
  },
  {
    labelKey: 'footer.rentals',
    items: [
      { labelKey: 'footer.apartmentsRent', to: '/rent?q=apartment' },
      { labelKey: 'footer.housesRent', to: '/rent' },
      { labelKey: 'footer.allRentalListings', to: '/rent' },
      { labelKey: 'footer.allRentalBuildings', to: '/rent' },
    ],
  },
  {
    labelKey: 'footer.mortgageRates',
    items: [
      { labelKey: 'footer.todaysRates', to: '/mortgage' },
      { labelKey: 'footer.refinanceRates', to: '/mortgage' },
      { labelKey: 'footer.mortgageCalculator', to: '/mortgage' },
      { labelKey: 'footer.affordabilityCalculator', to: '/mortgage' },
    ],
  },
  {
    labelKey: 'footer.browseHomes',
    items: [
      { label: 'New York', to: '/buy?q=New%20York' },
      { label: 'Los Angeles', to: '/buy?q=Los%20Angeles' },
      { label: 'Chicago', to: '/buy?q=Chicago' },
      { label: 'Houston', to: '/buy?q=Houston' },
      { label: 'Phoenix', to: '/buy?q=Phoenix' },
      { labelKey: 'footer.allCities', to: '/buy' },
    ],
  },
];

const navRow1: FooterItemConfig[] = [
  { labelKey: 'footer.about', to: '/about' },
  { labelKey: 'footer.careers', to: '/about' },
  { labelKey: 'footer.help', to: '/contact' },
  { labelKey: 'footer.advertise', to: '/post-property' },
  { labelKey: 'footer.fairHousing', to: '/blog' },
  { labelKey: 'footer.advocacy', to: '/about' },
  { labelKey: 'footer.terms', to: '/contact' },
  { labelKey: 'footer.privacy', to: '/contact' },
  { labelKey: 'footer.adChoices', to: '/contact' },
];
const navRow2: FooterItemConfig[] = [
  { labelKey: 'footer.cookiePreference', to: '/contact' },
  { labelKey: 'footer.mobileApps' },
  { labelKey: 'footer.marketReports', to: '/blog' },
];
const navRow3: FooterItemConfig[] = [
  { label: 'So Do Van Phuc Group', to: '/about' },
  { label: 'So Do Van Phuc Premier', to: '/buy' },
  { label: 'So Do Van Phuc Rentals', to: '/rent' },
];

const FooterNavLink = ({ item }: { item: FooterItem }) => (
  item.to ? (
    <Link to={item.to} className="text-[13px] text-gray-500 hover:text-[#8A6410] transition-colors">
      {item.label}
    </Link>
  ) : (
    <span className="text-[13px] text-gray-600">
      {item.label}
    </span>
  )
);

/* ─── Footer ─── */
const Footer = () => {
  const { t } = useLanguage();
  const resolveFooterItem = (item: FooterItemConfig): FooterItem => ({
    label: item.labelKey ? t(item.labelKey) : item.label || '',
    to: item.to,
  });
  const translatedFooterCols = footerCols.map((col) => ({
    label: t(col.labelKey),
    items: col.items.map(resolveFooterItem),
  }));
  const translatedNavRow1 = navRow1.map(resolveFooterItem);
  const translatedNavRow2 = navRow2.map(resolveFooterItem);
  const translatedNavRow3 = navRow3.map(resolveFooterItem);

  return (
  <footer className="premium-footer w-full border-t pb-24 lg:pb-0">
    {/* About Recommendations */}
    <div className="premium-footer-about px-4">
      <div className="max-w-[860px] mx-auto text-center pt-10 pb-8">
        <h3 className="text-[17px] font-bold text-[#F6D37A] mb-3">{t('home.aboutRecommendations')}</h3>
        <p className="text-[13px] text-[#A7ABB6] leading-relaxed">
          {t('home.recommendationsDesc')}
        </p>
      </div>
    </div>

    {/* 4 Dropdown columns */}
    <div className="premium-footer-link-band border-t border-b border-white/10 py-2">
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="flex flex-wrap md:flex-nowrap">
          {translatedFooterCols.map((col) => (
            <DropdownCol key={col.label} label={col.label} items={col.items} />
          ))}
        </div>
      </div>
    </div>

    {/* Nav link rows */}
    <div className="premium-footer-nav-band border-b border-white/10 py-5 px-4">
      <div className="max-w-[1240px] mx-auto text-center space-y-2">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {translatedNavRow1.map((item) => (
            <FooterNavLink key={item.label} item={item} />
          ))}
        </nav>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {translatedNavRow2.map((item) => (
            <FooterNavLink key={item.label} item={item} />
          ))}
        </nav>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {translatedNavRow3.map((item) => (
            <FooterNavLink key={item.label} item={item} />
          ))}
        </nav>
        <div className="pt-1">
          <Link to="/contact" className="text-[13px] text-[#8A6410] hover:underline transition-colors">
            {t('footer.doNotSell')} →
          </Link>
        </div>
      </div>
    </div>

    {/* Legal text */}
    <div className="premium-footer-legal py-6 px-4">
      <div className="max-w-[760px] mx-auto text-center text-[11px] text-[#8F94A3] leading-relaxed space-y-2">
        <p>
          {t('footer.accessibility')}{' '}
          <a href="mailto:contact@sodovanphuc.vn" className="text-[#8A6410] hover:underline">{t('footer.letUsKnow')}</a>.
        </p>
        <p>
          <Link to="/about" className="text-[#8A6410] hover:underline">{t('footer.affiliatedDisclosure')}</Link>
        </p>
        <p>
          {t('footer.licenses')}
        </p>
        <p>
          2800 Michelson Drive, Suite 1201, Irvine, CA 92612 | {t('footer.equalHousing')} |{' '}
          <Link to="/contact" className="text-[#8A6410] hover:underline">{t('footer.licensingInfo')}</Link>
        </p>
        <p>
          <a href="tel:0912886794" className="text-[#8A6410] hover:underline">{t('footer.contactBrokerage')}</a>
        </p>
      </div>
    </div>

    {/* App Store badges */}
    <div className="premium-footer-badges flex justify-center gap-3 pb-6 px-4">
      <button
        type="button"
        disabled
        className="footer-store-badge flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2 opacity-65 cursor-not-allowed"
        title={t('footer.appStorePending')}
      >
        {/* Apple icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#D7DAE3]" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <div className="text-left">
          <div className="text-[9px] text-[#8F94A3] leading-none">{t('home.downloadApp')}</div>
          <div className="text-[13px] font-semibold text-[#F5F0E6] leading-tight">{t('home.appStore')}</div>
        </div>
      </button>
      <button
        type="button"
        disabled
        className="footer-store-badge flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2 opacity-65 cursor-not-allowed"
        title={t('footer.googlePlayPending')}
      >
        {/* Google Play icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.18 23.76c.3.16.63.24.97.24.4 0 .8-.11 1.15-.33l12.55-7.25-2.87-2.87L3.18 23.76z" fill="#EA4335"/>
          <path d="M21.37 9.33l-2.7-1.56-3.19 3.19 3.19 3.19 2.73-1.58c.78-.45.78-1.79-.03-2.24z" fill="#FBBC04"/>
          <path d="M2.21.49C2.08.7 2 .96 2 1.26v21.48c0 .3.08.56.21.77l.08.07 12.03-12.03v-.28L2.29.42l-.08.07z" fill="#4285F4"/>
          <path d="M15.31 8.3l-3.19-3.19-9.93-5.67 13.12 8.86z" fill="#34A853"/>
        </svg>
        <div className="text-left">
          <div className="text-[9px] text-[#8F94A3] leading-none">{t('home.getItOn')}</div>
          <div className="text-[13px] font-semibold text-[#F5F0E6] leading-tight">{t('home.googlePlay')}</div>
        </div>
      </button>
    </div>

    {/* Bottom bar: logo + social + copyright */}
    <div className="premium-footer-bottom border-t border-white/10 py-4 px-4">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo + social */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <img src={logoImg} alt="So Do Van Phuc" className="w-6 h-6 rounded object-cover" />
            <span className="font-bold text-[#B88717] text-[15px] tracking-tight">So Do Van Phuc</span>
          </div>
          <span className="text-[13px] text-[#A7ABB6]">{t('footer.followUs')}</span>
          {/* Facebook */}
          <button type="button" disabled aria-label="Facebook link pending" className="text-[#1877F2] opacity-65 cursor-not-allowed">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>
          </button>
          {/* Instagram */}
          <button type="button" disabled aria-label="Instagram link pending" className="opacity-65 cursor-not-allowed">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f09433"/>
                  <stop offset="25%" stopColor="#e6683c"/>
                  <stop offset="50%" stopColor="#dc2743"/>
                  <stop offset="75%" stopColor="#cc2366"/>
                  <stop offset="100%" stopColor="#bc1888"/>
                </linearGradient>
              </defs>
              <rect width="24" height="24" rx="6" fill="url(#ig)"/>
              <path d="M12 7.5A4.5 4.5 0 1 0 12 16.5 4.5 4.5 0 0 0 12 7.5zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="white"/>
              <circle cx="16.75" cy="7.25" r="1" fill="white"/>
            </svg>
          </button>
          {/* TikTok */}
          <button type="button" disabled aria-label="TikTok link pending" className="text-[#D7DAE3] opacity-65 cursor-not-allowed">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.52V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>
          </button>
        </div>
        {/* Copyright */}
        <div className="flex items-center gap-2 text-[12px] text-[#8F94A3]">
          <span>© 2006-2026 So Do Van Phuc</span>
          {/* Equal Housing icon */}
          <svg viewBox="0 0 40 40" className="w-6 h-6 fill-[#8F94A3]" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 5L2 18h4v17h28V18h4L20 5zm0 3.7l14 10.5V33H6V19.2L20 8.7zM14 21h12v2H14zm0 4h12v2H14z"/>
          </svg>
        </div>
      </div>
    </div>
  </footer>
  );
};

/* ─── Home page ─── */
const Home = () => {
  usePageTitle();
  return (
    <div className="min-h-screen bg-[#030405] flex font-sans">
      <Sidebar />
      <div className="flex-grow flex flex-col min-w-0 lg:pl-[72px]">
        <Header />
        <main className="flex-grow">
          <SearchHero />
          {/* ── Brand background zone ── */}
          {/* anhnen.jpg is visible on the sides; all content lives inside the white panel */}
          <div
            className="black-crystal-bg"
            style={{
              padding: '24px clamp(16px, 5vw, 80px)',
            }}
          >
            {/* ── White/cream content shell — truly centered via mx-auto ── */}
            <CrystalField />
            <div
              className="content-dark-shell relative z-[1] mx-auto rounded-[28px] overflow-hidden"
              style={{
                maxWidth: '1240px',
              }}
            >
              <HomesForYou />

              {/* Thin brand divider between sections */}
              <div className="mx-8 border-t border-white/10" />

              <LatestListings />

              {/* Thin brand divider between sections */}
              <div className="mx-8 border-t border-white/10" />

              <PlatformStats />

              {/* Thin brand divider between sections */}
              <div className="mx-8 border-t border-white/10" />

              <MarketGuides />

              <div className="mx-8 border-t border-white/10" />

              <RecommendationSection />
            </div>
          </div>
        </main>
        <Footer />
      </div>
      <MobileNav />
      <ScrollToTopButton />
    </div>
  );
};

export default Home;
