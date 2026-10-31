import React, { useState } from "react";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useOrganizations } from "../hooks/useOrganizations";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import OrgTable from "../components/OrgTable";
import CreateOrgModal from "../components/CreateOrgModal";
import EditOrgModal from "../components/EditOrgModal"; // <-- Import Edit modal
import EmbedCodeModal from "../components/EmbedCodeModal";

export default function DashboardPage() {
  const {
    organizations,
    loading,
    error,
    toggleStatus,
    addOrganization,
    reload,
  } = useOrganizations();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null); // <-- Edit state
  const [embedModalSnippet, setEmbedModalSnippet] = useState(null);

  const activeCount = organizations.filter(
    (o) => o.subscription?.isActive,
  ).length;
  const inactiveCount = organizations.length - activeCount;

  const handleCreated = (newOrg, snippet) => {
    addOrganization(newOrg);
    setShowCreateModal(false);
    setEmbedModalSnippet(snippet);
  };

  const handleUpdated = (updatedOrg) => {
    setEditingOrg(null);
    reload(); // Refresh organization listing
  };

  const handleOpenSnippet = (org) => {
    const origin = window.location.origin
      .replace(":5174", ":5000")
      .replace(":3000", ":5000");
    const snippet = `<script src="${origin}/widget.js" data-api-key="${org.apiKey}" async></script>`;
    setEmbedModalSnippet(snippet);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
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
            onToggleStatus={toggleStatus}
            onGetCode={handleOpenSnippet}
            onEditOrg={(org) => setEditingOrg(org)} // <-- Pass onEditOrg
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

      {embedModalSnippet && (
        <EmbedCodeModal
          snippet={embedModalSnippet}
          onClose={() => setEmbedModalSnippet(null)}
        />
      )}
    </div>
  );
}
