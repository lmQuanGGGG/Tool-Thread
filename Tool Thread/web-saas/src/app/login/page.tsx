"use client";

import { useState } from "react";
import { supabase } from "../../utils/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
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
        if (!ipRes.ok) {
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-zinc-100 text-center">
        
        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <span className="font-bold text-lg">AF</span>
        </div>
        
        <h1 className="text-2xl font-bold text-black mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Đăng nhập hoặc tự động tạo tài khoản mới để vào AutoFarm Hub.
        </p>

        <form onSubmit={handleAuth} className="space-y-4 text-left">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-[13px] font-medium rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
              placeholder="admin@autofarm.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold text-[13px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-md mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Secure Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
