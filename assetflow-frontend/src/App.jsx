import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { ThemeProvider } from './ThemeContext.jsx';

import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OrgSetup from './pages/OrgSetup.jsx';
import Assets from './pages/Assets.jsx';
import Allocation from './pages/Allocation.jsx';
import Booking from './pages/Booking.jsx';
import Maintaince from './pages/Maintaince.jsx';
import Reports from './pages/Reports.jsx';
import Notification from './pages/Notification.jsx';
import Audit from './pages/Audit.jsx';

// Set to false to enforce auth guards (production mode)
const BYPASS_AUTH = true;

// Redirect to /login if not authenticated; show spinner while loading auth state
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (BYPASS_AUTH) return children;
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Guard for admin-only routes
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (BYPASS_AUTH) return children;
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <strong>Admins only.</strong> You do not have permission to access this page.
        </div>
      </div>
    );
  }
  return children;
}

// Redirect already-logged-in users away from /login and /signup
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected — wrapped in Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="org-setup" element={<AdminRoute><OrgSetup /></AdminRoute>} />
        <Route path="assets" element={<Assets />} />
        <Route path="allocations" element={<Allocation />} />
        <Route path="bookings" element={<Booking />} />
        <Route path="maintenance" element={<Maintaince />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notification />} />
        <Route path="audit" element={<Audit />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
