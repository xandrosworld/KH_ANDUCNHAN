import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

const LoadingScreen = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D32F2F] border-t-transparent" />
  </div>
);

// Public pages
const HomePage = lazy(() => import('./pages/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const PendingApprovalPage = lazy(() => import('./pages/PendingApprovalPage'));
const SelectRolePage = lazy(() => import('./pages/SelectRolePage'));

// Common protected
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// Chủ nhà
const OwnerDashboard = lazy(() => import('./pages/owner/DashboardPage'));
const OwnerSubmitProperty = lazy(() => import('./pages/owner/SubmitPropertyPage'));
const OwnerMyProperties = lazy(() => import('./pages/owner/MyPropertiesPage'));

// Khách mua
const BuyerDashboard = lazy(() => import('./pages/buyer/DashboardPage'));
const BuyerSearch = lazy(() => import('./pages/buyer/SearchPage'));
const BuyerFavorites = lazy(() => import('./pages/buyer/FavoritesPage'));

// Chuyên gia
const ExpertDashboard = lazy(() => import('./pages/expert/DashboardPage'));
const ExpertAddProperty = lazy(() => import('./pages/expert/AddPropertyPage'));
const ExpertMyProperties = lazy(() => import('./pages/expert/MyPropertiesPage'));
const ExpertPropertyDetail = lazy(() => import('./pages/expert/PropertyDetailPage'));

// Chuyên viên
const SpecialistDashboard = lazy(() => import('./pages/specialist/DashboardPage'));
const SpecialistCustomers = lazy(() => import('./pages/specialist/CustomersPage'));
const SpecialistAddCustomer = lazy(() => import('./pages/specialist/AddCustomerPage'));
const SpecialistSearchProperty = lazy(() => import('./pages/specialist/SearchPropertyPage'));
const SpecialistSchedule = lazy(() => import('./pages/specialist/SchedulePage'));

// CTV
const CollabDashboard = lazy(() => import('./pages/collab/DashboardPage'));
const CollabWork = lazy(() => import('./pages/collab/WorkPage'));

// Người giới thiệu
const ReferrerDashboard = lazy(() => import('./pages/referrer/DashboardPage'));
const ReferrerCode = lazy(() => import('./pages/referrer/CodePage'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminUsers = lazy(() => import('./pages/admin/UsersPage'));
const AdminRoleApprovals = lazy(() => import('./pages/admin/RoleApprovalsPage'));
const AdminProperties = lazy(() => import('./pages/admin/PropertiesPage'));
const AdminCustomers = lazy(() => import('./pages/admin/CustomersPage'));
const AdminConfig = lazy(() => import('./pages/admin/ConfigPage'));
const AdminAudit = lazy(() => import('./pages/admin/AuditPage'));

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public */}
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
            <Route path="/nha/:id" element={<PropertyDetailPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Chủ nhà */}
                <Route path="/chu-nha" element={<OwnerDashboard />} />
                <Route path="/chu-nha/gui-ban" element={<OwnerSubmitProperty />} />
                <Route path="/chu-nha/nha-cua-toi" element={<OwnerMyProperties />} />

                {/* Khách mua */}
                <Route path="/khach-mua" element={<BuyerDashboard />} />
                <Route path="/khach-mua/tim-nha" element={<BuyerSearch />} />
                <Route path="/khach-mua/yeu-thich" element={<BuyerFavorites />} />

                {/* Chuyên gia */}
                <Route path="/chuyen-gia" element={<ExpertDashboard />} />
                <Route path="/chuyen-gia/dang-nha" element={<ExpertAddProperty />} />
                <Route path="/chuyen-gia/kho-nha" element={<ExpertMyProperties />} />
                <Route path="/chuyen-gia/nha/:id" element={<ExpertPropertyDetail />} />

                {/* Chuyên viên */}
                <Route path="/chuyen-vien" element={<SpecialistDashboard />} />
                <Route path="/chuyen-vien/khach-hang" element={<SpecialistCustomers />} />
                <Route path="/chuyen-vien/them-khach" element={<SpecialistAddCustomer />} />
                <Route path="/chuyen-vien/tim-nha" element={<SpecialistSearchProperty />} />
                <Route path="/chuyen-vien/lich-xem" element={<SpecialistSchedule />} />

                {/* CTV */}
                <Route path="/ctv" element={<CollabDashboard />} />
                <Route path="/ctv/cong-viec" element={<CollabWork />} />

                {/* Người giới thiệu */}
                <Route path="/gioi-thieu" element={<ReferrerDashboard />} />
                <Route path="/gioi-thieu/ma-gioi-thieu" element={<ReferrerCode />} />

                {/* Quản trị */}
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
