
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import SEOManager from './components/SEOManager';

const SignInPage = lazy(() => import('./pages/SignInPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const SvpDashboardPage = lazy(() => import('./pages/SvpDashboardPage'));
const SvpPropertiesPage = lazy(() => import('./pages/SvpPropertiesPage'));
const SvpPropertyDetailPage = lazy(() => import('./pages/SvpPropertyDetailPage'));
const SvpPostPropertyPage = lazy(() => import('./pages/SvpPostPropertyPage'));
const SvpAdminConfigPage = lazy(() => import('./pages/SvpAdminConfigPage'));
const SvpCustomersPage = lazy(() => import('./pages/SvpCustomersPage'));
const SvpModulesPage = lazy(() => import('./pages/SvpModulesPage'));
const SvpReferralPage = lazy(() => import('./pages/SvpReferralPage'));
const SvpAuditPage = lazy(() => import('./pages/SvpAuditPage'));

function App() {
  return (
    <LanguageProvider>
      <Router>
        <SEOManager />
        <Suspense fallback={<div className="min-h-screen bg-[#030405]" />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<SvpDashboardPage />} />
            <Route path="/nha" element={<SvpPropertiesPage />} />
            <Route path="/nha/:id" element={<SvpPropertyDetailPage />} />
            <Route path="/post-property" element={<SvpPostPropertyPage />} />
            <Route path="/khach-hang" element={<SvpCustomersPage />} />
            <Route path="/referral" element={<SvpReferralPage />} />
            <Route path="/admin" element={<Navigate to="/admin/config" replace />} />
            <Route path="/admin/config" element={<SvpAdminConfigPage />} />
            <Route path="/module" element={<SvpModulesPage />} />
            <Route path="/audit" element={<SvpAuditPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </LanguageProvider>
  );
}

export default App;
