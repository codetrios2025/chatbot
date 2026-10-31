import React, { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import WidgetPreview from "./WidgetPreview";
import { adminApi } from "../api/client";

export default function EditOrgModal({ org, onClose, onUpdated }) {
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
  });
  const [submitting, setSubmitting] = useState(false);

  const updateBranding = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      branding: { ...prev.branding, [field]: val },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      adminEmail: formData.adminEmail,
      allowedDomains: formData.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      branding: formData.branding,
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
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col md:flex-row gap-8">
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
              className="w-full text-sm border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full text-sm border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.adminEmail}
              onChange={(e) =>
                setFormData({ ...formData, adminEmail: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Allowed Domains
            </label>
            <input
              type="text"
              className="w-full text-sm border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. olive.in, app.olive.in"
              value={formData.allowedDomains}
              onChange={(e) =>
                setFormData({ ...formData, allowedDomains: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Bot Name
              </label>
              <input
                type="text"
                className="w-full text-sm border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full text-sm border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full text-sm border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.branding.welcomeMessage}
              onChange={(e) => updateBranding("welcomeMessage", e.target.value)}
            />
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
