import React, { useState } from "react";
import { X, Sparkles, Calendar, ShieldCheck, Loader2 } from "lucide-react";
import WidgetPreview from "./WidgetPreview";
import { adminApi } from "../api/client";

export default function CreateOrgModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    adminEmail: "",
    allowedDomains: "",
    contactDetails: {
      phone: "",
      email: "",
      address: "",
      mapUrl: "",
    },
    branding: {
      botName: "Support Assistant",
      welcomeMessage: "Hello! How can we help you today?",
      themeColor: "#2563EB",
      logoUrl: "",
      position: "bottom-right",
    },
    subscription: {
      plan: "TRIAL",
      durationDays: 7,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const handlePlanChange = (plan) => {
    setFormData((prev) => ({
      ...prev,
      subscription: {
        plan,
        durationDays: plan === "TRIAL" ? 7 : 30,
      },
    }));
  };

  const handleDurationChange = (durationDays) => {
    setFormData((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        durationDays: Number(durationDays),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      allowedDomains: formData.allowedDomains
        .split(",")
        .map((domain) => domain.trim())
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
        durationDays: Number(formData.subscription.durationDays),
      },
    };

    try {
      const res = await adminApi.createOrganization(payload);
      if (res.success) {
        onCreated(res.data, res.scriptSnippet);
      }
    } catch (err) {
      alert(err.message || "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col md:flex-row gap-8 max-h-[92vh] overflow-y-auto">
        {/* Left Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">
              Register New Organisation
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
              Company Name *
            </label>
            <input
              type="text"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Acme Corporation"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Admin Email (Receives Lead Enquiries) *
            </label>
            <input
              type="email"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="admin@acme.com"
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
              placeholder="acme.com, portal.acme.com"
              value={formData.allowedDomains}
              onChange={(e) =>
                setFormData({ ...formData, allowedDomains: e.target.value })
              }
            />
          </div>

          {/* Initial Subscription Tier Selection */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck size={15} className="text-blue-600" />
                <span>Subscription Plan</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  formData.subscription.plan === "TRIAL"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {formData.subscription.plan === "TRIAL"
                  ? `${formData.subscription.durationDays}-Day Free Trial`
                  : `Premium (${formData.subscription.durationDays} Days)`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Plan Tier
                </label>
                <select
                  value={formData.subscription.plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                >
                  <option value="TRIAL">Trial</option>
                  <option value="PREMIUM">Premium (Paid)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Initial Duration
                </label>
                <select
                  value={formData.subscription.durationDays}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none bg-white focus:border-blue-500"
                >
                  {formData.subscription.plan === "TRIAL" ? (
                    <>
                      <option value="7">7 Days (Standard Trial)</option>
                      <option value="14">14 Days (Extended Trial)</option>
                    </>
                  ) : (
                    <>
                      <option value="30">1 Month (30 Days)</option>
                      <option value="90">3 Months (90 Days)</option>
                      <option value="180">6 Months (180 Days)</option>
                      <option value="365">1 Year (365 Days)</option>
                    </>
                  )}
                </select>
              </div>
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
                Theme Hex Color
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
              Logo Image URL
            </label>
            <input
              type="url"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://acme.com/assets/logo.png"
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
          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Save & Generate Snippet</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Preview */}
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
