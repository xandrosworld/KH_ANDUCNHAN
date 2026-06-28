import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  nameKey: string;
}

const COUNTRIES: Country[] = [
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', nameKey: 'phone.country.us' },
  { code: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam', nameKey: 'phone.country.vn' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', nameKey: 'phone.country.uk' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', nameKey: 'phone.country.au' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', nameKey: 'phone.country.ca' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', nameKey: 'phone.country.fr' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', nameKey: 'phone.country.de' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan', nameKey: 'phone.country.jp' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea', nameKey: 'phone.country.kr' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China', nameKey: 'phone.country.cn' },
  { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand', nameKey: 'phone.country.th' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', nameKey: 'phone.country.sg' },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia', nameKey: 'phone.country.my' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines', nameKey: 'phone.country.ph' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', nameKey: 'phone.country.in' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia', nameKey: 'phone.country.id' },
  { code: 'TW', dial: '+886', flag: '🇹🇼', name: 'Taiwan', nameKey: 'phone.country.tw' },
  { code: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong', nameKey: 'phone.country.hk' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE', nameKey: 'phone.country.ae' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia', nameKey: 'phone.country.ru' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil', nameKey: 'phone.country.br' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico', nameKey: 'phone.country.mx' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy', nameKey: 'phone.country.it' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain', nameKey: 'phone.country.es' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands', nameKey: 'phone.country.nl' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden', nameKey: 'phone.country.se' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland', nameKey: 'phone.country.ch' },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand', nameKey: 'phone.country.nz' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * International phone input with country flag selector.
 * Stores the full number including dial code in the parent's state.
 */
export default function PhoneInput({ value, onChange, className, placeholder }: PhoneInputProps) {
  const { t } = useLanguage();
  const countryName = (country: Country) => t(country.nameKey);

  // Parse initial value to detect country
  const detectCountry = (val: string): { country: Country; local: string } => {
    if (!val) return { country: COUNTRIES[0], local: '' };
    const cleaned = val.replace(/\s+/g, '');
    // Try to match dial code (longest first)
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      if (cleaned.startsWith(c.dial)) {
        return { country: c, local: cleaned.slice(c.dial.length) };
      }
    }
    return { country: COUNTRIES[0], local: val };
  };

  const initial = detectCountry(value);
  const [selected, setSelected] = useState<Country>(initial.country);
  const [localNumber, setLocalNumber] = useState(initial.local);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const handleCountrySelect = (country: Country) => {
    setSelected(country);
    setOpen(false);
    setSearch('');
    onChange(`${country.dial} ${localNumber}`);
  };

  const handleNumberChange = (num: string) => {
    // Only allow digits, spaces, dashes
    const cleaned = num.replace(/[^\d\s\-()]/g, '');
    setLocalNumber(cleaned);
    onChange(`${selected.dial} ${cleaned}`);
  };

  const filtered = search
    ? COUNTRIES.filter(c =>
        countryName(c).toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <div className="relative flex" ref={dropdownRef}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 rounded-l-xl border border-r-0 border-white/[0.085] bg-[#0c0c12] hover:bg-white/[0.06] transition-colors flex-shrink-0"
      >
        <span className="text-[18px] leading-none">{selected.flag}</span>
        <span className="text-[12px] text-[#7D8291]">{selected.dial}</span>
        <svg className={`w-3 h-3 text-[#7D8291] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Phone number input */}
      <input
        type="tel"
        className={className || "w-full bg-[#0c0c12] border border-white/[0.085] rounded-r-xl text-[#F5F0E6] placeholder-[#7D8291] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"}
        placeholder={placeholder || '305 555 8888'}
        value={localNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-[260px] bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-white/[0.085]">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('phone.searchCountry')}
              className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-lg text-[#F5F0E6] placeholder-[#7D8291] px-3 py-2 text-[12px] focus:border-[#B88717]/50 focus:outline-none"
            />
          </div>
          {/* Country list */}
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountrySelect(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors ${
                  c.code === selected.code ? 'bg-[#B88717]/10' : ''
                }`}
              >
                <span className="text-[18px] leading-none">{c.flag}</span>
                <span className="text-[13px] text-[#F5F0E6] flex-1">{countryName(c)}</span>
                <span className="text-[12px] text-[#7D8291]">{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-[12px] text-[#7D8291] text-center">{t('phone.noCountries')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
