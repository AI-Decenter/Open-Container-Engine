// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import DeploymentsPage from './pages/DeploymentsPage';
import NewDeploymentPage from './pages/NewDeploymentPage';
import DeploymentDetailPage from './pages/DeploymentDetailPage';
import ApiKeysPage from './pages/ApiKeysPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <ToastContainer position="top-center" />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/deployments" element={<ProtectedRoute><DeploymentsPage /></ProtectedRoute>} />
            <Route path="/deployments/new" element={<ProtectedRoute><NewDeploymentPage /></ProtectedRoute>} />
            <Route path="/deployments/:deploymentId" element={<ProtectedRoute><DeploymentDetailPage /></ProtectedRoute>} />
            <Route path="/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />

            {/* Default route */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>

  );
}

export default App;