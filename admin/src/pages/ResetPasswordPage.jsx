import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Check, AlertCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const accountType = searchParams.get("type") || "tenant";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({
        loading: false,
        error: "Passwords do not match.",
        success: false,
      });
      return;
    }

    setStatus({ loading: true, error: null, success: false });
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accountType, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({ loading: false, error: null, success: true });
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setStatus({
          loading: false,
          error: data.message || "Reset failed.",
          success: false,
        });
      }
    } catch {
      setStatus({ loading: false, error: "Connection error.", success: false });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-3">
            <Lock size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Set New Password</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your new secure account password below.
          </p>
        </div>

        {status.error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{status.error}</span>
          </div>
        )}

        {status.success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center">
            Password reset successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status.loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              <span>{status.loading ? "Resetting..." : "Reset Password"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
