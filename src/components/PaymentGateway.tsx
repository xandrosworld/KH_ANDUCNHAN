import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Check, Copy } from 'lucide-react';
import { apiFetch } from '../services/apiClient';
import PayPalButton from './PayPalButton';

type Gateway = 'bank' | 'paypal' | 'stripe' | 'alipay' | 'wechat' | 'unionpay';

interface GatewayOption {
  id: Gateway;
  name: string;
  color: string;
  available: boolean;
  comingSoon?: boolean;
}

interface PaymentGatewayProps {
  amount: number;
  description: string;
  onSuccess: (orderId: string) => void;
  onError?: (err: unknown) => void;
  disabled?: boolean;
  mode?: 'payment' | 'verification';
  purpose?: 'deposit' | 'pro_listing' | 'verification' | 'other';
  propertyId?: number;
  senderName?: string;
  senderEmail?: string;
}

const gateways: GatewayOption[] = [
  { id: 'bank', name: 'Bank Transfer', color: 'from-[#B88717] to-[#F6D37A]', available: true },
  { id: 'paypal', name: 'PayPal', color: 'from-[#003087] to-[#009CDE]', available: true },
];

/* ── US Bank Info ── */
const BANK_INFO = {
  bankName: 'Bank Of America',
  bankFullName: 'Bank Of America',
  accountName: 'Michael Meza',
  accountNumber: '32507492296',
  routingNumber: '121000358',
};

/* ── SVG Logos ── */

const LogoBank = ({ className = 'h-[22px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 70 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 2L4 10v2h62v-2L35 2z" fill="#B88717"/>
    <rect x="8" y="13" width="4" height="7" rx="0.5" fill="#F6D37A"/>
    <rect x="18" y="13" width="4" height="7" rx="0.5" fill="#F6D37A"/>
    <rect x="28" y="13" width="4" height="7" rx="0.5" fill="#F6D37A"/>
    <rect x="38" y="13" width="4" height="7" rx="0.5" fill="#F6D37A"/>
    <rect x="48" y="13" width="4" height="7" rx="0.5" fill="#F6D37A"/>
    <rect x="58" y="13" width="4" height="7" rx="0.5" fill="#F6D37A"/>
    <rect x="4" y="20" width="62" height="2" rx="0.5" fill="#B88717"/>
  </svg>
);

const LogoPayPal = ({ className = 'h-[22px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 101 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.2 3.3H5.7c-.4 0-.8.3-.8.7L2.5 19.4c0 .3.2.5.5.5h3.1c.4 0 .8-.3.8-.7l.7-4.3c0-.4.4-.7.8-.7h1.9c3.9 0 6.1-1.9 6.7-5.6.3-1.6 0-2.9-.7-3.8-.9-1-2.4-1.5-4.1-1.5zm.7 5.5c-.3 2.1-1.9 2.1-3.5 2.1H8.7l.6-4c0-.2.2-.4.5-.4h.3c1.1 0 2.1 0 2.6.6.3.4.4.9.2 1.7z" fill="#003087"/>
    <path d="M35.4 8.7h-3.1c-.2 0-.5.2-.5.4l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.5.5.5h2.8c.4 0 .8-.3.8-.7l1.7-10.7c0-.3-.2-.5-.5-.5zm-4.5 6.1c-.3 1.8-1.7 3-3.5 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.7-3.1 3.5-3.1.9 0 1.6.3 2.1.8.4.6.6 1.3.5 2.2z" fill="#003087"/>
    <path d="M55.1 8.7h-3.1c-.3 0-.5.1-.7.3l-3.8 5.7-1.6-5.4c-.1-.4-.5-.6-.8-.6h-3.1c-.3 0-.5.3-.4.6l3.1 9-2.9 4.1c-.2.3 0 .7.4.7h3.1c.3 0 .5-.1.7-.3l9.2-13.4c.2-.3 0-.7-.4-.7z" fill="#003087"/>
    <path d="M67.2 3.3h-6.5c-.4 0-.8.3-.8.7L57.5 19.4c0 .3.2.5.5.5h3.3c.3 0 .5-.2.6-.5l.7-4.5c0-.4.4-.7.8-.7h1.9c3.9 0 6.1-1.9 6.7-5.6.3-1.6 0-2.9-.7-3.8-.9-1-2.4-1.5-4.1-1.5zm.7 5.5c-.3 2.1-1.9 2.1-3.5 2.1h-.9l.6-4c0-.2.2-.4.5-.4h.4c1.1 0 2.1 0 2.6.6.3.4.3.9.3 1.7z" fill="#009CDE"/>
    <path d="M90.4 8.7h-3.1c-.2 0-.5.2-.5.4l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.5.5.5h2.8c.4 0 .8-.3.8-.7l1.7-10.7c0-.3-.2-.5-.5-.5zm-4.5 6.1c-.3 1.8-1.7 3-3.5 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.7-3.1 3.5-3.1.9 0 1.6.3 2.1.8.5.6.6 1.3.5 2.2z" fill="#009CDE"/>
    <path d="M92.9 3.7l-2.5 15.9c0 .3.2.5.5.5h2.7c.4 0 .8-.3.8-.7L96.9 4.1c0-.3-.2-.5-.5-.5h-3c-.2 0-.4.1-.5.1z" fill="#009CDE"/>
  </svg>
);

const LogoStripe = ({ className = 'h-[22px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 10.1c0-.7.6-1 1.5-1 1.4 0 3.1.4 4.5 1.1V6.3c-1.5-.6-3-.8-4.5-.8C3.2 5.5.5 7.5.5 10.4c0 4.5 6.3 3.8 6.3 5.7 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.4v3.9c1.7.7 3.3 1 4.9 1 3.4 0 5.7-1.7 5.7-4.6 0-4.9-6.3-4-6.3-5.8zM16.4 8.3l-.3-1.7h-3.7v13h4.2V12c1-1.3 2.7-1.1 3.2-.9V7c-.5-.2-2.5-.5-3.4 1.3zM24 3.8l-4.1.9v3.5l4.1-.9V3.8zM19.9 6.6h4.1v13h-4.1v-13zM34 6.6l-2.6 11.2L28.8 6.6h-4.4l4.3 13h3.8L37 6.7l-3-.1zM41.3 5.5c-3.6 0-5.8 2.7-5.8 6.8 0 4.5 2.6 6.5 6.3 6.5 1.8 0 3.2-.4 4.3-1.1v-3.3c-1 .5-2.1.8-3.6.8-1.4 0-2.7-.5-2.8-2.2h7.2c0-.2 0-.9.1-1.3 0-4-1.9-6.2-5.7-6.2zm-1.7 5.5c0-1.6 1-2.3 1.9-2.3s1.8.7 1.8 2.3h-3.7z" fill="#635BFF"/>
  </svg>
);

const LogoAlipay = ({ className = 'h-[22px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.4 2C4.1 2 .6 5.5.6 9.8v4.4C.6 18.5 4.1 22 8.4 22h4.4c4.3 0 7.8-3.5 7.8-7.8V9.8C20.6 5.5 17.1 2 12.8 2H8.4z" fill="#1677FF"/>
    <path d="M14.8 14.2c-1.4-.5-2.9-1.2-4.2-1.9 1.2-1.5 2.1-3.3 2.5-5.3H9.8v-1.4h4.4V4.8H9.8V3.6H8.3v1.2H3.9v.8h4.4v1.4H4.4v.8h7.1c-.4 1.5-1.1 2.8-2 4-.8-.6-1.5-1.2-2-1.9l-.8.6c.6.7 1.3 1.4 2.2 2-1.2 1.1-2.8 2-4.7 2.6l.3.9c2-.6 3.7-1.5 5-2.7 1.3.8 2.9 1.4 4.5 2l.8-.1z" fill="white"/>
    <text x="22" y="16" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="#1677FF">Alipay</text>
  </svg>
);

const LogoWeChat = ({ className = 'h-[22px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 110 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.5 2 2 5.8 2 10.5c0 2.8 1.5 5.3 3.9 6.9l-1 3.1 3.6-1.8c1.1.3 2.3.5 3.5.5 5.5 0 10-3.8 10-8.5S17.5 2 12 2z" fill="#07C160"/>
    <circle cx="8.5" cy="9.5" r="1.2" fill="white"/>
    <circle cx="15" cy="9.5" r="1.2" fill="white"/>
    <text x="24" y="16" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="#07C160">WeChat Pay</text>
  </svg>
);

const LogoUnionPay = ({ className = 'h-[22px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 90 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="2" width="8" height="20" rx="2" fill="#E21836"/>
    <rect x="6" y="2" width="8" height="20" rx="2" fill="#00447C"/>
    <rect x="12" y="2" width="8" height="20" rx="2" fill="#007B84"/>
    <text x="23" y="11" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="7" fill="#E21836">UNION</text>
    <text x="23" y="19" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="7" fill="#00447C">PAY</text>
    <text x="48" y="16" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="9" letterSpacing="0.5" fill="#888">银联</text>
  </svg>
);

const logoMap: Record<Gateway, React.FC<{ className?: string }>> = {
  bank: LogoBank,
  paypal: LogoPayPal,
  stripe: LogoStripe,
  alipay: LogoAlipay,
  wechat: LogoWeChat,
  unionpay: LogoUnionPay,
};

/* ── Copy helper ── */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors group">
      <div className="min-w-0">
        <p className="text-[9px] text-[#7D8291] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-[13px] text-[#F5F0E6] font-semibold truncate select-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/[0.08] transition-colors"
        title="Copy"
      >
        {copied
          ? <Check className="w-3.5 h-3.5 text-emerald-400" />
          : <Copy className="w-3.5 h-3.5 text-[#7D8291] group-hover:text-[#F6D37A]" />
        }
      </button>
    </div>
  );
}

export default function PaymentGateway({
  amount,
  description,
  onSuccess,
  onError,
  disabled,
  mode: _mode = 'payment',
  purpose = 'other',
  propertyId,
  senderName = '',
  senderEmail = '',
}: PaymentGatewayProps) {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState<Gateway>('bank');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedGw = gateways.find((g) => g.id === selected)!;

  // Generate a short reference code for the transfer
  const refCode = useMemo(() => {
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `GF-${ts}${rand}`;
  }, []);

  const [bankError, setBankError] = useState('');

  const handleBankConfirm = async () => {
    setSaving(true);
    setBankError('');
    try {
      const res = await apiFetch('/api/bank-transfers', {
        method: 'POST',
        body: JSON.stringify({
          ref_code: refCode,
          amount,
          currency: 'USD',
          description,
          purpose,
          sender_name: senderName,
          sender_email: senderEmail,
          property_id: propertyId ?? null,
        }),
      });
      if (res.ok) {
        setConfirmed(true);
        onSuccess(`BANK-${refCode}`);
      } else {
        setBankError(res.error || (lang === 'vi' ? 'Lưu giao dịch thất bại. Vui lòng thử lại.' : 'Failed to save transaction. Please try again.'));
        onError?.(res.error);
      }
    } catch (err) {
      console.error('Failed to save bank transfer:', err);
      setBankError(lang === 'vi' ? 'Lỗi kết nối. Vui lòng thử lại.' : 'Connection error. Please try again.');
      onError?.(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Gateway selector - grid */}
      <div className="grid grid-cols-2 gap-2">
        {gateways.map((gw) => {
          const Logo = logoMap[gw.id];
          const isSelected = selected === gw.id;
          return (
            <button
              key={gw.id}
              type="button"
              onClick={() => setSelected(gw.id)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl
                border-2 transition-all duration-200 min-h-[54px]
                ${isSelected
                  ? 'border-[#B88717] bg-gradient-to-b from-[#B88717]/15 to-[#B88717]/5 shadow-[0_0_16px_rgba(184,135,23,0.2)]'
                  : 'border-white/[0.06] bg-[#15151D]/80 hover:border-white/[0.12] hover:bg-[#1a1a24]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`flex items-center justify-center h-[20px] transition-all ${isSelected ? 'opacity-100 scale-105' : 'opacity-50 grayscale'}`}>
                <Logo className="h-[16px] sm:h-[20px]" />
              </div>

              {gw.comingSoon && (
                <span className={`text-[6px] uppercase tracking-widest font-bold leading-none ${isSelected ? 'text-[#F6D37A]' : 'text-[#7D8291]/60'}`}>
                  {lang === 'vi' ? 'Sắp có' : 'Soon'}
                </span>
              )}

              {gw.id === 'bank' && (
                <span className={`text-[6px] uppercase tracking-widest font-bold leading-none ${isSelected ? 'text-[#F6D37A]' : 'text-[#7D8291]/60'}`}>
                  SWIFT
                </span>
              )}

              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#B88717] flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 12 12" className="w-2 h-2" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Payment content area */}
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        selectedGw.available
          ? 'border-white/[0.085]'
          : 'border-white/[0.06]'
      }`}>
        {selected === 'bank' ? (
          /* ── Bank Transfer / SWIFT ── */
          <div className="bg-gradient-to-b from-[#15151D] to-[#0D0D14] p-4">
            {confirmed ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-emerald-400 text-[14px] font-semibold">
                  {lang === 'vi' ? 'Đã xác nhận chuyển khoản!' : 'Transfer confirmed!'}
                </p>
                <p className="text-[#7D8291] text-[11px] text-center">
                  {lang === 'vi'
                    ? `Mã giao dịch: ${refCode}. Chúng tôi sẽ xác minh trong 1-3 ngày làm việc.`
                    : `Reference: ${refCode}. We will verify within 1-3 business days.`
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Amount badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-[#7D8291] uppercase tracking-wider font-medium">
                    {lang === 'vi' ? 'Chuyển khoản ngân hàng (Mỹ)' : 'US Domestic Bank Transfer'}
                  </span>
                  <span className="text-[14px] font-bold text-[#F6D37A]">${amount} USD</span>
                </div>

                {/* Bank details */}
                <div className="space-y-1.5 mb-3">
                  <CopyField
                    label={lang === 'vi' ? 'Ngân hàng' : 'Bank'}
                    value={`${BANK_INFO.bankName} — ${BANK_INFO.bankFullName}`}
                  />
                  <CopyField
                    label="Routing Number"
                    value={BANK_INFO.routingNumber}
                  />
                  <CopyField
                    label={lang === 'vi' ? 'Số tài khoản' : 'Account Number'}
                    value={BANK_INFO.accountNumber}
                  />
                  <CopyField
                    label={lang === 'vi' ? 'Chủ tài khoản' : 'Account Holder'}
                    value={BANK_INFO.accountName}
                  />
                  <CopyField
                    label={lang === 'vi' ? 'Nội dung chuyển khoản' : 'Transfer Reference'}
                    value={refCode}
                  />
                </div>

                {/* Important note */}
                <div className="rounded-lg bg-[#B88717]/10 border border-[#B88717]/20 px-3 py-2 mb-3">
                  <p className="text-[11px] text-[#F6D37A] leading-relaxed">
                    ⚠️ {lang === 'vi'
                      ? `Vui lòng ghi mã "${refCode}" vào nội dung chuyển khoản để xác minh nhanh hơn.`
                      : `Please include "${refCode}" in your transfer reference for faster verification.`
                    }
                  </p>
                </div>

                {/* Error message */}
                {bankError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 mb-3">
                    <p className="text-[11px] text-red-400 leading-relaxed">❌ {bankError}</p>
                  </div>
                )}

                {/* Confirm button */}
                <button
                  type="button"
                  onClick={handleBankConfirm}
                  disabled={disabled || saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B88717] to-[#D4A020] hover:from-[#D4A020] hover:to-[#E8B830] text-[#030405] font-bold text-[13px] transition-all shadow-[0_4px_16px_rgba(184,135,23,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {saving
                    ? (lang === 'vi' ? '⏳ Đang xử lý...' : '⏳ Processing...')
                    : (lang === 'vi' ? '✓ Tôi đã chuyển khoản' : '✓ I have completed the transfer')
                  }
                </button>
              </>
            )}
          </div>
        ) : selected === 'paypal' ? (
          /* ── PayPal ── */
          <div className="p-0.5">
            <PayPalButton
              amount={amount}
              description={description}
              onSuccess={onSuccess}
              onError={onError ?? ((err) => console.error('Payment error:', err))}
              disabled={disabled}
            />
          </div>
        ) : (
          /* ── Coming soon ── */
          <div className="px-4 py-6 text-center bg-gradient-to-b from-[#15151D] to-[#0D0D14]">
            <div className="mb-3">
              {(() => { const L = logoMap[selected]; return <L className="h-[28px] mx-auto" />; })()}
            </div>
            <p className="text-[#A7ABB6] text-[13px] leading-relaxed mb-1">
              {lang === 'vi'
                ? `${selectedGw.name} sẽ sớm được hỗ trợ.`
                : `${selectedGw.name} support coming soon.`
              }
            </p>
            <p className="text-[#7D8291] text-[11px] mb-3">
              {lang === 'vi'
                ? 'Vui lòng sử dụng chuyển khoản ngân hàng hoặc PayPal.'
                : 'Please use bank transfer or PayPal for now.'
              }
            </p>
            <button
              type="button"
              onClick={() => setSelected('bank')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#B88717] to-[#D4A020] text-[#030405] text-[12px] font-bold transition-all shadow-lg"
            >
              🏦 {lang === 'vi' ? 'Chuyển khoản' : 'Bank Transfer'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2.5 pt-0.5 opacity-50">
        <svg viewBox="0 0 14 14" className="w-3 h-3 text-[#7D8291]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="12" height="9" rx="1.5" />
          <path d="M1 6h12" />
        </svg>
        <span className="text-[9px] text-[#7D8291] uppercase tracking-wider font-medium">
          {lang === 'vi' ? 'Thanh toán an toàn' : 'Secure payment'}
        </span>
        <div className="flex items-center gap-1">
          {['SWIFT', 'VISA', 'MC'].map((card) => (
            <span key={card} className="text-[7px] text-[#7D8291]/80 border border-white/[0.06] rounded-sm px-1 py-[1px] font-bold tracking-wide">
              {card}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
