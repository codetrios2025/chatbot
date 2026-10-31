import React, { useState, useEffect } from "react";
import { X, Plus, HelpCircle, Globe, Loader2 } from "lucide-react";
import { adminApi } from "../api/client";

export default function FAQModal({ org, onClose }) {
  const [faqs, setFaqs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-scrape URL state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const fetchOrgFAQs = async () => {
    try {
      const res = await adminApi.fetchFAQs(org._id);
      if (res.success) setFaqs(res.data || []);
    } catch (err) {
      console.error("Error fetching FAQs:", err);
    }
  };

  useEffect(() => {
    fetchOrgFAQs();
  }, [org._id]);

  // Handle Manual Q&A submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || !answer) return;

    setLoading(true);
    const keywordArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const res = await adminApi.createFAQ(org._id, {
        question,
        answer,
        keywords: keywordArray,
      });
      if (res.success) {
        setFaqs((prev) => [...prev, res.data]);
        setQuestion("");
        setAnswer("");
        setKeywords("");
      }
    } catch (err) {
      alert(err.message || "Failed to add FAQ");
    } finally {
      setLoading(false);
    }
  };

  // Handle Automatic Website Scraping & Training
  const handleScrapeWebsite = async (e) => {
    e.preventDefault();
    if (!scrapeUrl) return;

    setIsScraping(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:5000/api/v1";

      const res = await fetch(
        `${API_BASE}/admin/organizations/${org._id}/scrape`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ websiteUrl: scrapeUrl, maxPages: 5 }),
        },
      );
      const data = await res.json();

      if (data.success) {
        alert(data.message || "Website indexed successfully!");
        setScrapeUrl("");
        fetchOrgFAQs(); // Refresh the list with newly generated FAQs
      } else {
        alert(data.message || "Scraping failed");
      }
    } catch (err) {
      alert("Network error while running website scraper.");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Knowledge Base
            </h3>
            <p className="text-xs text-slate-500">
              Configuring automatic Q&A for {org.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Website Auto-Train Bar */}
        <form
          onSubmit={handleScrapeWebsite}
          className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 mt-3 flex items-center gap-2"
        >
          <Globe size={18} className="text-blue-600 shrink-0" />
          <input
            type="url"
            required
            placeholder="https://example.com (Auto-crawl & build FAQs)"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isScraping}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isScraping ? <Loader2 size={13} className="animate-spin" /> : null}
            {isScraping ? "Crawling..." : "Auto-Train"}
          </button>
        </form>

        {/* Existing FAQ List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {faqs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <HelpCircle size={28} className="mx-auto mb-1.5 opacity-40" />
              No questions entered yet for this organisation.
            </div>
          ) : (
            faqs.map((item) => (
              <div
                key={item._id}
                className="p-3 border border-slate-200/80 rounded-xl bg-slate-50/60 text-xs"
              >
                <p className="font-semibold text-slate-900">
                  Q: {item.question}
                </p>
                <p className="text-slate-600 mt-1">A: {item.answer}</p>
                {item.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Manual Add FAQ form */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-100 pt-3 space-y-2.5"
        >
          <input
            type="text"
            required
            placeholder="User Query (e.g. What is your return window?)"
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <textarea
            required
            rows={2}
            placeholder="Bot Response"
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <input
            type="text"
            placeholder="Keywords (comma-separated, e.g. returns, refund, policy)"
            className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Done
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 inline-flex items-center gap-1"
            >
              <Plus size={14} />
              {loading ? "Saving..." : "Add Q&A"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
