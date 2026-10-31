import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Verifying authorization...
      </div>
    );
  }

  // Not logged in -> redirect to login page, remember attempt path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if restricted
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">
          403 - Unauthorized Access
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Your account role (
          <code className="text-rose-600 font-semibold">{user?.role}</code>)
          does not have permission to view this section.
        </p>
      </div>
    );
  }

  return children;
}
