import React, { useState } from "react";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useOrganizations } from "../hooks/useOrganizations";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import OrgTable from "../components/OrgTable";
import CreateOrgModal from "../components/CreateOrgModal";
import FAQModal from "../components/FAQModal";
import EmbedCodeModal from "../components/EmbedCodeModal";

export default function DashboardPage() {
  const { organizations, loading, error, toggleStatus, addOrganization } =
    useOrganizations();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [faqModalOrg, setFaqModalOrg] = useState(null);
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

  const handleOpenSnippet = (org) => {
    const origin = window.location.origin.replace(":3000", ":5000");
    const snippet = `<script src="${origin}/widget.js" data-api-key="${org.apiKey}" async></script>`;
    setEmbedModalSnippet(snippet);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onOpenCreate={() => setShowCreateModal(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Statistics Metric Cards */}
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

        {/* Global Network/Database Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl">
            <strong>Connection Warning:</strong> {error}. Ensure your
            Node/Express backend is running on port 5000.
          </div>
        )}

        {/* Organizations Data Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Fetching organizations and status...
          </div>
        ) : (
          <OrgTable
            organizations={organizations}
            onToggleStatus={toggleStatus}
            onManageFAQs={(org) => setFaqModalOrg(org)}
            onGetCode={handleOpenSnippet}
          />
        )}
      </main>

      {/* Action Modals */}
      {showCreateModal && (
        <CreateOrgModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {faqModalOrg && (
        <FAQModal org={faqModalOrg} onClose={() => setFaqModalOrg(null)} />
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
