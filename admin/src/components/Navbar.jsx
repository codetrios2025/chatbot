import React from "react";
import { Bot, Plus, LogOut, Shield, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Navbar({ onOpenCreate }) {
  const { user, logout } = useAuth();
  const [showPassModal, setShowPassModal] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Admin Console
            </h1>
            <p className="text-xs text-slate-500">
              Multi-tenant AI Assistant Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User profile details */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <Shield size={14} className="text-blue-600" />
              <span className="font-semibold text-slate-700">{user.name}</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase font-bold">
                {user.role}
              </span>
            </div>
          )}

          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-xs transition"
          >
            <Plus size={16} />
            <span>Add Org</span>
          </button>
          <button
            onClick={() => setShowPassModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Lock size={13} />
            <span>Password</span>
          </button>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200"
          >
            <LogOut size={16} />
          </button>

          {showPassModal && (
            <ChangePasswordModal
              onClose={() => setShowPassModal(false)}
              isTenant={false}
            />
          )}
        </div>
      </div>
    </header>
  );
}
