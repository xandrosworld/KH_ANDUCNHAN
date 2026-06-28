import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ScrollToTopButton from './ScrollToTopButton';

interface PageShellProps {
  children: React.ReactNode;
  /** Max-width class for main content. Default: max-w-[1200px] */
  maxWidth?: string;
  /** If true, omit the standard content wrapper (for pages with custom layout like Home) */
  raw?: boolean;
  /** If true, hide the mobile bottom nav (for pages with their own sticky CTA) */
  hideMobileNav?: boolean;
  /** If true, hide the desktop/mobile header (for pages with custom compact header) */
  hideMobileHeader?: boolean;
}

/**
 * Standard page layout shell used by all pages with sidebar/header/mobile-nav.
 * Guarantees no horizontal overflow.
 */
const PageShell = ({
  children,
  maxWidth = 'max-w-[1200px]',
  raw = false,
  hideMobileNav = false,
  hideMobileHeader = false,
}: PageShellProps) => {
  return (
    <div className="svp-app-shell min-h-screen bg-[#030405] flex font-sans">
      <Sidebar />
      <div className="flex-grow flex flex-col min-w-0 w-full lg:pl-[72px]">
        {hideMobileHeader ? (
          /* On mobile: hide the header. On desktop: keep it */
          <div className="hidden lg:block">
            <Header />
          </div>
        ) : (
          <Header />
        )}
        <main className="flex-grow min-w-0 w-full">
          {raw ? (
            children
          ) : (
            <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 lg:pb-16 min-w-0`}>
              {children}
            </div>
          )}
        </main>
      </div>
      {!hideMobileNav && <MobileNav />}
      <ScrollToTopButton />
    </div>
  );
};

export default PageShell;
