import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

/**
 * AppLayout wraps all authenticated pages.
 * Mobile: Header + scrollable content + BottomNav
 * Desktop: Header + Sidebar left + content area right
 */
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header (always visible) */}
      <Header />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 w-full lg:pl-64 pb-20 lg:pb-6">
          <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
