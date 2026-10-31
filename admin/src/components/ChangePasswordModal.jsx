import React, { useState } from "react";
import { X, Lock, Check, Loader2, AlertCircle } from "lucide-react";

export default function ChangePasswordModal({ isTenant = false, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: false, error: null, success: null });

    if (newPassword !== confirmPassword) {
      setStatus({
        loading: false,
        error: "New passwords do not match.",
        success: null,
      });
      return;
    }

    setStatus({ loading: true, error: null, success: null });
    const token = isTenant
      ? localStorage.getItem("tenantToken")
      : localStorage.getItem("adminToken");
    const endpoint = isTenant
      ? "/auth/tenant-change-password"
      : "/auth/change-password";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({
          loading: false,
          error: null,
          success: "Password updated successfully!",
        });
        setTimeout(() => onClose(), 1500);
      } else {
        setStatus({
          loading: false,
          error: data.message || "Failed to change password.",
          success: null,
        });
      }
    } catch {
      setStatus({
        loading: false,
        error: "Network error. Try again.",
        success: null,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Lock size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Change Account Password
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={18} />
          </button>
        </div>

        {status.error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{status.error}</span>
          </div>
        )}

        {status.success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <Check size={15} />
            <span>{status.success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              New Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status.loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {status.loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>{status.loading ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
