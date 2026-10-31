import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  HelpCircle,
  LogOut,
  Check,
  Loader2,
  Star,
  Pencil,
  Trash2,
  Globe,
  Plus,
  Code2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from "lucide-react";
import WidgetPreview from "../components/WidgetPreview";
import ChangePasswordModal from "../components/ChangePasswordModal";

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faqs"); // 'faqs' | 'settings' | 'script'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [org, setOrg] = useState(null);
  const [faqs, setFaqs] = useState([]);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Add FAQ Form States
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submittingFaq, setSubmittingFaq] = useState(false);

  // Edit FAQ Modal States
  const [editingFaq, setEditingFaq] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  // Settings State
  const [adminEmail, setAdminEmail] = useState("");
  const [branding, setBranding] = useState({
    botName: "",
    welcomeMessage: "",
    themeColor: "#2563EB",
    logoUrl: "",
    position: "bottom-right",
  });

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";
  const token = localStorage.getItem("tenantToken");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, faqsRes] = await Promise.all([
        fetch(`${API_BASE}/tenant/profile`, { headers: authHeaders }).then(
          (r) => r.json(),
        ),
        fetch(`${API_BASE}/tenant/faqs`, { headers: authHeaders }).then((r) =>
          r.json(),
        ),
      ]);

      if (profileRes.success) {
        setOrg(profileRes.data);
        setAdminEmail(profileRes.data.adminEmail || "");
        setBranding(
          profileRes.data.branding || {
            botName: "Support Assistant",
            welcomeMessage: "Hello! How can we help you today?",
            themeColor: "#2563EB",
            logoUrl: "",
            position: "bottom-right",
          },
        );
      }
      if (faqsRes.success) {
        setFaqs(faqsRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tenantToken");
    localStorage.removeItem("tenantOrg");
    navigate("/login");
  };

  // Add FAQ
  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setSubmittingFaq(true);

    try {
      const res = await fetch(`${API_BASE}/tenant/faqs`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      }).then((r) => r.json());

      if (res.success) {
        setFaqs([res.data, ...faqs]);
        setQuestion("");
        setAnswer("");
        setKeywords("");
        setCurrentPage(1);
      } else {
        alert(res.message || "Failed to add FAQ");
      }
    } catch {
      alert("Error saving question");
    } finally {
      setSubmittingFaq(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditKeywords((faq.keywords || []).join(", "));
  };

  // Save Edit FAQ
  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    if (!editQuestion.trim() || !editAnswer.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/tenant/faqs/${editingFaq._id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          keywords: editKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      }).then((r) => r.json());

      if (res.success) {
        setFaqs(faqs.map((f) => (f._id === editingFaq._id ? res.data : f)));
        setEditingFaq(null);
      } else {
        alert(res.message || "Failed to update FAQ");
      }
    } catch {
      alert("Error updating FAQ");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle Default Chip
  const handleToggleChip = async (faqId) => {
    try {
      const res = await fetch(`${API_BASE}/tenant/faqs/${faqId}/toggle-chip`, {
        method: "PATCH",
        headers: authHeaders,
      }).then((r) => r.json());

      if (res.success) {
        setFaqs(
          faqs.map((f) =>
            f._id === faqId ? { ...f, isDefaultChip: !f.isDefaultChip } : f,
          ),
        );
      }
    } catch {
      alert("Failed to toggle chip status");
    }
  };

  // Delete FAQ
  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm("Delete this question from knowledge base?")) return;
    try {
      await fetch(`${API_BASE}/tenant/faqs/${faqId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setFaqs(faqs.filter((f) => f._id !== faqId));
    } catch {
      alert("Failed to delete FAQ");
    }
  };

  // Save Settings & Branding
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/tenant/profile`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ adminEmail, branding }),
      }).then((r) => r.json());

      if (res.success) {
        alert("Branding and settings updated successfully!");
      } else {
        alert(res.message || "Update failed");
      }
    } catch {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  // Filtering & Pagination Calculations
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return faqs;

    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.keywords?.some((k) => k.toLowerCase().includes(q)),
    );
  }, [faqs, searchQuery]);

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage) || 1;
  const paginatedFaqs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFaqs.slice(start, start + itemsPerPage);
  }, [filteredFaqs, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-500">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={20} />{" "}
        Loading portal...
      </div>
    );
  }

  const scriptOrigin = API_BASE.replace("/api/v1", "");
  const embedCode = `<script src="${scriptOrigin}/widget.js" data-api-key="${org?.apiKey}" async></script>`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                style={{ backgroundColor: branding.themeColor || "#2563EB" }}
              >
                {org?.name?.charAt(0) || "O"}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-slate-900">
                {org?.name} Portal
              </h1>
              <p className="text-[11px] text-slate-400">Tenant Control Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("enquiry")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "enquiry" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Enquiries
            </button>
            <button
              onClick={() => setActiveTab("faqs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "faqs" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100"}`}
            >
              FAQ Training
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "settings" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Branding & Identity
            </button>
            <button
              onClick={() => setActiveTab("script")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "script" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Embed Script
            </button>
            <button
              onClick={() => setShowPassModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Lock size={13} />
              <span>Password</span>
            </button>
            <button
              onClick={handleLogout}
              className="ml-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {activeTab === "faqs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Add New Question Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-1">
                  Train New FAQ
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Add questions and answers to power your website AI widget.
                </p>

                <form onSubmit={handleAddFaq} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Customer Question
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. What are your business hours?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Answer
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your answer..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="hours, timing, schedule"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingFaq}
                    className="w-full bg-slate-900 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs hover:bg-slate-800 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingFaq ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    <span>{submittingFaq ? "Saving..." : "Save Question"}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Knowledge Base List with Search, Pencil & Pagination */}
            <div className="lg:col-span-7 space-y-3">
              {/* Top Search bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs flex items-center gap-2">
                <Search size={16} className="text-slate-400 shrink-0 ml-1.5" />
                <input
                  type="text"
                  placeholder="Search questions, answers, or tags..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs outline-none bg-transparent text-slate-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-1 pt-1 pb-1">
                <h3 className="text-xs font-bold text-slate-700">
                  Knowledge Base ({filteredFaqs.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Click star to pin as quick chip
                </span>
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs">
                  <HelpCircle
                    size={28}
                    className="mx-auto mb-2 opacity-30 text-slate-500"
                  />
                  {searchQuery
                    ? "No matching questions found."
                    : "No questions in knowledge base."}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedFaqs.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex items-start justify-between gap-3 transition group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          Q: {item.question}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          A: {item.answer}
                        </p>
                        {item.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.keywords.map((k, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                              >
                                #{k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Icons: Star (Default Chip), Edit Pencil, Trash */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleChip(item._id)}
                          title={
                            item.isDefaultChip
                              ? "Remove from default chips"
                              : "Pin to widget default chips"
                          }
                          className={`p-1.5 rounded-lg transition ${
                            item.isDefaultChip
                              ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-300 hover:text-amber-500 hover:bg-slate-50"
                          }`}
                        >
                          <Star
                            size={15}
                            fill={item.isDefaultChip ? "currentColor" : "none"}
                          />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Question & Answer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteFaq(item._id)}
                          title="Delete FAQ"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Numbered Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs flex items-center justify-between text-xs text-slate-600 mt-2">
                  <div>
                    Page{" "}
                    <span className="font-semibold text-slate-900">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-900">
                      {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1,
                      )
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg font-medium text-xs transition ${
                              currentPage === p
                                ? "bg-blue-600 text-white font-bold"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Branding & Identity Tab */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleSaveSettings}
              className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Theme & Identity Settings
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Admin Notification Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 mt-1 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={branding.botName}
                    onChange={(e) =>
                      setBranding({ ...branding, botName: e.target.value })
                    }
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 mt-1 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={branding.themeColor}
                      onChange={(e) =>
                        setBranding({ ...branding, themeColor: e.target.value })
                      }
                      className="w-9 h-9 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={branding.themeColor}
                      onChange={(e) =>
                        setBranding({ ...branding, themeColor: e.target.value })
                      }
                      className="w-full text-xs border border-slate-200 rounded-xl p-2 outline-none"
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
                  placeholder="https://yourdomain.com/logo.png"
                  value={branding.logoUrl}
                  onChange={(e) =>
                    setBranding({ ...branding, logoUrl: e.target.value })
                  }
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 mt-1 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Welcome Message
                </label>
                <input
                  type="text"
                  value={branding.welcomeMessage}
                  onChange={(e) =>
                    setBranding({ ...branding, welcomeMessage: e.target.value })
                  }
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 mt-1 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
              </button>
            </form>

            <div className="lg:col-span-5 flex flex-col items-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Live Widget Preview
              </p>
              <WidgetPreview branding={branding} />
            </div>
          </div>
        )}

        {/* Embed Script Tab */}
        {activeTab === "script" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Embed Chatbot on Your Website
            </h2>
            <p className="text-xs text-slate-500">
              Copy and paste this script right before the closing{" "}
              <code>&lt;/body&gt;</code> tag on your website:
            </p>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto">
              {embedCode}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                alert("Script copied to clipboard!");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Copy Script
            </button>
          </div>
        )}
      </main>

      {/* Edit FAQ Modal */}
      {editingFaq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Pencil size={15} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Edit Question & Answer
                </h3>
              </div>
              <button
                onClick={() => setEditingFaq(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateFaq} className="space-y-3.5 pt-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Customer Question
                </label>
                <input
                  type="text"
                  required
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Answer
                </label>
                <textarea
                  required
                  rows={5}
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editKeywords}
                  onChange={(e) => setEditKeywords(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>
                    {isUpdating ? "Saving Changes..." : "Save Changes"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPassModal && (
        <ChangePasswordModal
          isTenant={true}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </div>
  );
}
