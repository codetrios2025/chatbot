import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";
import { useOrganizations } from "../hooks/useOrganizations";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import OrgTable from "../components/OrgTable";
import CreateOrgModal from "../components/CreateOrgModal";
import EditOrgModal from "../components/EditOrgModal";
import EmbedCodeModal from "../components/EmbedCodeModal";
import PaymentModal from "../components/PaymentModal";

export default function DashboardPage() {
  const {
    organizations,
    loading,
    error,
    toggleStatus,
    addOrganization,
    updateOrgInState,
    reload,
  } = useOrganizations();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [paymentOrg, setPaymentOrg] = useState(null);
  const [embedModalSnippet, setEmbedModalSnippet] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const activeCount = organizations.filter(
    (o) => o.subscription?.isActive,
  ).length;
  const inactiveCount = organizations.length - activeCount;

  const handleCreated = (newOrg, snippet) => {
    addOrganization(newOrg);
    setShowCreateModal(false);
    setEmbedModalSnippet(snippet);
    showToast(
      "success",
      `${newOrg.name || "Organisation"} created successfully!`,
    );
  };

  const handleUpdated = (updatedOrg) => {
    // 1. Immediately replace in memory so UI updates instantly
    if (updateOrgInState) {
      updateOrgInState(updatedOrg);
    }
    // 2. Close edit modal
    setEditingOrg(null);
    // 3. Trigger background re-fetch for database consistency
    reload();
    showToast(
      "success",
      `${updatedOrg.name || "Organisation"} details updated!`,
    );
  };

  const handleToggleStatus = async (orgId, currentStatus) => {
    try {
      await toggleStatus(orgId, currentStatus);
      showToast(
        "success",
        `Organisation chatbot ${currentStatus ? "deactivated" : "activated"} successfully.`,
      );
    } catch (err) {
      showToast("error", err.message || "Failed to toggle status.");
    }
  };

  const handleOpenSnippet = (org) => {
    const origin = window.location.origin
      .replace(":5174", ":5000")
      .replace(":5173", ":5000")
      .replace(":3000", ":5000");
    const snippet = `<script src="${origin}/widget.js" data-api-key="${org.apiKey}" async></script>`;
    setEmbedModalSnippet(snippet);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <Navbar onOpenCreate={() => setShowCreateModal(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Total Tenants"
            value={organizations.length}
            subtext="Active & inactive"
            icon={Building2}
            color="blue"
          />
          <StatsCard
            label="Active Chatbots"
            value={activeCount}
            subtext="Serving end visitors"
            icon={CheckCircle2}
            color="emerald"
          />
          <StatsCard
            label="Deactivated"
            value={inactiveCount}
            subtext="Subscription past due"
            icon={AlertTriangle}
            color="amber"
          />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl">
            <strong>Connection Warning:</strong> {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Fetching organizations...
          </div>
        ) : (
          <OrgTable
            organizations={organizations}
            onToggleStatus={handleToggleStatus}
            onGetCode={handleOpenSnippet}
            onEditOrg={(org) => setEditingOrg(org)}
            onOpenPayment={(org) => setPaymentOrg(org)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateOrgModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {editingOrg && (
        <EditOrgModal
          org={editingOrg}
          onClose={() => setEditingOrg(null)}
          onUpdated={handleUpdated}
        />
      )}

      {paymentOrg && (
        <PaymentModal
          org={paymentOrg}
          onClose={() => setPaymentOrg(null)}
          onPaymentSuccess={() => {
            reload();
            showToast("success", "Subscription renewed successfully!");
          }}
        />
      )}

      {embedModalSnippet && (
        <EmbedCodeModal
          snippet={embedModalSnippet}
          onClose={() => setEmbedModalSnippet(null)}
          onCopied={() => showToast("success", "Script copied to clipboard!")}
        />
      )}
    </div>
  );
}
