import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FAQPage from "./pages/FAQPage"; // <-- Import the new page
import TenantDashboard from "./pages/TenantDashboard"; // <-- Import the tenant dashboard
import ResetPasswordPage from "./pages/ResetPasswordPage"; // <-- Import the reset password page
import TenantEnquiriesPage from "./pages/TenantEnquiriesPage"; // <-- Import the tenant enquiries page

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Dedicated FAQ Knowledge Base Page */}
          <Route
            path="/organizations/:orgId/faqs"
            element={
              <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                <FAQPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/portal" element={<TenantDashboard />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/tenant/enquiries" element={<TenantEnquiriesPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
