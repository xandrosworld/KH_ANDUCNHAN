import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
const PendingApprovalPage = lazy(() => import('./pages/PendingApprovalPage'));
const SelectRolePage = lazy(() => import('./pages/SelectRolePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const PublicAboutPage = lazy(() => import('./pages/PublicAboutPage'));
const PublicNewsPage = lazy(() => import('./pages/PublicNewsPage'));

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SystemBuilderPage = lazy(() => import('./pages/SystemBuilderPage'));

const OwnerDashboard = lazy(() => import('./pages/owner/DashboardPage'));
const OwnerSubmitProperty = lazy(() => import('./pages/owner/SubmitPropertyPage'));
const OwnerMyProperties = lazy(() => import('./pages/owner/MyPropertiesPage'));

const BuyerDashboard = lazy(() => import('./pages/buyer/DashboardPage'));
const BuyerSearch = lazy(() => import('./pages/buyer/SearchPage'));
const BuyerFavorites = lazy(() => import('./pages/buyer/FavoritesPage'));

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
const AdminConfig = lazy(() => import('./pages/admin/ConfigPage'));
const AdminAudit = lazy(() => import('./pages/admin/AuditPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sign-in" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
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
            <Route path="/nha/:id" element={<PropertyDetailPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/xay-dung-he-thong" element={<SystemBuilderPage />} />
                <Route path="/he-thong" element={<SystemBuilderPage />} />

                <Route path="/chu-nha" element={<OwnerDashboard />} />
                <Route path="/chu-nha/gui-ban" element={<OwnerSubmitProperty />} />
                <Route path="/chu-nha/nha-cua-toi" element={<OwnerMyProperties />} />

                <Route path="/khach-mua" element={<BuyerDashboard />} />
                <Route path="/khach-mua/tim-nha" element={<BuyerSearch />} />
                <Route path="/khach-mua/yeu-thich" element={<BuyerFavorites />} />

                <Route path="/chuyen-gia" element={<ExpertDashboard />} />
                <Route path="/chuyen-gia/dang-nha" element={<ExpertAddProperty />} />
                <Route path="/chuyen-gia/kho-nha" element={<ExpertMyProperties />} />
                <Route path="/chuyen-gia/nha/:id" element={<ExpertPropertyDetail />} />

                <Route path="/chuyen-vien" element={<SpecialistDashboard />} />
                <Route path="/chuyen-vien/khach-hang" element={<SpecialistCustomers />} />
                <Route path="/chuyen-vien/them-khach" element={<SpecialistAddCustomer />} />
                <Route path="/chuyen-vien/tim-nha" element={<SpecialistSearchProperty />} />
                <Route path="/chuyen-vien/lich-xem" element={<SpecialistSchedule />} />

                <Route path="/ctv" element={<CollabDashboard />} />
                <Route path="/ctv/cong-viec" element={<CollabWork />} />

                <Route path="/nguoi-gioi-thieu" element={<ReferrerDashboard />} />
                <Route path="/nguoi-gioi-thieu/ma-gioi-thieu" element={<ReferrerCode />} />
                <Route path="/ma-gioi-thieu" element={<ReferrerCode />} />

                <Route path="/quan-tri" element={<AdminDashboard />} />
                <Route path="/quan-tri/nguoi-dung" element={<AdminUsers />} />
                <Route path="/quan-tri/duyet-vai-tro" element={<AdminRoleApprovals />} />
                <Route path="/quan-tri/nha" element={<AdminProperties />} />
                <Route path="/quan-tri/khach-hang" element={<AdminCustomers />} />
                <Route path="/quan-tri/cau-hinh" element={<AdminConfig />} />
                <Route path="/quan-tri/nhat-ky" element={<AdminAudit />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
