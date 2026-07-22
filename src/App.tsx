import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AppLayout from './components/AppLayout';

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-white">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D32F2F] border-t-transparent" />
  </div>
);

const HomePage = lazy(() => import('./pages/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'));
const PendingApprovalPage = lazy(() => import('./pages/PendingApprovalPage'));
const SelectRolePage = lazy(() => import('./pages/SelectRolePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const PublicAboutPage = lazy(() => import('./pages/PublicAboutPage'));
const PublicNewsPage = lazy(() => import('./pages/PublicNewsPage'));
const PublicEventsPage = lazy(() => import('./pages/PublicEventsPage'));
const PublicEventDetailPage = lazy(() => import('./pages/PublicEventDetailPage'));
const EventRegistrationPage = lazy(() => import('./pages/EventRegistrationPage'));
const PublicRecruitmentPage = lazy(() => import('./pages/PublicRecruitmentPage'));
const PublicRecruitmentDetailPage = lazy(() => import('./pages/PublicRecruitmentDetailPage'));

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SystemBuilderPage = lazy(() => import('./pages/SystemBuilderPage'));
const AiAssistantPage = lazy(() => import('./pages/AiAssistantPage'));

const OwnerDashboard = lazy(() => import('./pages/owner/DashboardPage'));
const OwnerSubmitProperty = lazy(() => import('./pages/owner/SubmitPropertyPage'));
const OwnerMyProperties = lazy(() => import('./pages/owner/MyPropertiesPage'));

const BuyerDashboard = lazy(() => import('./pages/buyer/DashboardPage'));
const BuyerSearch = lazy(() => import('./pages/buyer/SearchPage'));
const BuyerFavorites = lazy(() => import('./pages/buyer/FavoritesPage'));

const StudentDashboard = lazy(() => import('./pages/student/DashboardPage'));

const ExpertDashboard = lazy(() => import('./pages/expert/DashboardPage'));
const ExpertAddProperty = lazy(() => import('./pages/expert/AddPropertyPage'));
const ExpertMyProperties = lazy(() => import('./pages/expert/MyPropertiesPage'));
const ExpertPropertyDetail = lazy(() => import('./pages/expert/PropertyDetailPage'));

const SpecialistDashboard = lazy(() => import('./pages/specialist/DashboardPage'));
const SpecialistCustomers = lazy(() => import('./pages/specialist/CustomersPage'));
const SpecialistAddCustomer = lazy(() => import('./pages/specialist/AddCustomerPage'));
const SpecialistSearchProperty = lazy(() => import('./pages/specialist/SearchPropertyPage'));
const SpecialistSchedule = lazy(() => import('./pages/specialist/SchedulePage'));

const CollabDashboard = lazy(() => import('./pages/collab/DashboardPage'));
const CollabWork = lazy(() => import('./pages/collab/WorkPage'));

const ReferrerDashboard = lazy(() => import('./pages/referrer/DashboardPage'));
const ReferrerCode = lazy(() => import('./pages/referrer/CodePage'));

const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminUsers = lazy(() => import('./pages/admin/UsersPage'));
const AdminRoleApprovals = lazy(() => import('./pages/admin/RoleApprovalsPage'));
const AdminProperties = lazy(() => import('./pages/admin/PropertiesPage'));
const AdminCustomers = lazy(() => import('./pages/admin/CustomersPage'));
const AdminSchedules = lazy(() => import('./pages/admin/SchedulesPage'));
const AdminReferrals = lazy(() => import('./pages/admin/ReferralsPage'));
const AdminConfig = lazy(() => import('./pages/admin/ConfigPage'));
const AdminAudit = lazy(() => import('./pages/admin/AuditPage'));
const AdminEvents = lazy(() => import('./pages/admin/EventsPage'));
const AdminRecruitment = lazy(() => import('./pages/admin/RecruitmentPage'));

const MANAGEMENT_ROLES = ['admin_tong', 'admin', 'giam_doc', 'truong_phong', 'pho_phong', 'giam_doc_khoi', 'pho_giam_doc_khoi', 'pho_giam_doc_khu_vuc', 'giam_doc_dieu_hanh', 'pho_giam_doc_dieu_hanh', 'tro_ly', 'thu_ky'] as const;
const EVENT_ADMIN_ROLES = ['admin_tong', 'admin'] as const;

const routePrefetchers = [
  () => import('./pages/RegisterPage'),
  () => import('./pages/ForgotPasswordPage'),
  () => import('./pages/PublicAboutPage'),
  () => import('./pages/PublicNewsPage'),
  () => import('./pages/PublicEventsPage'),
  () => import('./pages/PublicRecruitmentPage'),
  () => import('./pages/SelectRolePage'),
  () => import('./pages/ProfilePage'),
  () => import('./pages/NotificationsPage'),
  () => import('./pages/expert/DashboardPage'),
  () => import('./pages/expert/AddPropertyPage'),
  () => import('./pages/expert/MyPropertiesPage'),
  () => import('./pages/admin/DashboardPage'),
  () => import('./pages/admin/UsersPage'),
  () => import('./pages/admin/PropertiesPage'),
  () => import('./pages/admin/ConfigPage'),
];

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      routePrefetchers.forEach((load) => {
        load().catch(() => undefined);
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Suspense key={location.pathname} fallback={<LoadingScreen />}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/cho-duyet" element={<PendingApprovalPage />} />
        <Route path="/select-role" element={<SelectRolePage />} />
        <Route path="/chon-vai-tro" element={<SelectRolePage />} />
        <Route path="/dieu-khoan-su-dung" element={<LegalPage type="terms" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/chinh-sach-bao-mat" element={<LegalPage type="privacy" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/gioi-thieu" element={<PublicAboutPage />} />
        <Route path="/gioi-thieu-cong-ty" element={<PublicAboutPage />} />
        <Route path="/tin-tuc" element={<PublicNewsPage />} />
        <Route path="/su-kien" element={<PublicEventsPage />} />
        <Route path="/su-kien/:slug" element={<PublicEventDetailPage />} />
        <Route path="/dang-ky-su-kien/:slug" element={<EventRegistrationPage />} />
        <Route path="/tuyen-dung" element={<PublicRecruitmentPage />} />
        <Route path="/tuyen-dung/:slug" element={<PublicRecruitmentDetailPage />} />
        <Route path="/nha/:id" element={<PropertyDetailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/xay-dung-he-thong" element={<SystemBuilderPage />} />
            <Route path="/he-thong" element={<SystemBuilderPage />} />
            <Route path="/ai" element={<AiAssistantPage />} />
            <Route path="/tro-ly-ai" element={<AiAssistantPage />} />

            <Route element={<RoleRoute roles={['chu_nha']} />}>
              <Route path="/chu-nha" element={<OwnerDashboard />} />
              <Route path="/chu-nha/gui-ban" element={<OwnerSubmitProperty />} />
              <Route path="/chu-nha/nha-cua-toi" element={<OwnerMyProperties />} />
            </Route>

            <Route element={<RoleRoute roles={['khach_mua']} />}>
              <Route path="/khach-mua" element={<BuyerDashboard />} />
              <Route path="/khach-mua/tim-nha" element={<BuyerSearch />} />
              <Route path="/khach-mua/yeu-thich" element={<BuyerFavorites />} />
            </Route>

            <Route element={<RoleRoute roles={['hoc_vien']} />}>
              <Route path="/hoc-vien" element={<StudentDashboard />} />
              <Route path="/hoc-vien/viec-can-lam" element={<StudentDashboard />} />
              <Route path="/hoc-vien/dao-tao" element={<StudentDashboard />} />
            </Route>

            <Route element={<RoleRoute roles={['chuyen_gia']} />}>
              <Route path="/chuyen-gia" element={<ExpertDashboard />} />
              <Route path="/chuyen-gia/dang-nha" element={<ExpertAddProperty />} />
              <Route path="/chuyen-gia/kho-nha" element={<Navigate to="/chuyen-gia/kho-nha-rieng" replace />} />
              <Route path="/chuyen-gia/kho-nha-tong" element={<ExpertMyProperties scope="all" />} />
              <Route path="/chuyen-gia/kho-nha-rieng" element={<ExpertMyProperties scope="mine" />} />
              <Route path="/chuyen-gia/nha/:id" element={<ExpertPropertyDetail />} />
            </Route>

            <Route element={<RoleRoute roles={['chuyen_vien']} />}>
              <Route path="/chuyen-vien" element={<SpecialistDashboard />} />
              <Route path="/chuyen-vien/khach-hang" element={<SpecialistCustomers />} />
              <Route path="/chuyen-vien/them-khach" element={<SpecialistAddCustomer />} />
              <Route path="/chuyen-vien/tim-nha" element={<SpecialistSearchProperty />} />
              <Route path="/chuyen-vien/lich-xem" element={<SpecialistSchedule />} />
            </Route>

            <Route element={<RoleRoute roles={['ctv_khach', 'ctv_nguon']} />}>
              <Route path="/ctv" element={<CollabDashboard />} />
              <Route path="/ctv/cong-viec" element={<CollabWork />} />
            </Route>

            <Route element={<RoleRoute roles={['nguoi_gioi_thieu', 'doi_tac']} />}>
              <Route path="/nguoi-gioi-thieu" element={<ReferrerDashboard />} />
              <Route path="/nguoi-gioi-thieu/ma-gioi-thieu" element={<ReferrerCode />} />
              <Route path="/ma-gioi-thieu" element={<ReferrerCode />} />
            </Route>

            <Route element={<RoleRoute roles={MANAGEMENT_ROLES} />}>
              <Route path="/quan-tri" element={<AdminDashboard />} />
              <Route path="/quan-tri/nguoi-dung" element={<AdminUsers />} />
              <Route path="/quan-tri/duyet-vai-tro" element={<AdminRoleApprovals />} />
              <Route path="/quan-tri/nha" element={<AdminProperties />} />
              <Route path="/quan-tri/khach-hang" element={<AdminCustomers />} />
              <Route path="/quan-tri/lich-xem" element={<AdminSchedules />} />
              <Route path="/quan-tri/gioi-thieu" element={<AdminReferrals />} />
              <Route path="/quan-tri/cau-hinh" element={<AdminConfig />} />
              <Route path="/quan-tri/nhat-ky" element={<AdminAudit />} />
              <Route element={<RoleRoute roles={EVENT_ADMIN_ROLES} />}>
                <Route path="/quan-tri/su-kien" element={<AdminEvents />} />
                <Route path="/quan-tri/tuyen-dung" element={<AdminRecruitment />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function RouteTransitionOverlay() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const currentUrlKey = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const clearHideTimer = () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      hideTimerRef.current = null;
      frameRef.current = null;
    };

    const shouldShowForUrl = (target?: string | URL | null) => {
      if (!target) return true;
      try {
        const next = new URL(String(target), window.location.href);
        if (next.origin !== window.location.origin) return false;
        return `${next.pathname}${next.search}${next.hash}` !== currentUrlKey();
      } catch {
        return true;
      }
    };

    const show = (target?: string | URL | null) => {
      if (!shouldShowForUrl(target)) return;
      clearHideTimer();
      flushSync(() => setVisible(true));
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function patchedPushState(...args) {
      show(args[2] as string | URL | null | undefined);
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function patchedReplaceState(...args) {
      show(args[2] as string | URL | null | undefined);
      return originalReplaceState.apply(this, args);
    };

    const onPopState = () => show();
    window.addEventListener('popstate', onPopState, true);

    return () => {
      clearHideTimer();
      window.removeEventListener('popstate', onPopState, true);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);

    frameRef.current = window.requestAnimationFrame(() => {
      hideTimerRef.current = window.setTimeout(() => setVisible(false), 180);
    });

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      frameRef.current = null;
      hideTimerRef.current = null;
    };
  }, [location.pathname, location.search, location.hash, visible]);

  return (
    <div
      data-testid="route-transition-overlay"
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[9999] bg-[#fff8f2] transition-opacity ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDuration: visible ? '0ms' : '120ms' }}
    >
      <div className="absolute left-0 top-0 h-1 w-full overflow-hidden bg-red-50">
        <div className="h-full w-1/2 animate-[svp-route-progress_0.7s_ease-in-out_infinite] rounded-r-full bg-[#c40012]" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BrandingProvider>
        <AuthProvider>
          <AppRoutes />
          <RouteTransitionOverlay />
        </AuthProvider>
      </BrandingProvider>
    </BrowserRouter>
  );
}
