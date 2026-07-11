"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import { Loader2, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfettiCanvas from "../../components/ConfettiCanvas";
import { showToast } from "@/components/Toast";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Supabase automatically parses the access token from the URL hash and sets the session
  // So we just need to call updateUser() to set the new password

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }
      
      setSuccess(true);
      showToast("Khôi phục mật khẩu thành công!");
      
      // Tự động chuyển về login sau 2 giây
      setTimeout(() => {
        router.push("/dashboard/accounts");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <ConfettiCanvas />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-zinc-100 text-center relative z-10">
        
        <Link href="/" className="inline-block font-bold text-[28px] tracking-tight mb-8 hover:opacity-80 transition-opacity">
          AutoFarm<span className="text-blue-600">.</span>
        </Link>
        
        <h1 className="text-[24px] font-bold text-zinc-900 mb-3 tracking-tight">Đặt mật khẩu mới</h1>
        <p className="text-[14.5px] text-zinc-500 mb-10 leading-relaxed">
          Sếp vui lòng nhập mật khẩu mới bảo mật hơn nhé.
        </p>

        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 text-emerald-700 text-[14px] font-medium rounded-2xl border border-emerald-100/50 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p>Thành công!</p>
              <p className="text-[13px] text-emerald-600 font-normal">Đang chuyển hướng vào hệ thống...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5 text-left">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[13px] font-medium rounded-2xl border border-red-100/50">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-zinc-900 mb-2">Mật khẩu mới</label>
              <input 
                type="password" 
                name="password"
                required
                minLength={6}
                className="w-full bg-[#f4f4f5] border-transparent rounded-[16px] px-5 py-4 text-[14px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition-all placeholder:text-zinc-400 outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-zinc-900 mb-2">Xác nhận mật khẩu</label>
              <input 
                type="password" 
                name="confirmPassword"
                required
                minLength={6}
                className="w-full bg-[#f4f4f5] border-transparent rounded-[16px] px-5 py-4 text-[14px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition-all placeholder:text-zinc-400 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white font-semibold text-[14.5px] py-4 rounded-full flex items-center justify-center gap-2 hover:bg-black hover:shadow-xl hover:shadow-zinc-900/20 transition-all disabled:opacity-50 mt-8"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Đổi mật khẩu & Đăng nhập</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
