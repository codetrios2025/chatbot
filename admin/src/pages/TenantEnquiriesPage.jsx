import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Building,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

export default function TenantEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tenantToken");
      const res = await fetch(`${API_BASE}/tenant/enquiries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const filteredEnquiries = enquiries.filter((enq) => {
    const q = search.toLowerCase();
    return (
      enq.name?.toLowerCase().includes(q) ||
      enq.email?.toLowerCase().includes(q) ||
      enq.phone?.toLowerCase().includes(q) ||
      enq.company?.toLowerCase().includes(q) ||
      enq.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Customer Enquiries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visitor enquiries and lead messages handled directly by your AI
            chatbot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-56 bg-white"
            />
          </div>
          <button
            onClick={fetchEnquiries}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Leads"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          Loading your enquiries...
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <MessageSquare size={36} className="text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">
            No customer enquiries found
          </p>
          <p className="text-slate-400 mt-1">
            When website visitors fill in the chatbot lead form, their details
            will display here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEnquiries.map((enquiry) => (
            <div
              key={enquiry._id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition space-y-3.5"
            >
              {/* Top row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-slate-800">
                    {enquiry.name}
                  </span>
                  {enquiry.serviceInterest && (
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-blue-200/60">
                      {enquiry.serviceInterest}
                    </span>
                  )}
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border border-amber-200/60">
                    {enquiry.status || "NEW"}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(enquiry.createdAt).toLocaleString("en-GB")}
                </span>
              </div>

              {/* Contact meta */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                <a
                  href={`mailto:${enquiry.email}`}
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Mail size={13} className="text-slate-400" />
                  {enquiry.email}
                </a>

                {enquiry.phone && (
                  <a
                    href={`tel:${enquiry.phone}`}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900"
                  >
                    <Phone size={13} className="text-slate-400" />
                    {enquiry.phone}
                  </a>
                )}

                {enquiry.company && (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Building size={13} className="text-slate-400" />
                    {enquiry.company}
                  </span>
                )}
              </div>

              {/* Message text */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {enquiry.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
