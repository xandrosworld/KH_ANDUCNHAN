import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import type { FormEvent } from 'react';
import { Phone, Send, CheckCircle } from 'lucide-react';
import PageShell from '../components/PageShell';
import PhoneInput from '../components/PhoneInput';
import { SvpFacebookIcon, SvpZaloIcon } from '../components/SvpIcons';
import {
  SUPPORT_FACEBOOK_LABEL,
  SUPPORT_FACEBOOK_URL,
  SUPPORT_HOTLINE,
  SUPPORT_HOTLINE_LABEL,
  SUPPORT_ZALO_LABEL,
  SUPPORT_ZALO_URL,
} from '../config/support';
import { inquiryService } from '../services/inquiryService';
import { useLanguage } from '../contexts/LanguageContext';

export default function ContactPage() {
  const { t, lang } = useLanguage();
  usePageTitle(t('contact.title'));
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await inquiryService.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        property: 'General Inquiry',
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('contact.sendFailed');
      setSubmitError(msg);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAiSuggest = () => {
    const name = formData.name.trim() || (lang === 'vi' ? 'bạn' : 'there');
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    const emailPart = email
      ? (lang === 'vi' ? ` Bạn có thể liên hệ tôi qua email ${email}.` : ` You can reach me at ${email}.`)
      : '';
    const phonePart = phone
      ? (lang === 'vi' ? ` Số điện thoại của tôi là ${phone}.` : ` My phone number is ${phone}.`)
      : '';

    const suggestions = lang === 'vi' ? [
      `Xin chào,\n\nTôi là ${name}.${emailPart}${phonePart}\n\nTôi đang tìm kiếm bất động sản tại Mỹ và muốn được tư vấn thêm về các lựa chọn phù hợp với nhu cầu của tôi. Vui lòng liên hệ lại với tôi sớm nhất.\n\nCảm ơn.`,
      `Xin chào đội ngũ So Do Van Phuc,\n\nTôi là ${name}.${emailPart}${phonePart}\n\nTôi quan tâm đến việc mua/thuê bất động sản và muốn biết thêm chi tiết về các tin đăng hiện có. Mong nhận được phản hồi sớm.\n\nTrân trọng.`,
      `Chào bạn,\n\nTôi là ${name}.${emailPart}${phonePart}\n\nTôi cần hỗ trợ tìm kiếm bất động sản phù hợp với ngân sách và vị trí mong muốn. Vui lòng tư vấn giúp tôi.\n\nXin cảm ơn.`,
    ] : [
      `Hello,\n\nMy name is ${name}.${emailPart}${phonePart}\n\nI'm interested in exploring real estate opportunities in the U.S. and would love to learn more about available listings that match my preferences. Please get back to me at your earliest convenience.\n\nThank you.`,
      `Hi So Do Van Phuc team,\n\nThis is ${name}.${emailPart}${phonePart}\n\nI'm looking to buy/rent a property and would appreciate some guidance on current listings, pricing, and the process. Looking forward to hearing from you.\n\nBest regards.`,
      `Hello,\n\nI'm ${name}.${emailPart}${phonePart}\n\nI'd like assistance finding a property that fits my budget and preferred location. Could you please provide some recommendations and next steps?\n\nThank you for your time.`,
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setFormData((prev) => ({ ...prev, message: randomSuggestion }));
  };

  return (
    <PageShell maxWidth="max-w-[900px]">
      {/* Hero */}
      <section className="pt-2 pb-8 text-center min-w-0">
        <h1 className="hero-gold-text text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 break-words">
          {t('contact.title')}
        </h1>
        <p className="text-[#A7ABB6] text-base sm:text-lg max-w-[600px] mx-auto break-words">
          {t('contact.heroDesc')}
        </p>
      </section>

      {/* Direct contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 min-w-0">
        {/* Hotline */}
        <a
          href={`tel:${SUPPORT_HOTLINE}`}
          className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 flex items-center gap-4 hover:border-[#B88717]/40 transition-colors group min-w-0"
        >
          <div className="w-12 h-12 rounded-full bg-[#B88717]/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-[#B88717]" />
          </div>
          <div className="min-w-0">
            <p className="text-[#7D8291] text-[13px] font-medium mb-0.5">
              Hotline
            </p>
            <p className="text-[#F5F0E6] font-semibold text-lg group-hover:text-[#F6D37A] transition-colors break-words">
              {SUPPORT_HOTLINE_LABEL}
            </p>
          </div>
        </a>

        {/* Zalo */}
        <a
          href={SUPPORT_ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 flex items-center gap-4 hover:border-[#B88717]/40 transition-colors group min-w-0"
        >
          <div className="w-12 h-12 rounded-full bg-[#B88717]/10 flex items-center justify-center shrink-0">
            <SvpZaloIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[#7D8291] text-[13px] font-medium mb-0.5">
              Zalo
            </p>
            <p className="text-[#F5F0E6] font-semibold text-sm sm:text-base group-hover:text-[#F6D37A] transition-colors break-words">
              {SUPPORT_ZALO_LABEL}
            </p>
          </div>
        </a>

        {/* Facebook */}
        <a
          href={SUPPORT_FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 flex items-center gap-4 hover:border-[#B88717]/40 transition-colors group min-w-0"
        >
          <div className="w-12 h-12 rounded-full bg-[#B88717]/10 flex items-center justify-center shrink-0">
            <SvpFacebookIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[#7D8291] text-[13px] font-medium mb-0.5">
              Facebook
            </p>
            <p className="text-[#F5F0E6] font-semibold text-sm group-hover:text-[#F6D37A] transition-colors break-words">
              {SUPPORT_FACEBOOK_LABEL}
            </p>
          </div>
        </a>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10 min-w-0">
        <a
          href={`tel:${SUPPORT_HOTLINE}`}
          className="flex-1 flex items-center justify-center gap-2 bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold py-3.5 px-6 rounded-xl transition-colors text-center min-w-0"
        >
          <Phone className="w-4 h-4 flex-shrink-0" />
          {t('contact.callNow')}
        </a>
        <a
          href={SUPPORT_ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#15151D] border border-[#B88717]/40 hover:border-[#B88717] text-[#F6D37A] font-semibold py-3.5 px-6 rounded-xl transition-colors text-center min-w-0"
        >
          <SvpZaloIcon className="w-4 h-4 flex-shrink-0" />
          {lang === 'vi' ? 'Nhắn Zalo' : 'Message on Zalo'}
        </a>
        <a
          href={SUPPORT_FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#15151D] border border-[#B88717]/40 hover:border-[#B88717] text-[#F6D37A] font-semibold py-3.5 px-6 rounded-xl transition-colors text-center min-w-0"
        >
          <SvpFacebookIcon className="w-4 h-4 flex-shrink-0" />
          Facebook
        </a>
      </div>

      {/* Form card */}
      <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 sm:p-8 min-w-0">
        {submitted ? (
          /* Success state */
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-[#F6D37A] text-xl sm:text-2xl font-bold mb-3">
              {t('contact.inquirySubmitted')}
            </h2>
            <p className="text-[#A7ABB6] text-sm sm:text-base max-w-[480px] mx-auto leading-relaxed break-words">
              {t('contact.inquirySubmittedDesc')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', phone: '', message: '' });
              }}
              className="mt-8 text-[#B88717] hover:text-[#F6D37A] text-sm font-medium transition-colors"
            >
              {t('contact.sendAnother')}
            </button>
          </div>
        ) : (
          /* Form */
          <>
            <h2 className="text-[#F6D37A] text-xl sm:text-2xl font-bold mb-1">
              {t('contact.send')}
            </h2>
            <p className="text-[#7D8291] text-sm mb-6">
              {t('contact.form_sub')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-[#A7ABB6] text-[13px] font-medium mb-1.5"
                >
                  {t('contact.name')} <span className="text-[#B88717]">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('contact.namePlaceholder')}
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-[#A7ABB6] text-[13px] font-medium mb-1.5"
                >
                  {t('contact.email')} <span className="text-[#B88717]">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Phone (optional) with country code */}
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-[#A7ABB6] text-[13px] font-medium mb-1.5"
                >
                  {t('contact.phoneOptional')}
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
                  placeholder={t('contact.phonePlaceholder')}
                />
              </div>

              {/* Message with AI Suggest */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="contact-message"
                    className="block text-[#A7ABB6] text-[13px] font-medium"
                  >
                    {t('contact.message')} <span className="text-[#B88717]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#B88717]/20 to-purple-500/15 border border-[#B88717]/30 text-[11px] font-semibold text-[#F6D37A] hover:from-[#B88717]/30 hover:to-purple-500/25 hover:border-[#F6D37A]/50 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(246,211,122,0.15)]"
                  >
                    {t('contact.aiSuggest')}
                  </button>
                </div>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('contact.messagePlaceholder')}
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors resize-y min-h-[120px]"
                />
              </div>

              {/* Error */}
              {submitError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-red-400 text-[13px]">{submitError}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold py-3.5 px-6 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
                {t('contact.submitInquiry')}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Business hours note */}
      <div className="mt-6 bg-[#15151D]/60 rounded-xl border border-white/[0.06] px-5 py-4 text-center min-w-0">
        <p className="text-[#7D8291] text-[13px] leading-relaxed break-words">
          <span className="text-[#A7ABB6] font-medium">
            {t('contact.businessHours')}
          </span>{' '}
          {t('contact.businessHoursDesc')}
        </p>
      </div>
    </PageShell>
  );
}
