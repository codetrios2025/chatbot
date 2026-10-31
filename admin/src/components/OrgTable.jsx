import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentModal from "./PaymentModal";
import EnquiriesModal from "./EnquiriesModal";

import {
  BookOpen,
  Code2,
  Globe,
  Mail,
  Pencil,
  Trash2,
  Loader2,
  Send,
  CreditCard,
  Power,
  MessageSquareText,
} from "lucide-react";

export default function OrgTable({
  organizations,
  onToggleStatus,
  onManageFAQs,
  onGetCode,
  onEditOrg,
}) {
  const navigate = useNavigate();
  // Inside OrgTable.jsx:
  const [sendingId, setSendingId] = useState(null);
  const [paymentOrg, setPaymentOrg] = useState(null);
  const [enquiriesOrg, setEnquiriesOrg] = useState(null);
  const handleSendCredentials = async (org) => {
    if (
      !window.confirm(
        `Generate new password and send portal access email to ${org.adminEmail}?`,
      )
    )
      return;
    setSendingId(org._id);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:5000/api/v1";
      const res = await fetch(
        `${API_BASE}/admin/organizations/${org._id}/send-credentials`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      alert(data.message || "Credentials sent!");
    } catch {
      alert("Failed to send credentials.");
    } finally {
      setSendingId(null);
    }
  };

  // Helper to calculate days remaining
  const getSubscriptionBadgeold = (subscription) => {
    if (!subscription || !subscription.isActive) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
          INACTIVE
        </span>
      );
    }
    const expiry = new Date(subscription.expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
          EXPIRED
        </span>
      );
    }
    if (subscription.plan === "TRIAL") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
          TRIAL ({diffDays}d left)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
        PREMIUM ({diffDays}d left)
      </span>
    );
  };

  const getSubscriptionBadge = (subscription) => {
    if (!subscription || !subscription.isActive) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
          INACTIVE
        </span>
      );
    }

    const expiryDate = new Date(subscription.expiresAt);
    const now = new Date();

    // Normalize both to midnight local time
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfExpiry = new Date(
      expiryDate.getFullYear(),
      expiryDate.getMonth(),
      expiryDate.getDate(),
    );

    const diffDays = Math.round(
      (startOfExpiry.getTime() - startOfToday.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
          EXPIRED
        </span>
      );
    }

    if (subscription.plan === "TRIAL") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
          TRIAL ({diffDays}d left)
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
        PREMIUM ({diffDays}d left)
      </span>
    );
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th className="px-5 py-4">Organisation</th>
              <th className="px-5 py-4">Admin Email</th>
              <th className="px-5 py-4">Theme & Identity</th>
              <th className="px-5 py-4">Plan Status</th>
              <th className="px-5 py-4">Subscription</th>
              <th className="px-5 py-4">Bot Active</th>
              <th className="px-5 py-4 text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {organizations.map((org) => {
              const isActive = Boolean(org.subscription?.isActive);
              return (
                <tr
                  key={org._id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900 leading-tight">
                      {org.name}
                    </p>
                    {org.allowedDomains?.length > 0 && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Globe size={11} />
                        {org.allowedDomains.join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      {org.adminEmail}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200 shadow-xs shrink-0"
                        style={{
                          backgroundColor:
                            org.branding?.themeColor || "#2563EB",
                        }}
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        {org.branding?.botName || "Support Bot"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-rose-50 text-rose-700 border border-rose-200/60"
                      }`}
                    >
                      {isActive
                        ? org.subscription?.plan || "Active"
                        : "Suspended"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1 items-start">
                      {getSubscriptionBadge(org.subscription)}
                      <span className="text-[10px] text-slate-400">
                        Exp:{" "}
                        {org.subscription?.expiresAt
                          ? new Date(
                              org.subscription.expiresAt,
                            ).toLocaleDateString("en-GB")
                          : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onToggleStatus(org._id, isActive)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center space-x-1.5">
                      {/* Enquiries Button */}
                      {/* <button
                        onClick={() => setEnquiriesOrg(org)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                        title="View Customer Enquiries"
                      >
                        <MessageSquareText size={13} />
                        <span>Enquiries</span>
                      </button> */}
                      {/* Edit Button */}
                      <button
                        onClick={() => onEditOrg(org)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition"
                        title="Edit organization & branding"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/organizations/${org._id}/faqs`)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      >
                        <BookOpen size={13} />
                        FAQs
                      </button>
                      <button
                        onClick={() => onGetCode(org)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                      >
                        <Code2 size={13} />
                        Script
                      </button>
                      <button
                        onClick={() => handleSendCredentials(org)}
                        disabled={sendingId === org._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition disabled:opacity-50"
                        title="Send credentials & embed script"
                      >
                        {sendingId === org._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        Invite
                      </button>

                      <button
                        onClick={() => setPaymentOrg(org)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                        title="Renew / Upgrade Subscription"
                      >
                        <CreditCard size={13} />
                        <span>Plan</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Payment Modal Mount */}
            {paymentOrg && (
              <PaymentModal
                org={paymentOrg}
                onClose={() => setPaymentOrg(null)}
                onPaymentSuccess={() => {
                  loadOrganizations(); // Refresh table
                }}
              />
            )}
            {/* Render Enquiries Modal */}
            {enquiriesOrg && (
              <EnquiriesModal
                org={enquiriesOrg}
                onClose={() => setEnquiriesOrg(null)}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
