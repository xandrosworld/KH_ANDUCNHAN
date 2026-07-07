import { Mail, ArrowRight } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useLanguage } from '../contexts/LanguageContext';

interface InfoPageProps {
  heading?: string;
  description?: string;
  headingKey?: string;
  descriptionKey?: string;
  features?: { title?: string; desc?: string; titleKey?: string; descKey?: string }[];
}

const InfoPage = ({ heading, description, headingKey, descriptionKey, features }: InfoPageProps) => {
  const { t } = useLanguage();
  const headingText = headingKey ? t(headingKey) : heading ?? '';
  const descriptionText = descriptionKey ? t(descriptionKey) : description ?? '';

  return (
    <PageShell raw>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#15151D] via-[#0a0a10] to-[#030405]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(184,135,23,0.15), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(82,64,180,0.1), transparent 50%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16 min-w-0">
          <h1
            className="hero-gold-text font-extrabold mb-4 leading-tight break-words"
            style={{ fontSize: 'clamp(30px, 6vw, 46px)' }}
          >
            {headingText}
          </h1>
          <p className="text-[#A7ABB6] text-[15px] sm:text-[17px] leading-relaxed max-w-full sm:max-w-[640px] mb-8 break-words">
            {descriptionText}
          </p>
          <a
            href="mailto:info@hocvienvanphuc.edu.vn"
            className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[13px] sm:text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]"
          >
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span>{t('info.contact')}</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Features Section */}
      {features && features.length > 0 && (
        <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-28 lg:pb-16 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, idx) => {
              const title = feat.titleKey ? t(feat.titleKey) : feat.title ?? '';
              const desc = feat.descKey ? t(feat.descKey) : feat.desc ?? '';
              return (
              <div
                key={idx}
                className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 hover:border-[#B88717]/30 transition-colors group min-w-0"
              >
                <div className="w-10 h-10 rounded-lg bg-[#B88717]/10 flex items-center justify-center mb-4 group-hover:bg-[#B88717]/20 transition-colors">
                  <span className="text-[#F6D37A] text-[18px] font-bold">{idx + 1}</span>
                </div>
                <h3 className="text-[#F6D37A] font-semibold text-[16px] mb-2 break-words">{title}</h3>
                <p className="text-[#7D8291] text-[13px] leading-relaxed break-words">{desc}</p>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default InfoPage;
