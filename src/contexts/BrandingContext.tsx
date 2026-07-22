import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { svpApi } from '../services/svpApi';

export interface SiteBranding {
  logoUrl: string;
  bannerUrl: string;
  siteName: string;
  sloganLine1: string;
  sloganLine2: string;
  footerText: string;
}

const defaults: SiteBranding = {
  logoUrl: '/logo11.png',
  bannerUrl: '/assets/svp-auth-hero.png',
  siteName: 'Sổ Đỏ Vạn Phúc',
  sloganLine1: 'Hệ điều hành nghề Môi giới',
  sloganLine2: 'Thổ cư Việt Nam',
  footerText: 'Sổ Đỏ Vạn Phúc - hệ thống quản lý nguồn nhà và khách hàng',
};

type BrandingContextValue = SiteBranding & { refreshBranding: () => Promise<void> };
const BrandingContext = createContext<BrandingContextValue>({ ...defaults, refreshBranding: async () => undefined });

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState(defaults);

  const refreshBranding = useCallback(async () => {
    try {
      const groups = await svpApi.getConfig();
      const options = groups.find((group) => group.id === 'site_display')?.options || [];
      const value = (id: string, fallback: string) => options.find((option) => option.id === id)?.value || fallback;
      setBranding({
        logoUrl: value('site_logo_url', defaults.logoUrl),
        bannerUrl: value('site_banner_url', defaults.bannerUrl),
        siteName: value('site_name', defaults.siteName),
        sloganLine1: value('site_slogan_line_1', defaults.sloganLine1),
        sloganLine2: value('site_slogan_line_2', defaults.sloganLine2),
        footerText: value('site_footer_text', defaults.footerText),
      });
    } catch {
      setBranding(defaults);
    }
  }, []);

  useEffect(() => { void refreshBranding(); }, [refreshBranding]);
  const value = useMemo(() => ({ ...branding, refreshBranding }), [branding, refreshBranding]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
