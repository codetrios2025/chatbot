import React, { useState } from "react";
import { X, CreditCard, Check, Loader2, Calendar } from "lucide-react";

export default function PaymentModal({ org, onClose, onPaymentSuccess }) {
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [durationDays, setDurationDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000/api/v1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_BASE}/admin/organizations/${org._id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            transactionId,
            paymentMethod,
            durationDays: Number(durationDays),
            notes,
          }),
        },
      );

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        onPaymentSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to record payment");
      }
    } catch {
      setError("Network connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Upgrade / Renew Plan
              </h3>
              <p className="text-xs text-slate-500">
                {org.name} ({org.adminEmail})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="2999"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Duration
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
              >
                <option value="30">1 Month (30 Days)</option>
                <option value="90">3 Months (90 Days)</option>
                <option value="180">6 Months (180 Days)</option>
                <option value="365">1 Year (365 Days)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer">NEFT / RTGS / IMPS</option>
                <option value="Stripe">Card / Stripe</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                UTR / Transaction ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UPI/40281982736"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Notes / Invoice Ref (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #2026-088 verified"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>
                {loading ? "Activating..." : "Activate & Extend Plan"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
