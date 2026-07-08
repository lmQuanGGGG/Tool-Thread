"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import {
  Activity, Crown, Zap, TrendingUp, Video, MessageSquare, Image,
  ShieldCheck, Loader2, AlertCircle, ChevronRight
} from "lucide-react";
import Link from "next/link";

const TIER_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  gradient?: string;
}> = {
  free:    { label: "FREE",    color: "text-zinc-500",  bg: "bg-zinc-100",   icon: Activity },
  lite:    { label: "LITE",    color: "text-emerald-700", bg: "bg-emerald-50", icon: Zap },
  plus:    { label: "PLUS",    color: "text-blue-700",  bg: "bg-blue-50",    icon: Zap },
  pro:     { label: "PRO",     color: "text-amber-700", bg: "bg-amber-50",   icon: Crown },
  promax:  { label: "PROMAX",  color: "text-white",     bg: "bg-gradient-to-r from-violet-600 to-pink-500", icon: Crown },
};

function UsageBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 20 : limit <= 0 ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = !isUnlimited && pct >= 80;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className={`font-bold ${isNearLimit ? "text-red-500" : "text-zinc-900"}`}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isNearLimit ? "bg-red-500" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function todayLocalDate() {
  return new Date().toLocaleDateString("en-CA");
}

function toCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeStats(stats: any) {
  return {
    reels_posted: toCount(stats?.reels_posted),
    threads_commented: toCount(stats?.threads_commented),
    fb_story_posted: toCount(stats?.fb_story_posted ?? stats?.fb_posts_count),
  };
}

function normalizeLimits(limits: any) {
  return {
    ...(limits || {}),
    reels_per_day: toCount(limits?.reels_per_day),
    threads_per_day: toCount(limits?.threads_per_day),
    fb_story_per_day: toCount(limits?.fb_story_per_day ?? limits?.fb_post_per_day),
    price_vnd: toCount(limits?.price_vnd),
  };
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Chưa đăng nhập"); setLoading(false); return; }

        const today = todayLocalDate();

        // Load profile + today stats song song. Select * để hỗ trợ cả schema cũ/mới.
        const [profileRes, statsRes] = await Promise.all([
          supabase.from("profiles").select("tier, email, fb_cookie, threads_cookie, credits").eq("id", user.id).maybeSingle(),
          supabase.from("usage_stats")
            .select("*")
            .eq("user_id", user.id)
            .eq("date", today)
            .maybeSingle(),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (statsRes.error) throw statsRes.error;

        const tier = profileRes.data?.tier || "free";
        setProfile(profileRes.data);

        // Lấy giới hạn từ tier_limits
        const limitsRes = await supabase.from("tier_limits").select("*").eq("tier", tier).maybeSingle();
        if (limitsRes.error) throw limitsRes.error;
        setLimits(normalizeLimits(limitsRes.data));
        setTodayStats(normalizeStats(statsRes.data));
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Không tải được dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    }

    async function verifyPayment() {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const orderCode = params.get('orderCode');
      const paymentStatus = params.get('payment');
      const cancel = params.get('cancel');

      if (orderCode && paymentStatus === 'success' && cancel !== 'true') {
        try {
          console.log("Verifying payment locally for orderCode:", orderCode);
          await fetch("/api/payos/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderCode })
          });
          // Remove query params to clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error("Local payment verification failed", err);
        }
      }
    }

    verifyPayment().then(() => {
      loadData();
    });

    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase.channel('realtime_usage_dashboard')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'usage_stats', 
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          const today = todayLocalDate();
          if (payload.new && (payload.new as any).date === today) {
            setTodayStats(normalizeStats(payload.new));
          }
        })
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const tier = profile?.tier || "free";
  const tierConf = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConf.icon;
  const hasCookie = !!(profile?.fb_cookie || profile?.threads_cookie);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 xl:p-12 xl:pt-16">
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">

      {/* Header */}
      <div>
        <p className="text-zinc-500 text-sm mb-1">Xin chào,</p>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${tierConf.bg} ${tierConf.color} shadow-sm`}>
            <TierIcon className="w-3 h-3" />
            {tierConf.label}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {/* Warning nếu chưa cài Cookie */}
      {!hasCookie && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <p>Bạn chưa cấu hình Cookie! Bot sẽ không chạy được.&nbsp;
            <Link href="/dashboard/accounts" className="font-bold underline underline-offset-2">Cài đặt ngay →</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

        {/* LEFT - Usage today */}
        <div className="lg:col-span-7 space-y-6">

          {/* Usage Today */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm shadow-zinc-200/50">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-zinc-900">Hoạt động hôm nay</h3>
              <span className="ml-auto text-xs text-zinc-400">{new Date().toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="space-y-5">
              <UsageBar
                label="📹 FB Reels đã đăng"
                used={todayStats?.reels_posted || 0}
                limit={limits?.reels_per_day ?? 1}
                color="bg-violet-500"
              />
              <UsageBar
                label="💬 Threads đã Comment"
                used={todayStats?.threads_commented || 0}
                limit={limits?.threads_per_day ?? 10}
                color="bg-blue-500"
              />
              <UsageBar
                label="📝 FB Post đã đăng"
                used={todayStats?.fb_story_posted || 0}
                limit={limits?.fb_story_per_day ?? limits?.fb_post_per_day ?? 0}
                color="bg-pink-500"
              />
              <UsageBar
                label="🧵 Threads Post đã đăng"
                used={todayStats?.threads_posts_count || 0}
                limit={limits?.threads_post_per_day ?? 0}
                color="bg-emerald-500"
              />
            </div>
          </div>

          {/* Active Bots */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm shadow-zinc-200/50">
            <h3 className="font-semibold text-zinc-900 mb-5">Đội quân Bot</h3>
            <div className="space-y-3">
              {[
                { name: "Auto Clone Reels (YT → FB)", desc: "Tải Shorts rồi đăng lên Reels", icon: Video, enabled: !!profile?.fb_cookie, color: "text-violet-600" },
                { name: "Auto Comment Threads", desc: "Rải link Affiliate tự động", icon: MessageSquare, enabled: !!profile?.threads_cookie, color: "text-blue-600" },
                { name: "FB Auto Post Shopee", desc: "Đăng bài bán hàng lên FB", icon: Image, enabled: !!profile?.fb_cookie, color: "text-pink-600" },
              ].map((bot) => (
                <div key={bot.name} className={`flex items-center gap-4 border rounded-2xl px-5 py-4 transition-all ${bot.enabled ? "border-zinc-100 bg-white" : "border-dashed border-zinc-200 bg-zinc-50/50"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bot.enabled ? "bg-zinc-100" : "bg-zinc-100/50"}`}>
                    <bot.icon className={`w-4 h-4 ${bot.enabled ? bot.color : "text-zinc-300"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${bot.enabled ? "text-zinc-900" : "text-zinc-400"}`}>{bot.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{bot.desc}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${bot.enabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                    {bot.enabled ? "Sẵn sàng" : "Cần Cookie"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT - Tier card + upsell */}
        <div className="lg:col-span-5 space-y-6">

          {/* Current Plan */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm shadow-zinc-200/50">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-zinc-900">Gói hiện tại</h3>
            </div>

            <div className={`mt-5 rounded-2xl p-5 ${tier === "promax" ? "bg-gradient-to-br from-violet-600 to-pink-500 text-white" : tier === "pro" ? "bg-amber-50" : tier === "plus" ? "bg-blue-50" : tier === "lite" ? "bg-emerald-50" : "bg-zinc-50"}`}>
              <div className={`text-3xl font-black tracking-tight mb-1 ${tier === "promax" ? "text-white" : "text-zinc-900"}`}>
                {tierConf.label}
              </div>
              <div className={`text-sm ${tier === "promax" ? "text-white/80" : "text-zinc-500"}`}>
                {limits?.price_vnd === 0 ? "Miễn phí" : `${(limits?.price_vnd || 0).toLocaleString("vi-VN")}đ / tháng`}
              </div>
              <div className={`mt-4 text-xs font-medium space-y-1.5 ${tier === "promax" ? "text-white/90" : "text-zinc-600"}`}>
                <div>📹 Reels: {limits?.reels_per_day === -1 ? "Không giới hạn" : `${limits?.reels_per_day} video/ngày`}</div>
                <div>💬 Comment: {limits?.threads_per_day === -1 ? "Không giới hạn" : `${limits?.threads_per_day} bài/ngày`}</div>
                <div>🤖 Chạy tự động: {limits?.auto_run ? "✅ Có" : "❌ Phải bấm tay"}</div>
              </div>
            </div>

            {/* Upsell nếu không phải promax */}
            {tier !== "promax" && (
              <Link
                href="/pricing"
                className="mt-4 flex items-center justify-between w-full bg-black text-white font-bold text-xs tracking-wider py-3.5 px-5 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <span>⚡ Nâng cấp gói</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm shadow-zinc-200/50">
            <h3 className="font-semibold text-zinc-900 mb-4">Truy cập nhanh</h3>
            <div className="space-y-2">
              {[
                { label: "Cài đặt Cookie & Config", href: "/dashboard/accounts", desc: "Quản lý tài khoản" },
                { label: "Thống kê Chi tiết", href: "/dashboard/analytics", desc: "Xem báo cáo" },
                { label: "Xem gói dịch vụ", href: "/pricing", desc: "Nâng cấp tài khoản" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200 transition-all group"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                    <div className="text-xs text-zinc-400">{item.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}
