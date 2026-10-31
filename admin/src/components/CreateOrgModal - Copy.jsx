import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import WidgetPreview from "./WidgetPreview";
import { adminApi } from "../api/client";

export default function CreateOrgModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    adminEmail: "",
    allowedDomains: "",
    branding: {
      botName: "Support Assistant",
      welcomeMessage: "Hello! How can we help you today?",
      themeColor: "#2563EB",
      logoUrl: "",
      position: "bottom-right",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateBranding = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      branding: { ...prev.branding, [field]: val },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      allowedDomains: formData.allowedDomains
        .split(",")
        .map((domain) => domain.trim())
        .filter(Boolean),
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
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col md:flex-row gap-8">
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
              Company Name
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
              Admin Email (Receives Lead Enquiries)
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
              <Sparkles size={14} />
              {isSubmitting ? "Registering..." : "Save & Generate Snippet"}
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
