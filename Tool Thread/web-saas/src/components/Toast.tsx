"use client";

import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";

export function Toast() {
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);

  useEffect(() => {
    const handleShowToast = (e: any) => {
      setToast({ message: e.detail.message, visible: true });
      setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null));
      }, 3000);
    };

    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  if (!toast) return null;

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
        <div className="absolute inset-[-100%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#10b981_100%)]"></div>
        
        {/* Inner Content */}
        <div className="relative bg-white/95 backdrop-blur-2xl text-gray-800 px-4 py-3 rounded-[14.5px] flex items-center gap-3 w-full h-full">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-blue-50">
            <img src="/rocket_logo.png" alt="Logo" className="w-full h-full object-cover" />
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
export const showToast = (message: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message } }));
  }
};
