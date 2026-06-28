import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollableHeight = scrollHeight - clientHeight;
      const remainingDistance = scrollableHeight - scrollTop;
      const scrollProgress = scrollableHeight > 0 ? scrollTop / scrollableHeight : 0;

      setIsVisible(scrollTop > 400 && (scrollProgress > 0.72 || remainingDistance < 900));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Back to top"
      title={t('scroll.backToTop')}
      tabIndex={isVisible ? 0 : -1}
      onClick={scrollToTop}
      className={`fixed right-4 bottom-[85px] z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-[#F6D37A]/45 bg-[#08090B]/95 text-[#F6D37A] shadow-[0_16px_34px_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-200 hover:border-[#FFE8A3] hover:bg-[#111214] hover:text-[#FFE8A3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6D37A] lg:right-6 lg:bottom-6 ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
    </button>
  );
};

export default ScrollToTopButton;
