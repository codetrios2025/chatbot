import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Pencil,
  X,
  Check,
  Star,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { adminApi } from "../api/client";

export default function FAQPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();

  // Organization & FAQ Data
  const [org, setOrg] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Manual Add Form states
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Crawler states
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  // Edit Modal states
  const [editingFaq, setEditingFaq] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgsRes, faqsRes] = await Promise.all([
        adminApi.fetchOrganizations(),
        adminApi.fetchFAQs(orgId),
      ]);

      if (orgsRes.success) {
        const currentOrg = orgsRes.data.find((o) => o._id === orgId);
        setOrg(currentOrg || null);
        if (currentOrg?.allowedDomains?.[0]) {
          setScrapeUrl(`https://${currentOrg.allowedDomains[0]}`);
        }
      }

      if (faqsRes.success) {
        setFaqs(faqsRes.data || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  // Open Edit Modal with selected FAQ data
  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditKeywords((faq.keywords || []).join(", "));
  };

  // Submit FAQ Edit
  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    if (!editQuestion.trim() || !editAnswer.trim()) return;

    setIsUpdating(true);
    const keywordArray = editKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const res = await adminApi.updateFAQ(orgId, editingFaq._id, {
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
        keywords: keywordArray,
      });

      if (res.success) {
        // Optimistically update item in local state
        setFaqs((prev) =>
          prev.map((f) => (f._id === editingFaq._id ? res.data : f)),
        );
        setEditingFaq(null);
      }
    } catch (err) {
      alert(err.message || "Failed to update FAQ");
    } finally {
      setIsUpdating(false);
    }
  };

  // Add Single FAQ
  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setSubmitting(true);
    const keywordArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const res = await adminApi.createFAQ(orgId, {
        question: question.trim(),
        answer: answer.trim(),
        keywords: keywordArray,
      });

      if (res.success) {
        setFaqs((prev) => [res.data, ...prev]);
        setQuestion("");
        setAnswer("");
        setKeywords("");
        setCurrentPage(1);
      }
    } catch (err) {
      alert(err.message || "Failed to save FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  // Run AI Website Crawler
  const handleScrape = async (e) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;

    setIsScraping(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:5000/api/v1";

      const res = await fetch(
        `${API_BASE}/admin/organizations/${orgId}/scrape`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ websiteUrl: scrapeUrl, maxPages: 4 }),
        },
      );
      const data = await res.json();

      if (data.success) {
        alert(data.message || "Auto-crawl finished successfully!");
        fetchData();
      } else {
        alert(data.message || "Scraping failed");
      }
    } catch {
      alert("Network error while scraping");
    } finally {
      setIsScraping(false);
    }
  };

  // Delete FAQ
  const handleDelete = async (faqId) => {
    if (!window.confirm("Delete this FAQ from the knowledge base?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:5000/api/v1";

      await fetch(`${API_BASE}/admin/organizations/${orgId}/faqs/${faqId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setFaqs((prev) => prev.filter((f) => f._id !== faqId));
    } catch {
      alert("Failed to delete item");
    }
  };

  // Filtering & Pagination
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

  const handleToggleChip = async (faqId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:5000/api/v1";

      const res = await fetch(
        `${API_BASE}/admin/organizations/${orgId}/faqs/${faqId}/toggle-chip`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();

      if (data.success) {
        setFaqs((prev) =>
          prev.map((f) =>
            f._id === faqId ? { ...f, isDefaultChip: !f.isDefaultChip } : f,
          ),
        );
      }
    } catch (err) {
      alert("Failed to update chip status");
    }
  };
  const exportFaqsToDoc = (orgName = "Organisation", faqList = []) => {
    if (!faqList || faqList.length === 0) {
      alert("No FAQ entries to export.");
      return;
    }

    // Build clean HTML formatted specifically for Microsoft Word
    const itemsHtml = faqList
      .map(
        (item, idx) => `
       <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
         <h3 style="color: #1e293b; font-size: 14pt; margin: 0 0 8px 0; font-family: Calibri, Arial, sans-serif;">
           ${idx + 1}. ${item.question}
         </h3>
         <p style="color: #334155; font-size: 11pt; line-height: 1.6; margin: 0 0 10px 0; font-family: Calibri, Arial, sans-serif;">
           <strong>Answer:</strong> ${item.answer}
         </p>
         ${
           item.keywords && item.keywords.length > 0
             ? `<p style="color: #64748b; font-size: 9.5pt; margin: 0; font-family: Calibri, Arial, sans-serif;">
                 <em>Tags: #${item.keywords.join(", #")}</em>
                </p>`
             : ""
         }
       </div>
     `,
      )
      .join("");

    const docContent = `
     <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
       <head>
         <meta charset='utf-8'>
         <title>${orgName} Knowledge Base FAQs</title>
         <style>
           body { font-family: Calibri, Arial, sans-serif; padding: 30px; }
           h1 { color: #2563eb; font-size: 20pt; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 6px; }
           .meta { font-size: 10pt; color: #64748b; margin-bottom: 25px; }
         </style>
       </head>
       <body>
         <h1>${orgName} - Chatbot Knowledge Base</h1>
         <div class="meta">
           Total Q&As: <strong>${faqList.length}</strong> | Exported on: ${new Date().toLocaleDateString("en-GB")}
         </div>
         ${itemsHtml}
       </body>
     </html>
   `;

    // Create Word Document blob with official Word MIME type
    const blob = new Blob(["\ufeff", docContent], {
      type: "application/msword;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `${orgName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Knowledge_Base.doc`;

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Knowledge Base & Training
              </h1>
              <p className="text-xs text-slate-500">
                Organisation:{" "}
                <strong className="text-blue-600">
                  {org?.name || "Loading..."}
                </strong>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Trained Q&As:
            <span className="text-slate-900 font-bold px-2">{faqs.length}</span>
            <button
              onClick={() => exportFaqsToDoc(org?.name, faqs)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition shadow-xs"
              title="Export all FAQs to Microsoft Word Document"
            >
              <FileDown size={14} />
              <span>Export to Word (.doc)</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Add New & Auto-Train Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* Auto Scrape Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <Sparkles size={18} />
                <h2 className="text-sm font-bold text-slate-900">
                  AI Website Crawler
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Enter your website URL. The AI will crawl internal pages and
                auto-generate clean Q&A pairs directly into your database.
              </p>

              <form onSubmit={handleScrape} className="space-y-3">
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500">
                  <Globe size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="url"
                    required
                    placeholder="https://yourwebsite.com"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    className="w-full text-xs bg-transparent outline-none text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isScraping}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isScraping ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Globe size={14} />
                  )}
                  <span>
                    {isScraping
                      ? "Crawling & Synthesizing..."
                      : "Start Auto-Train"}
                  </span>
                </button>
              </form>
            </div>

            {/* Manual Form Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-1">
                Add Custom Q&A
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Manually train exact business policies, custom replies, or
                special offers.
              </p>

              <form onSubmit={handleAddFaq} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Client Question
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What is your refund or warranty policy?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Bot Response
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a clear, direct answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Search Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="refund, return, warranty, policy"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span>
                    {submitting ? "Saving..." : "Add to Knowledge Base"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Searchable Paginated FAQ List */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-2.5">
              <Search size={16} className="text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Search across questions, answers, or tags..."
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

            {/* List */}
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <Loader2
                  size={24}
                  className="animate-spin mx-auto mb-2 text-blue-600"
                />
                Loading FAQs...
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <HelpCircle
                  size={32}
                  className="mx-auto mb-2 opacity-30 text-slate-600"
                />
                {searchQuery
                  ? "No matching questions found."
                  : "No FAQs in the database yet."}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedFaqs.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xs font-bold text-slate-900 leading-snug">
                          Q: {item.question}
                        </h3>
                        {/* Action Icons: Edit Pencil & Delete Trash */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleChip(item._id)}
                            title={
                              item.isDefaultChip
                                ? "Remove from default chips"
                                : "Pin as default chip in widget"
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isDefaultChip
                                ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                                : "text-slate-300 hover:text-amber-500 hover:bg-slate-50"
                            }`}
                          >
                            <Star
                              size={14}
                              fill={
                                item.isDefaultChip ? "currentColor" : "none"
                              }
                            />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Question & Answer"
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            title="Delete FAQ"
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        <strong className="text-slate-700">A:</strong>{" "}
                        {item.answer}
                      </p>
                    </div>

                    {item.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                        {item.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between text-xs text-slate-600">
                <div>
                  Page{" "}
                  <span className="font-semibold text-slate-900">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {totalPages}
                  </span>
                  <span className="text-slate-400 ml-2">
                    ({filteredFaqs.length} total)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
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
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT MODAL POPUP */}
      {editingFaq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Pencil size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Edit Q&A Entry
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
                  Client Question
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
                  Bot Response
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
                  Keywords (comma-separated tags)
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
    </div>
  );
}
