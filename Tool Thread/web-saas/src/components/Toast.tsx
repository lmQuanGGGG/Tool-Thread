"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

export type ToastType = 'success' | 'error' | 'info';

export function Toast() {
  const [toast, setToast] = useState<{ message: string; visible: boolean; type: ToastType } | null>(null);

  useEffect(() => {
    const handleShowToast = (e: any) => {
      setToast({ message: e.detail.message, type: e.detail.type || 'info', visible: true });
      setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null));
      }, 3000);
    };

    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  if (!toast) return null;

  const gradientColors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6"
  };

  const bgColors = {
    success: "bg-emerald-50",
    error: "bg-red-50",
    info: "bg-blue-50"
  };

  const gradientColor = gradientColors[toast.type] || gradientColors.info;
  const iconBg = bgColors[toast.type] || bgColors.info;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-out transform ${
        toast.visible 
          ? "translate-y-0 opacity-100" 
          : "-translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden p-[1.5px] min-w-[300px] max-w-sm">
        {/* Animated Spinning Border */}
        <div className="absolute inset-[-100%] animate-[spin_2s_linear_infinite]" style={{ background: `conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 70%, ${gradientColor} 100%)` }}></div>
        
        {/* Inner Content */}
        <div className="relative bg-white/95 backdrop-blur-2xl text-gray-800 px-4 py-3 rounded-[14.5px] flex items-center gap-3 w-full h-full">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${iconBg}`}>
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {toast.type === 'info' && <img src="/rocket_logo.png" alt="Logo" className="w-full h-full object-cover" />}
          </div>
          <p className="text-[14px] font-semibold leading-snug flex-1">{toast.message}</p>
          
          <button
            onClick={() => setToast((prev) => (prev ? { ...prev, visible: false } : null))}
            className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center shrink-0 transition-colors ml-1"
          >
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to trigger toast
export const showToast = (message: string, type: ToastType = 'info') => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message, type } }));
  }
};
