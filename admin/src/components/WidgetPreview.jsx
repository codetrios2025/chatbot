import React from "react";
import { Send, X, Bot } from "lucide-react";

export default function WidgetPreview({ branding = {} }) {
  const {
    themeColor = "#2563EB",
    botName = "Support Assistant",
    welcomeMessage = "Hello! Let us know how we can assist you today.",
    logoUrl = "",
  } = branding;

  return (
    <div className="w-[300px] rounded-2xl shadow-xl border border-slate-200 bg-white flex flex-col overflow-hidden text-xs">
      {/* Dynamic Header */}
      <div
        style={{ backgroundColor: themeColor }}
        className="p-3.5 text-white flex items-center justify-between transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Brand Logo"
              className="w-6 h-6 rounded-full bg-white object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={14} />
            </div>
          )}
          <span className="font-semibold truncate max-w-[170px]">
            {botName || "Support Bot"}
          </span>
        </div>
        <X size={16} className="opacity-80 cursor-pointer" />
      </div>

      {/* Simulated Body */}
      <div className="p-3 bg-slate-50 flex-1 space-y-2.5 min-h-[200px]">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 max-w-[85%] text-slate-800 shadow-2xs leading-relaxed">
          {welcomeMessage || "How can we help?"}
        </div>
        <div
          style={{ backgroundColor: themeColor }}
          className="text-white rounded-xl p-2.5 max-w-[85%] ml-auto text-right shadow-2xs"
        >
          What are your plans?
        </div>
      </div>

      {/* Mock Chat Input */}
      <div className="p-2 border-t border-slate-100 bg-white flex items-center space-x-1.5">
        <input
          type="text"
          readOnly
          placeholder="Ask a question..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400 outline-none"
        />
        <div
          style={{ backgroundColor: themeColor }}
          className="p-1.5 rounded-lg text-white flex items-center justify-center shrink-0"
        >
          <Send size={12} />
        </div>
      </div>
    </div>
  );
}
