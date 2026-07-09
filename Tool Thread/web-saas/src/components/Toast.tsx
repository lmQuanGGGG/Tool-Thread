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
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        toast.visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-700 max-w-sm">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
        <button
          onClick={() => setToast((prev) => (prev ? { ...prev, visible: false } : null))}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors ml-2"
        >
          <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
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
