import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react';
import type { Currency } from '../types/types';

const DEFAULT_RATE = 25000;
const RATE = Number(import.meta.env.VITE_USD_VND_RATE) || DEFAULT_RATE;

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Format a numeric USD price. The public site is locked to USD. */
  formatPrice: (usdAmount: number) => string;
  /** Legacy rate kept only for compatibility. */
  rate: number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  formatPrice: (n) => `$${n.toLocaleString()}`,
  rate: RATE,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try { localStorage.setItem('gf_currency', 'USD'); } catch { /* ignore */ }
  }, []);

  const setCurrency = useCallback((_c: Currency) => {
    try { localStorage.setItem('gf_currency', 'USD'); } catch { /* ignore */ }
  }, []);

  const formatPrice = useCallback(
    (usdAmount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(usdAmount);
    },
    [],
  );

  return (
    <CurrencyContext.Provider value={{ currency: 'USD', setCurrency, formatPrice, rate: RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  return useContext(CurrencyContext);
}
