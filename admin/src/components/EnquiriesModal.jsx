import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function EnquiriesModal({ org, onClose }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE}/admin/organizations/${org._id}/enquiries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error("Failed to load enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [org._id]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                Customer Enquiries
              </h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {org.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Messages and leads captured by the AI chatbot widget
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEnquiries}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Refresh Enquiries"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Enquiries List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              Loading enquiries...
            </div>
          ) : enquiries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <MessageSquare size={36} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">
                No enquiries captured yet
              </p>
              <p className="text-[11px] mt-1">
                Leads submitted via your chatbot widget will appear here.
              </p>
            </div>
          ) : (
            enquiries.map((enquiry) => (
              <div
                key={enquiry._id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 shadow-xs transition space-y-3"
              >
                {/* Top Row: Name, Tag & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
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

                {/* Contact Meta Details */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
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
                      className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
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

                {/* Message Body */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {enquiry.message}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>
            Total: <strong>{enquiries.length}</strong> enquiry(ies)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
