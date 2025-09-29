// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import DeploymentsPage from './pages/DeploymentsPage';
import NewDeploymentPage from './pages/NewDeploymentPage';
import DeploymentDetailPage from './pages/DeploymentDetailPage';
import ApiKeysPage from './pages/ApiKeysPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import FeaturesPage from './pages/FeaturesPage';
import DocumentationPage from './pages/DocumentationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import WebhooksPage from './pages/WebhooksPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  return (
    <>
      <ToastContainer position="top-center" />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} /> 
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/documentation" element={<DocumentationPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/deployments" element={<ProtectedRoute><DeploymentsPage /></ProtectedRoute>} />
              <Route path="/deployments/new" element={<ProtectedRoute><NewDeploymentPage /></ProtectedRoute>} />
              <Route path="/deployments/:deploymentId" element={<ProtectedRoute><DeploymentDetailPage /></ProtectedRoute>} />
              <Route path="/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
              <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />

              {/* Default route */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </>

  );
}

export default App;