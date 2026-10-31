import React, { useState } from "react";
import { Copy, Check, X } from "lucide-react";

export default function EmbedCodeModal({ snippet, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-slate-800">
            Integration Snippet
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Provide this script to the organization’s engineering team. Paste
          inside the <code>&lt;head&gt;</code> or bottom of the{" "}
          <code>&lt;body&gt;</code> tag.
        </p>

        <div className="relative">
          <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-xs overflow-x-auto font-mono">
            {snippet}
          </pre>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
