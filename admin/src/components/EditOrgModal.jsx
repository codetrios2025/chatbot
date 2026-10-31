import React, { useState } from "react";
import { X, Check, Loader2, ShieldCheck, Calendar } from "lucide-react";
import WidgetPreview from "./WidgetPreview";
import { adminApi } from "../api/client";

export default function EditOrgModal({ org, onClose, onUpdated }) {
  // Format ISO date string to YYYY-MM-DD for <input type="date" />
  const formatInitialDate = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
  };

  const [formData, setFormData] = useState({
    name: org.name || "",
    adminEmail: org.adminEmail || "",
    allowedDomains: (org.allowedDomains || []).join(", "),
    branding: {
      botName: org.branding?.botName || "Support Assistant",
      welcomeMessage:
        org.branding?.welcomeMessage || "Hello! How can we help you today?",
      themeColor: org.branding?.themeColor || "#2563EB",
      logoUrl: org.branding?.logoUrl || "",
      position: org.branding?.position || "bottom-right",
    },
    contactDetails: {
      phone: org.contactDetails?.phone || "",
      email: org.contactDetails?.email || "",
      address: org.contactDetails?.address || "",
      mapUrl: org.contactDetails?.mapUrl || "",
    },
    subscription: {
      plan: org.subscription?.plan
        ? org.subscription.plan.toUpperCase()
        : "TRIAL",
      isActive: org.subscription?.isActive ?? true,
      expiresAt: formatInitialDate(org.subscription?.expiresAt),
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const updateBranding = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      branding: { ...prev.branding, [field]: val },
    }));
  };
  const updateContact = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      contactDetails: { ...prev.contactDetails, [field]: val },
    }));
  };
  const updateSubscription = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      subscription: { ...prev.subscription, [field]: val },
    }));
  };

  // Quick duration extension helper
  const handleExtendDuration = (days) => {
    const baseDate = formData.subscription.expiresAt
      ? new Date(formData.subscription.expiresAt)
      : new Date();
    const future = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    updateSubscription("expiresAt", future.toISOString().split("T")[0]);
  };

  // Compute days remaining
  // 1. Calculate remaining days consistently based on local date
  const calculateDaysLeft = () => {
    if (!formData.subscription.expiresAt) return 0;

    const [year, month, day] = formData.subscription.expiresAt
      .split("-")
      .map(Number);

    const now = new Date();
    // Normalize both to midnight local time
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfExpiry = new Date(year, month - 1, day);

    const diff = Math.round(
      (startOfExpiry.getTime() - startOfToday.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return Math.max(0, diff);
  };

  const daysLeft = calculateDaysLeft();

  const handleSubmitold = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      allowedDomains: formData.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      branding: formData.branding,
      subscription: {
        plan: formData.subscription.plan,
        isActive: Boolean(formData.subscription.isActive),
        expiresAt: formData.subscription.expiresAt
          ? new Date(formData.subscription.expiresAt)
          : undefined,
      },
    };

    try {
      const res = await adminApi.updateOrganization(org._id, payload);
      if (res.success) {
        onUpdated(res.data);
      } else {
        alert(res.message || "Update failed");
      }
    } catch (err) {
      alert(err.message || "Failed to update organization");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit2 = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // If date is "2026-11-06", ensure it is treated as a full UTC/local timestamp
    let parsedExpiry = undefined;
    if (formData.subscription.expiresAt) {
      // End of day UTC
      parsedExpiry = new Date(
        `${formData.subscription.expiresAt}T23:59:59.999Z`,
      );
    }

    const payload = {
      name: formData.name.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      allowedDomains: formData.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      branding: formData.branding,
      subscription: {
        plan: formData.subscription.plan,
        isActive: Boolean(formData.subscription.isActive),
        expiresAt: parsedExpiry ? parsedExpiry.toISOString() : undefined,
      },
    };

    try {
      const res = await adminApi.updateOrganization(org._id, payload);
      if (res.success) {
        onUpdated(res.data);
      } else {
        alert(res.message || "Update failed");
      }
    } catch (err) {
      alert(err.message || "Failed to update organization");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let parsedExpiry = undefined;
    if (formData.subscription.expiresAt) {
      // Split YYYY-MM-DD
      const [year, month, day] = formData.subscription.expiresAt
        .split("-")
        .map(Number);
      // Construct a Date object in local time and set to local 23:59:59
      const localDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      parsedExpiry = localDate.toISOString();
    }

    const payload = {
      name: formData.name.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      allowedDomains: formData.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      branding: formData.branding,
      contactDetails: {
        phone: formData.contactDetails.phone.trim(),
        email: formData.contactDetails.email.trim().toLowerCase(),
        address: formData.contactDetails.address.trim(),
        mapUrl: formData.contactDetails.mapUrl.trim(),
      },
      subscription: {
        plan: formData.subscription.plan,
        isActive: Boolean(formData.subscription.isActive),
        expiresAt: parsedExpiry,
      },
    };

    try {
      const res = await adminApi.updateOrganization(org._id, payload);
      if (res.success) {
        onUpdated(res.data);
      } else {
        alert(res.message || "Update failed");
      }
    } catch (err) {
      alert(err.message || "Failed to update organization");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col md:flex-row gap-8 max-h-[92vh] overflow-y-auto">
        {/* Left Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">
              Edit Organisation & Branding
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Company Name
            </label>
            <input
              type="text"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Admin Email
            </label>
            <input
              type="email"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.adminEmail}
              onChange={(e) =>
                setFormData({ ...formData, adminEmail: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Allowed Domains (Comma separated)
            </label>
            <input
              type="text"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. olive.in, app.olive.in"
              value={formData.allowedDomains}
              onChange={(e) =>
                setFormData({ ...formData, allowedDomains: e.target.value })
              }
            />
          </div>

          {/* Subscription & Lifecycle Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck size={15} className="text-blue-600" />
                <span>Subscription Plan & Access</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  !formData.subscription.isActive || daysLeft <= 0
                    ? "bg-rose-100 text-rose-800"
                    : formData.subscription.plan === "TRIAL"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {!formData.subscription.isActive
                  ? "DEACTIVATED"
                  : daysLeft <= 0
                    ? "EXPIRED"
                    : `${formData.subscription.plan} (${daysLeft}d left)`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Plan Tier
                </label>
                <select
                  value={formData.subscription.plan}
                  onChange={(e) => updateSubscription("plan", e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                >
                  <option value="TRIAL">Trial</option>
                  <option value="PREMIUM">Premium (Paid)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Chatbot & Portal Status
                </label>
                <select
                  value={formData.subscription.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    updateSubscription("isActive", e.target.value === "active")
                  }
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                >
                  <option value="active">Active (Enabled)</option>
                  <option value="inactive">Suspended (Disabled)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Expiration Date
                </label>
                <div className="flex gap-1 text-[10px]">
                  {/* <button
                    type="button"
                    onClick={() => handleExtendDuration(7)}
                    className="text-blue-600 hover:underline px-1"
                  >
                    +7d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(30)}
                    className="text-blue-600 hover:underline px-1"
                  >
                    +30d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(365)}
                    className="text-blue-600 hover:underline px-1"
                  >
                    +1y
                  </button> */}
                </div>
              </div>
              <input
                type="date"
                required
                className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                value={formData.subscription.expiresAt}
                onChange={(e) =>
                  updateSubscription("expiresAt", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Bot Name
              </label>
              <input
                type="text"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.branding.botName}
                onChange={(e) => updateBranding("botName", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Theme Color
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  className="w-10 h-10 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                  value={formData.branding.themeColor}
                  onChange={(e) => updateBranding("themeColor", e.target.value)}
                />
                <input
                  type="text"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.branding.themeColor}
                  onChange={(e) => updateBranding("themeColor", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Logo URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.branding.logoUrl}
              onChange={(e) => updateBranding("logoUrl", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Welcome Message
            </label>
            <input
              type="text"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.branding.welcomeMessage}
              onChange={(e) => updateBranding("welcomeMessage", e.target.value)}
            />
          </div>
          {/* Contact Details Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800">
              Organisation Contact Details (for Chatbot)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                  value={formData.contactDetails.phone}
                  onChange={(e) => updateContact("phone", e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Public Contact Email
                </label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                  value={formData.contactDetails.email}
                  onChange={(e) => updateContact("email", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Company Physical Address
              </label>
              <input
                type="text"
                placeholder="e.g. 123 Tech Park, Okhla Phase 3, New Delhi, India"
                className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                value={formData.contactDetails.address}
                onChange={(e) => updateContact("address", e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Google Maps URL
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                value={formData.contactDetails.mapUrl}
                onChange={(e) => updateContact("mapUrl", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>{submitting ? "Updating..." : "Save Changes"}</span>
            </button>
          </div>
        </form>

        {/* Right Live Preview */}
        <div className="hidden md:flex flex-col items-center justify-center border-l border-slate-100 pl-8">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Live Preview
          </p>
          <WidgetPreview branding={formData.branding} />
        </div>
      </div>
    </div>
  );
}
