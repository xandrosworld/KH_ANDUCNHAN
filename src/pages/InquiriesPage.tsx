import { useState, useEffect, useCallback } from 'react';
import { Mail, Trash2, CheckCircle2, XCircle, Calendar, User, Phone, Home, MessageSquare } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import PageShell from '../components/PageShell';
import { inquiryService, type InquiryRecord } from '../services/inquiryService';
import { useLanguage } from '../contexts/LanguageContext';

type Inquiry = InquiryRecord;

const sortByNewest = (items: Inquiry[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const InquiriesPage = () => {
  const { t, lang } = useLanguage();
  usePageTitle(t('dash.inquiries'));
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const loadInquiries = useCallback(async () => {
    try {
      const data = await inquiryService.getAll();
      setInquiries(sortByNewest(data));
    } catch {
      setInquiries([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void loadInquiries(); });
  }, [loadInquiries]);

  const toggleStatus = async (id: string) => {
    try {
      const inquiry = inquiries.find((inq) => inq.id === id);
      if (!inquiry) return;
      await inquiryService.updateStatus(id, inquiry.status === 'new' ? 'read' : 'new');
      await loadInquiries();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!window.confirm(t('inquiries.confirmDelete'))) return;
    try {
      await inquiryService.remove(id);
      await loadInquiries();
    } catch (err) {
      console.error('Error deleting inquiry:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageShell raw>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#15151D] via-[#0a0a10] to-[#030405]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(184,135,23,0.15), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(82,64,180,0.1), transparent 50%)',
          }}
        />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto pt-12 sm:pt-16 pb-10 sm:pb-12 min-w-0">
          <h1
            className="hero-gold-text font-extrabold mb-2 leading-tight break-words"
            style={{ fontSize: 'clamp(26px, 5vw, 40px)' }}
          >
            {t('dash.inquiries')}
          </h1>
          <p className="text-[#A7ABB6] text-[14px] sm:text-[16px] leading-relaxed break-words">
            {t('inquiries.desc')}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0 pb-28 lg:pb-16 mt-8">
        {inquiries.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-white/[0.085] bg-[#15151D] mb-6">
              <table className="w-full border-collapse text-left text-sm text-[#D7DAE3]">
                <thead>
                  <tr className="border-b border-white/[0.085] bg-white/[0.02] text-[#A7ABB6] font-semibold">
                    <th className="px-6 py-4">{t('inquiries.received')}</th>
                    <th className="px-6 py-4">{t('inquiries.propertyType')}</th>
                    <th className="px-6 py-4">{t('inquiries.client')}</th>
                    <th className="px-6 py-4">{t('inquiries.message')}</th>
                    <th className="px-6 py-4 text-center">{t('inquiries.status')}</th>
                    <th className="px-6 py-4 text-right">{t('inquiries.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {inquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        inq.status === 'new' ? 'font-medium bg-[#B88717]/[0.02]' : 'opacity-85'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-[#7D8291] text-xs">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(inq.date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#F5F0E6] max-w-[200px] truncate">
                        <span className="flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5 text-[#B88717] flex-shrink-0" />
                          {inq.property}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[#F5F0E6] font-semibold">{inq.name}</span>
                          <span className="text-[#7D8291] text-xs">{inq.email}</span>
                          {inq.phone && <span className="text-[#7D8291] text-xs">{inq.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[300px]">
                        <p className="line-clamp-2 text-[#A7ABB6] text-xs leading-relaxed">
                          {inq.message}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            inq.status === 'new'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${inq.status === 'new' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          {inq.status === 'new' ? t('inquiries.new') : t('inquiries.read')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(inq.id)}
                            title={inq.status === 'new' ? t('inquiries.markRead') : t('inquiries.markNew')}
                            className="p-1.5 rounded-lg border border-white/[0.085] bg-white/[0.04] text-[#A7ABB6] hover:text-[#F6D37A] hover:border-[#B88717]/45 transition-colors cursor-pointer"
                          >
                            {inq.status === 'new' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteInquiry(inq.id)}
                            title={t('inquiries.delete')}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Stack View */}
            <div className="md:hidden space-y-4">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className={`rounded-xl border border-white/[0.085] p-5 space-y-3 transition-colors ${
                    inq.status === 'new' ? 'bg-[#1e1d18]/50 border-amber-500/20' : 'bg-[#15151D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#7D8291] flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(inq.date)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        inq.status === 'new'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {inq.status === 'new' ? t('inquiries.new') : t('inquiries.read')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[12px] font-semibold text-[#B88717] flex items-center gap-1">
                      <Home className="h-3.5 w-3.5 flex-shrink-0" />
                      {inq.property}
                    </div>
                    <div className="text-sm font-bold text-[#F5F0E6] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#7D8291] flex-shrink-0" />
                      {inq.name}
                    </div>
                    <div className="text-[12px] text-[#A7ABB6] flex items-center gap-1.5 pl-5">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {inq.email}
                    </div>
                    {inq.phone && (
                      <div className="text-[12px] text-[#A7ABB6] flex items-center gap-1.5 pl-5">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {inq.phone}
                      </div>
                    )}
                  </div>

                  <div className="pl-5 border-l-2 border-white/[0.085] py-1">
                    <p className="text-[12px] text-[#D7DAE3] whitespace-pre-wrap leading-relaxed">
                      {inq.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => toggleStatus(inq.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.085] bg-white/[0.04] text-[11px] font-semibold text-[#A7ABB6] hover:text-[#F6D37A] transition-colors cursor-pointer"
                    >
                      {inq.status === 'new' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{t('inquiries.markRead')}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{t('inquiries.markUnread')}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteInquiry(inq.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-[11px] font-semibold text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t('inquiries.delete')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-[#15151D] border border-white/[0.085] rounded-xl p-12 text-center max-w-[500px] mx-auto mt-6">
            <div className="w-16 h-16 rounded-full bg-[#B88717]/10 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="h-7 w-7 text-[#F6D37A]" />
            </div>
            <h2 className="text-[#F6D37A] text-[18px] font-bold mb-2">{t('inquiries.noFound')}</h2>
            <p className="text-[#A7ABB6] text-sm mb-6 leading-relaxed">
              {t('inquiries.empty')}
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InquiriesPage;
