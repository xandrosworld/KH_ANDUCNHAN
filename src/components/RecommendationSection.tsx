
import { Link } from 'react-router-dom';
import illusBuy from '../assets/illus_buy_home.png';
import illusRent from '../assets/illus_rent_home.png';
import illusSell from '../assets/illus_sell_home.png';
import { useLanguage } from '../contexts/LanguageContext';

const serviceCards = [
  {
    titleKey: 'recommend.buyTitle',
    descriptionKey: 'recommend.buyDesc',
    ctaKey: 'recommend.buyCta',
    href: '/buy',
    img: illusBuy,
  },
  {
    titleKey: 'recommend.rentTitle',
    descriptionKey: 'recommend.rentDesc',
    ctaKey: 'recommend.rentCta',
    href: '/rent',
    img: illusRent,
  },
  {
    titleKey: 'recommend.sellTitle',
    descriptionKey: 'recommend.sellDesc',
    ctaKey: 'recommend.sellCta',
    href: '/sell',
    img: illusSell,
  },
];

const RecommendationSection = () => {
  const { t } = useLanguage();
  const isLoggedIn = (() => {
    try {
      const raw = localStorage.getItem('gf_user');
      return raw ? !!JSON.parse(raw).token : false;
    } catch { return false; }
  })();

  return (
    <>
      {/* Get home recommendations */}
      <section className="w-full py-12 px-4 md:px-8">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* Left text */}
          <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
            <h2 className="text-[26px] md:text-[28px] font-bold text-[#F6D37A] mb-3 leading-snug">
              {isLoggedIn ? t('recommend.titleLoggedIn') : t('recommend.title')}
            </h2>
            <p className="text-[15px] text-[#A7ABB6] mb-6 leading-relaxed">
              {isLoggedIn ? t('recommend.subtitleLoggedIn') : t('recommend.subtitle')}
            </p>
            {isLoggedIn ? (
              <Link
                to="/buy"
                className="px-6 py-2.5 rounded-full border border-[#B88717] bg-[#B88717]/10 text-[#F6D37A] font-semibold text-[14px] hover:bg-[#B88717]/20 transition-colors"
              >
                {t('recommend.browseCta')}
              </Link>
            ) : (
              <Link
                to="/sign-in"
                className="px-6 py-2.5 rounded-full border border-[#B88717] bg-[#B88717]/10 text-[#F6D37A] font-semibold text-[14px] hover:bg-[#B88717]/20 transition-colors"
              >
                {t('auth.signIn')}
              </Link>
            )}
          </div>

          {/* Right: stacked card illustration */}
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <div className="relative w-[300px] h-[220px]">
              {/* Back card */}
              <div className="absolute top-0 right-0 w-[240px] bg-[#15151D] rounded-2xl shadow-[0_22px_52px_rgba(0,0,0,0.42)] p-3 rotate-2 border border-white/[0.085]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center text-[#F6D37A] text-xs font-bold flex-shrink-0">G</div>
                  <div>
                    <div className="text-[11px] font-bold text-[#F6D37A]">{t('recommend.cardTitle')}</div>
                    <div className="text-[10px] text-[#A7ABB6]">{t('recommend.byBudget')}</div>
                  </div>
                </div>
                <div className="w-full h-[80px] rounded-lg bg-white/10 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=70" alt="Home" className="w-full h-full object-cover" />
                </div>
              </div>
              {/* Front card */}
              <div className="absolute top-8 left-0 w-[240px] bg-[#15151D] rounded-2xl shadow-[0_26px_64px_rgba(0,0,0,0.5)] p-3 border border-white/[0.085]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">📍</div>
                  <div>
                    <div className="text-[11px] font-bold text-[#F6D37A]">{t('recommend.cardTitle')}</div>
                    <div className="text-[10px] text-[#A7ABB6]">{t('recommend.byLocation')}</div>
                  </div>
                </div>
                <div className="w-full h-[70px] rounded-lg bg-white/10 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=70" alt="Home" className="w-full h-full object-cover" />
                </div>
                <div className="mt-2">
                  <div className="text-[14px] font-bold text-[#F6D37A]">$695,000</div>
                  <div className="text-[10px] text-[#8F94A3]">
                    4 {t('prop.bedShort')} · 3 {t('prop.ba')} · 3,102 {t('prop.sqft')} · {t('prop.houseForSale')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards — Buy / Rent / Sell */}
      <section className="w-full py-12 px-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {serviceCards.map((card) => (
              <div
                key={card.titleKey}
                className="bg-[#15151D] rounded-2xl border border-white/[0.085] p-8 flex flex-col items-center text-center shadow-[0_22px_52px_rgba(0,0,0,0.38)] hover:border-[#B88717]/45 transition-colors"
              >
                {/* Illustration image — rounded circle bg like Zillow */}
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden mb-5 bg-[#2A2415] flex items-center justify-center">
                  <img
                    src={card.img}
                    alt={t(card.titleKey)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-[20px] font-bold text-[#F6D37A] mb-2">{t(card.titleKey)}</h3>
                <p className="text-[13px] text-[#A7ABB6] leading-relaxed mb-6 flex-grow">{t(card.descriptionKey)}</p>
                <Link
                  to={card.href}
                  className="px-6 py-2 rounded-full border border-[#B88717] bg-[#B88717]/10 text-[#F6D37A] font-semibold text-[13px] hover:bg-[#B88717]/20 transition-colors"
                >
                  {t(card.ctaKey)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default RecommendationSection;
