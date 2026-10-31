import React from "react";

export default function StatsCard({
  label,
  value,
  subtext,
  icon: Icon,
  color = "blue",
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}
