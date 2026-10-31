import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bot,
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2,
  X,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [loginType, setLoginType] = useState("tenant"); // 'tenant' | 'admin'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState({
    loading: false,
    msg: null,
    error: null,
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (loginType === "admin") {
        // 1. Superadmin Login Flow
        await login(email, password);
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        // 2. Organization Tenant Login Flow
        const response = await fetch(`${API_BASE}/tenant/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Invalid organisation credentials.");
        }

        // Store tenant session details
        localStorage.setItem("tenantToken", data.token);
        localStorage.setItem("tenantOrg", JSON.stringify(data.org));

        navigate("/portal", { replace: true });
      }
    } catch (err) {
      setError(
        err.message || "Authentication failed. Please verify your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotStatus({ loading: true, msg: null, error: null });

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          accountType: loginType, // 'tenant' or 'admin'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setForgotStatus({
          loading: false,
          msg: data.message || "Password reset link sent to your email.",
          error: null,
        });
      } else {
        setForgotStatus({
          loading: false,
          msg: null,
          error: data.message || "Failed to process password reset request.",
        });
      }
    } catch {
      setForgotStatus({
        loading: false,
        msg: null,
        error: "Unable to reach server. Please try again later.",
      });
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email); // Pre-fill with entered login email if any
    setForgotStatus({ loading: false, msg: null, error: null });
    setShowForgotModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
            <Bot size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {loginType === "tenant"
              ? "Organisation Portal"
              : "Platform Superadmin"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {loginType === "tenant"
              ? "Sign in to customize your chatbot, train FAQs, and update branding"
              : "Sign in to manage multi-tenant clients, bots, and subscriptions"}
          </p>
        </div>

        {/* Tab Switcher: Organisation vs Superadmin */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200/70">
          <button
            type="button"
            onClick={() => {
              setLoginType("tenant");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              loginType === "tenant"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={14} />
            <span>Organisation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType("admin");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              loginType === "admin"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Superadmin</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              {loginType === "tenant"
                ? "Registered Admin Email"
                : "Superadmin Email"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  loginType === "tenant"
                    ? "admin@yourcompany.com"
                    : "superadmin@platform.com"
                }
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={openForgotModal}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-xl text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>
                  Sign In to {loginType === "tenant" ? "Portal" : "Console"}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-5">
          <p className="text-[11px] text-slate-400">
            {loginType === "tenant"
              ? "Need access? Contact your platform superadmin to receive credentials."
              : "Internal administrative access only. IP and access logs are monitored."}
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reset Password
                </h3>
                <p className="text-xs text-slate-500">
                  {loginType === "tenant"
                    ? "Organisation Account"
                    : "Superadmin Account"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Enter your registered email address below. If an account is found,
              we will send you a secure link to reset your password.
            </p>

            {forgotStatus.error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{forgotStatus.error}</span>
              </div>
            )}

            {forgotStatus.msg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{forgotStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotStatus.loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {forgotStatus.loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
