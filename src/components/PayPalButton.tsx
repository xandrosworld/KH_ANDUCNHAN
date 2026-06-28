import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PayPalButtonProps {
  amount: number; // USD
  description: string;
  onSuccess: (orderId: string) => void;
  onError?: (err: unknown) => void;
  disabled?: boolean;
}

export default function PayPalButton({ amount, description, onSuccess, onError, disabled }: PayPalButtonProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stable refs for callbacks — never cause re-renders
  const cbRef = useRef({ onSuccess, onError, amount, description });
  cbRef.current = { onSuccess, onError, amount, description };

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

  // Load SDK once
  useEffect(() => {
    if (!clientId) { setError(t('paypal.clientMissing')); setLoading(false); return; }
    if ((window as any).paypal) { setSdkReady(true); setLoading(false); return; }

    const existing = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existing) {
      existing.addEventListener('load', () => { setSdkReady(true); setLoading(false); });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => { setSdkReady(true); setLoading(false); };
    script.onerror = () => { setError(t('paypal.loadFailed')); setLoading(false); };
    document.body.appendChild(script);
  }, [clientId, t]);

  // Ensure PayPal iframes receive touch events on mobile
  useEffect(() => {
    if (!containerRef.current) return;

    const fixIframesTouch = () => {
      const el = containerRef.current;
      if (!el) return;

      // Fix all iframes inside the PayPal container
      const iframes = el.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        iframe.style.pointerEvents = 'auto';
        iframe.style.touchAction = 'manipulation';
        iframe.style.position = 'relative';
        iframe.style.zIndex = '9999';
      });

      // Fix all divs that PayPal creates as button wrappers
      const wrappers = el.querySelectorAll('[class*="paypal"], [id*="paypal"], [data-uid]');
      wrappers.forEach((w) => {
        (w as HTMLElement).style.pointerEvents = 'auto';
        (w as HTMLElement).style.touchAction = 'manipulation';
        (w as HTMLElement).style.position = 'relative';
        (w as HTMLElement).style.zIndex = '100';
      });
    };

    // Run fix after PayPal renders (with delay for iframe load)
    const timer1 = setTimeout(fixIframesTouch, 500);
    const timer2 = setTimeout(fixIframesTouch, 1500);
    const timer3 = setTimeout(fixIframesTouch, 3000);

    // Also observe DOM changes in case PayPal adds iframes dynamically
    const observer = new MutationObserver(fixIframesTouch);
    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, [sdkReady, disabled]);

  // Single effect: render buttons. Only depends on sdkReady, amount, disabled.
  useEffect(() => {
    if (!sdkReady || !containerRef.current || disabled) return;
    const paypal = (window as any).paypal;
    if (!paypal?.Buttons) return;

    const el = containerRef.current;
    el.innerHTML = '';

    paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 45 },
      createOrder: (_data: any, actions: any) =>
        actions.order.create({
          purchase_units: [{
            amount: { value: cbRef.current.amount.toFixed(2), currency_code: 'USD' },
            description: cbRef.current.description,
          }],
          application_context: { brand_name: 'So Do Van Phuc', shipping_preference: 'NO_SHIPPING' },
        }),
      onApprove: async (_data: any, actions: any) => {
        try {
          const order = await actions.order.capture();
          cbRef.current.onSuccess(order.id);
        } catch (err) {
          cbRef.current.onError?.(err);
        }
      },
      onError: (err: unknown) => { cbRef.current.onError?.(err); },
    }).render(el).catch(() => { /* render failed */ });

    return () => { el.innerHTML = ''; };
  }, [sdkReady, amount, disabled]);

  if (!clientId) {
    return (
      <div className="text-center py-4">
        <p className="text-amber-400/80 text-[12px]">⚠ {t('paypal.notConfigured')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400 text-[12px]">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        zIndex: 9999,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        isolation: 'isolate', // creates new stacking context
      }}
    >
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-[#B88717] border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-[#7D8291] text-[12px]">{t('paypal.loading')}</span>
        </div>
      )}
      {disabled && (
        <div className="absolute inset-0 bg-[#0D0D14]/80 z-10 flex items-center justify-center rounded-lg">
          <p className="text-[#7D8291] text-[12px]">{t('paypal.selectPro')}</p>
        </div>
      )}
      {/* PayPal renders iframes here — ensure they receive touch events on mobile */}
      <div
        ref={containerRef}
        className={disabled ? 'opacity-30 pointer-events-none' : ''}
        style={!disabled ? {
          position: 'relative',
          zIndex: 9999,
          touchAction: 'manipulation',
          overflow: 'visible',
          WebkitOverflowScrolling: 'touch' as any,
          transform: 'translateZ(0)', // force GPU layer
        } : undefined}
      />
    </div>
  );
}
