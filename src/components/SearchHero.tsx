import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Search, PenLine } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import CrystalField from './CrystalField';
import heroBanner from '../assets/anhnen.jpg';
import { useLanguage } from '../contexts/LanguageContext';

const searchSuggestions = [
  'Miami, FL',
  'luxury homes',
  'New York, NY',
  'global investors',
];

const SearchHero = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [visibleSuggestion, setVisibleSuggestion] = useState('');
  const { lang } = useLanguage();

  useEffect(() => {
    const suggestion = searchSuggestions[suggestionIndex];

    if (visibleSuggestion.length < suggestion.length) {
      const typingId = window.setTimeout(() => {
        setVisibleSuggestion(suggestion.slice(0, visibleSuggestion.length + 1));
      }, 72);

      return () => window.clearTimeout(typingId);
    }

    const holdId = window.setTimeout(() => {
      setVisibleSuggestion('');
      setSuggestionIndex((currentIndex) => (currentIndex + 1) % searchSuggestions.length);
    }, 1400);

    return () => window.clearTimeout(holdId);
  }, [suggestionIndex, visibleSuggestion]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sanitized = query.replace(/[^a-zA-Z0-9\s,.-]/g, '').trim();
    navigate(sanitized ? `/buy?q=${encodeURIComponent(sanitized)}` : '/buy');
  };

  return (
    <div className="relative h-[360px] w-full overflow-hidden sm:h-[420px] lg:h-[clamp(430px,38vw,520px)]">
      {/* Background image — bright suburban home */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroBanner})`,
        }}
      />
      {/* Gradient overlay — left-to-right, darkens only left side where text is */}
      <div className="absolute inset-0 bg-black/58" />
      <div className="hero-crystal-layer">
        <CrystalField />
      </div>

      {/* Content — left-aligned, vertically centered */}
      <div className="relative z-10 flex h-full items-start justify-center px-5 pt-[96px] text-center sm:pt-[112px] lg:items-center lg:px-8 lg:pt-0 lg:text-left">
        <div className="flex w-full max-w-[1280px] flex-col items-center lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center lg:items-start">
        <h1
          className="hero-gold-text mb-5 w-full max-w-[350px] py-1 font-extrabold leading-[1.2] drop-shadow-md sm:max-w-[560px] sm:leading-[1.16]"
          style={{ fontSize: 'clamp(32px, 8.5vw, 54px)' }}
        >
          {lang === 'vi' ? (
            <>Diễn đàn toàn cầu <br /><span>hàng đầu thế giới</span></>
          ) : (
            <>The world's leading <br /><span>global forum</span></>
          )}
        </h1>

        {/* Search box */}
        <form
          onSubmit={handleSearch}
          className="relative flex h-14 w-full max-w-full items-center overflow-hidden rounded-full bg-white shadow-lg sm:w-[600px] sm:max-w-[600px] lg:h-[60px]"
        >
          {!query && (
            <div
              className="pointer-events-none absolute left-5 right-14 top-1/2 z-0 flex -translate-y-1/2 items-center overflow-hidden text-[14px] text-gray-400 sm:text-[15px]"
              aria-hidden="true"
            >
              <span className="mr-1 flex-shrink-0">{lang === 'vi' ? 'Thử' : 'Try'}</span>
              <span className="search-suggestion-viewport">
                <span key={suggestionIndex} className="search-suggestion-item">
                  {visibleSuggestion}
                </span>
              </span>
            </div>
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search location"
            className="relative z-10 min-w-0 flex-1 h-full bg-transparent pl-5 pr-2 text-[14px] text-gray-900 focus:outline-none sm:text-[15px]"
          />
          <button
            type="submit"
            className="relative z-10 flex items-center justify-center h-10 w-10 mr-2 flex-shrink-0 text-gray-500 hover:text-[#B88717] transition-colors rounded-full"
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </form>

        {/* Post Free Listing — mobile only */}
        <Link
          to="/post-property"
          className="mt-3 inline-flex items-center gap-1.5 lg:hidden group"
        >
          <PenLine className="h-3.5 w-3.5 text-[#F6D37A] group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-semibold tracking-wide bg-gradient-to-r from-[#F6D37A] via-[#FFE8A3] to-[#F6D37A] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(246,211,122,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(246,211,122,0.5)] transition-all">
            Post Free Listing ✦
          </span>
        </Link>

        </div>{/* end inner text column */}

        {/* QR Code — desktop only */}
        <div className="hidden lg:flex items-center justify-center flex-shrink-0 ml-8">
          <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-3 shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_20px_rgba(246,211,122,0.15)] border border-[#F6D37A]/20">
            <img
              src="/assets/extended-qr.svg"
              alt="QR Code"
              className="h-[160px] w-[160px] object-contain"
            />
          </div>
        </div>

        </div>{/* end flex row */}
      </div>
    </div>
  );
};

export default SearchHero;
