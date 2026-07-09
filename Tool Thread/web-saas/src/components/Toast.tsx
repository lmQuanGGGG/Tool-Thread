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
      className={`fixed top-1/2 left-1/2 z-50 transition-all duration-400 ease-out transform ${
        toast.visible 
          ? "-translate-x-1/2 -translate-y-1/2 scale-100 opacity-100" 
          : "-translate-x-1/2 translate-y-4 scale-95 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white/95 backdrop-blur-2xl text-gray-800 px-5 py-4 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col items-center gap-3 border border-gray-100/80 min-w-[320px] max-w-sm text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-blue-50">
          <img src="/rocket_logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <p className="text-[15px] font-semibold leading-snug">{toast.message}</p>
        
        <button
          onClick={() => setToast((prev) => (prev ? { ...prev, visible: false } : null))}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center shrink-0 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
        </button>
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
