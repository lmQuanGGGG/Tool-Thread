"use client";

import { useState } from "react";
import { supabase } from "../../utils/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getDeviceFingerprint } from "../../utils/fingerprint";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Thử đăng nhập trước
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Nếu lỗi là do sai tài khoản (hoặc chưa có tài khoản), thử Đăng ký
        if (signInError.message.includes("Invalid login credentials")) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (signUpError) {
            throw signUpError;
          }
          
          if (!signUpData.session) {
            throw new Error("Tài khoản đã được tạo nhưng Supabase đang yêu cầu xác minh Email. Vui lòng vào Cài đặt Supabase tắt 'Confirm Email' hoặc kiểm tra hộp thư của sếp!");
          }
          
          alert("Đã tự động tạo tài khoản mới cho sếp!");
        } else {
          throw signInError;
        }
      }

      // 2. Kiểm tra giới hạn IP + Device Fingerprint — tối đa 2 tài khoản
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Thu thập fingerprint của thiết bị đang đăng nhập
        const fingerprint = await getDeviceFingerprint().catch(() => undefined);
        const ipRes = await fetch('/api/auth/verify-ip', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fingerprint }),
        });
        if (ipRes.status === 403) {
          const ipData = await ipRes.json();
          // Vượt giới hạn → kick ngay, không cho vào dashboard
          await supabase.auth.signOut();
          throw new Error(ipData.error || 'Thiết bị/mạng của bạn đã đạt giới hạn số tài khoản.');
        }
      }

      // 3. Chuyển hướng vào Dashboard
      router.push("/dashboard/accounts");
      router.refresh(); // Force refresh to update layout auth states if any
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi kết nối với Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-zinc-100 text-center relative z-10">
        
        <Link href="/" className="inline-block font-bold text-[28px] tracking-tight mb-8 hover:opacity-80 transition-opacity">
          AutoFarm<span className="text-blue-600">.</span>
        </Link>
        
        <h1 className="text-[24px] font-bold text-zinc-900 mb-3 tracking-tight">Chào mừng sếp trở lại</h1>
        <p className="text-[14.5px] text-zinc-500 mb-10 leading-relaxed">
          Đăng nhập hoặc nhập mật khẩu mới để hệ thống tự động tạo tài khoản.
        </p>

        <form onSubmit={handleAuth} className="space-y-5 text-left">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-[13px] font-medium rounded-2xl border border-red-100/50">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold text-zinc-900 mb-2">Địa chỉ Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#f4f4f5] border-transparent rounded-[16px] px-5 py-4 text-[14px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition-all placeholder:text-zinc-400 outline-none"
              placeholder="admin@autofarm.com"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-zinc-900 mb-2">Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
                <span>Đăng nhập an toàn</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
