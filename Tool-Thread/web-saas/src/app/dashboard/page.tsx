"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import {
  Activity, Crown, Zap, TrendingUp, ShieldCheck, Loader2, AlertCircle, ChevronRight, Download, Link2, Copy, CheckCircle2, Rocket, Bot, Code,
  Video, MessageSquare, Image as ImageIcon, Send
} from "lucide-react";
import Link from "next/link";
import ConfettiCanvas from "../../components/ConfettiCanvas";

const cardClass = "bg-white rounded-[32px] border-none shadow-none";

const TIER_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  gradient?: string;
}> = {
  free: { label: "FREE", color: "text-zinc-500", bg: "bg-zinc-100", icon: Activity },
  lite: { label: "LITE", color: "text-emerald-700", bg: "bg-emerald-50/50", icon: Zap },
  plus: { label: "PLUS", color: "text-blue-700", bg: "bg-blue-50/50", icon: Zap },
  pro: { label: "PRO", color: "text-amber-700", bg: "bg-amber-50/50", icon: Crown },
  promax: { label: "PROMAX", color: "text-white", bg: "bg-gradient-to-r from-violet-600 to-pink-500", icon: Crown },
};

function UsageBar({ label, icon: Icon, used, limit, color, autoEnabled, onToggle, updating }: { label: string; icon: React.ElementType; used: number; limit: number; color: string; autoEnabled?: boolean; onToggle?: () => void; updating?: boolean }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 100 : limit <= 0 ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = !isUnlimited && pct >= 80;

  return (
    <div>
      <div className="relative flex items-center justify-between text-sm mb-2">
        <span className="flex items-center gap-2 font-medium text-zinc-700">
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
          {label}
        </span>
        <div className="flex items-center gap-3">
          <span className={`font-bold ${isNearLimit ? "text-red-500" : isUnlimited ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500" : "text-zinc-900"}`}>
            {isUnlimited ? `${used.toLocaleString()} (Không giới hạn)` : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
          </span>
        </div>
        {onToggle && <button type="button" onClick={onToggle} disabled={updating} aria-label={`Bật tắt tự động ${label}`} className={`ml-3 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold transition-all md:absolute md:-right-20 md:top-[-4px] ${autoEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50"} ${updating ? "cursor-wait opacity-50" : ""}`}><Zap className="h-3 w-3" />{autoEnabled ? "Auto" : "Tắt"}</button>}
      </div>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isUnlimited ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" : isNearLimit ? "bg-red-500" : color
          }`}
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
    fb_story_posted: Math.max(toCount(stats?.fb_story_posted), toCount(stats?.fb_posts_count)),
    threads_posts_count: toCount(stats?.threads_posts_count),
    fb_comments_count: toCount(stats?.fb_comments_count), // Số phiên rải link FB Comment
    crawls_count: toCount(stats?.crawls_count),
    parse_links_count: toCount(stats?.parse_links_count),
  };
}

function normalizeLimits(limits: any, tier: string) {
  return {
    ...(limits || {}),
    reels_per_day: toCount(limits?.reels_per_day),
    fb_comments_per_day: tier === 'promax' ? -1 : tier === 'pro' ? 6 : tier === 'plus' ? 4 : tier === 'lite' ? 2 : 1,
    threads_per_day: toCount(limits?.threads_per_day),
    fb_story_per_day: toCount(limits?.fb_story_per_day ?? limits?.fb_post_per_day),
    threads_post_per_day: toCount(limits?.threads_post_per_day ?? limits?.reels_per_day),
    price_vnd: toCount(limits?.price_vnd),
    crawl_per_day: toCount(limits?.crawl_per_day),
    max_links: toCount(limits?.max_links),
  };
}

let globalCache: any = null;

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(globalCache?.profile || null);
  const [limits, setLimits] = useState<any>(globalCache?.limits || null);
  const [todayStats, setTodayStats] = useState<any>(globalCache?.todayStats || null);
  const [loading, setLoading] = useState(!globalCache);
  const [error, setError] = useState<string | null>(null);
  const [autoSettings, setAutoSettings] = useState<Record<string, boolean>>({});
  const [updatingAuto, setUpdatingAuto] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Chưa đăng nhập"); setLoading(false); return; }

        const today = todayLocalDate();

        // Load profile + today stats song song. Select * để hỗ trợ cả schema cũ/mới.
        const [profileRes, statsRes] = await Promise.all([
          supabase.from("profiles").select("tier, email, fb_cookie, threads_cookie, credits, parsed_affiliate_links").eq("id", user.id).maybeSingle(),
          supabase.from("usage_stats")
            .select("*")
            .eq("user_id", user.id)
            .eq("date", today)
            .maybeSingle()
        ]);

        if (profileRes.error) throw profileRes.error;
        if (statsRes.error) throw statsRes.error;

        const tier = profileRes.data?.tier || "free";
        setProfile(profileRes.data);

        // Lấy giới hạn từ tier_limits
        const limitsRes = await supabase.from("tier_limits").select("*").eq("tier", tier).maybeSingle();
        if (limitsRes.error) throw limitsRes.error;
        const limitsData = normalizeLimits(limitsRes.data, tier);
        const statsData = normalizeStats(statsRes.data);
        statsData.parse_links_count = profileRes.data?.parsed_affiliate_links?.length || 0;

        globalCache = {
          profile: profileRes.data,
          limits: limitsData,
          todayStats: statsData
        };

        setLimits(limitsData);
        setTodayStats(statsData);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch("/api/auto-bots", { headers: { Authorization: `Bearer ${session.access_token}` } });
          if (res.ok) setAutoSettings((await res.json()).settings || {});
        }
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
      const channelName = `realtime_usage_dashboard_${user.id}_${Date.now()}`;
      channel = supabase.channel(channelName)
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

  const toggleAuto = async (key: string) => {
    const enabled = autoSettings[key] === false;
    setUpdatingAuto(key);
    setAutoSettings(prev => ({ ...prev, [key]: enabled }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auto-bots", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` }, body: JSON.stringify({ key, enabled }) });
      if (!res.ok) throw new Error("Không lưu được cấu hình tự động");
      setAutoSettings((await res.json()).settings || {});
    } catch (e) {
      setAutoSettings(prev => ({ ...prev, [key]: !enabled }));
      setError(e instanceof Error ? e.message : "Không lưu được cấu hình tự động");
    } finally {
      setUpdatingAuto(null);
    }
  };

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
    <div className="h-full overflow-y-auto p-4 md:p-8 xl:p-12 xl:pt-16 relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ConfettiCanvas />
      </div>
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 relative z-10">

        {/* Welcome Banner */}
        <div className={`rounded-[32px] overflow-hidden relative border-none bg-gradient-to-br from-indigo-50/90 via-white/80 to-blue-50/90 p-8 md:p-12 shadow-[0_8px_32px_-12px_rgba(59,130,246,0.15)]`}>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-gray-900 leading-tight flex flex-wrap items-center justify-center gap-2 md:gap-3">
            Chào mừng đến với AutoFarm 
            <img src="/rocket_logo.png" alt="AutoFarm" className="inline-block w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-sm hover:scale-110 transition-transform origin-bottom" />
          </h1>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-8">
              Hệ thống tự động hóa đa nền tảng giúp bạn quản lý Threads, Facebook Reels và Shopee một cách dễ dàng.
              Cấu hình Bot một lần và để hệ thống tự động cày view, tương tác và đăng bài mỗi ngày.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard/accounts" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-[0_4px_20px_-4px_rgba(79,70,229,0.5)] hover:shadow-[0_8px_25px_-4px_rgba(79,70,229,0.6)] flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Thiết lập Bot
              </Link>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute right-0 bottom-0 p-8 opacity-5 pointer-events-none mix-blend-multiply">
            <Rocket className="w-64 h-64 rotate-12 text-indigo-600" />
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
          <div className="bg-white border border-amber-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Bạn chưa cấu hình Cookie!</h3>
                <p className="text-sm text-zinc-500 mt-0.5">Bot không thể hoạt động nếu thiếu Cookie. Hãy làm theo 3 bước sau để lấy Cookie Threads an toàn.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">1</div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-2">Cài Extension</h4>
                <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                  Cài đặt tiện ích <strong>EditThisCookie (V3)</strong> hoặc J2TEAM Security trên Chrome.
                </p>
                <a href="https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                  <Download className="w-3.5 h-3.5" />
                  Tải EditThisCookie
                </a>
              </div>

              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">2</div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-2">Vào trang Threads</h4>
                <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                  Đăng nhập vào Threads web. Click vào icon tiện ích EditThisCookie.
                </p>
                <a href="https://www.threads.net" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 shadow-sm px-3 py-1.5 rounded-lg">
                  <Link2 className="w-3.5 h-3.5" />
                  Mở Threads.net
                </a>
              </div>

              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">3</div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-2">Lấy Session ID</h4>
                <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                  Tìm dòng <strong>sessionid</strong>, copy toàn bộ đoạn mã trong ô "Giá trị" và dán vào cài đặt.
                </p>
                <Link href="/dashboard/accounts" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-sm">
                  <Copy className="w-3.5 h-3.5" />
                  Nhập Cookie ngay
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center w-full">
          {/* Usage Today */}
          <div className="w-full max-w-3xl space-y-6">

            {/* Usage Today */}
            <div className={`${cardClass} p-6 md:p-8 flex flex-col`}>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Hoạt động hôm nay</h3>
                <span className="ml-auto text-[11px] font-mono font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">{new Date().toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="space-y-5">
                <UsageBar
                  label="Up Reels (Video/ngày)"
                  icon={Zap}
                  used={todayStats?.reels_posted || 0}
                  limit={limits?.reels_per_day ?? 1}
                  color="bg-zinc-900"
                  autoEnabled={autoSettings.reels !== false} onToggle={() => toggleAuto("reels")} updating={updatingAuto === "reels"}
                />
                <UsageBar
                  label="FB Comment (Số phiên/ngày)"
                  icon={MessageSquare}
                  used={todayStats?.fb_comments_count || 0}
                  limit={limits?.fb_comments_per_day ?? 1}
                  color="bg-zinc-900"
                  autoEnabled={autoSettings.fb_comment !== false} onToggle={() => toggleAuto("fb_comment")} updating={updatingAuto === "fb_comment"}
                />
                <UsageBar
                  label="Threads đã Comment"
                  icon={MessageSquare}
                  used={todayStats?.threads_commented || 0}
                  limit={limits?.threads_per_day ?? 10}
                  color="bg-zinc-900"
                  autoEnabled={autoSettings.threads_comment !== false} onToggle={() => toggleAuto("threads_comment")} updating={updatingAuto === "threads_comment"}
                />
                <UsageBar
                  label="FB Post đã đăng"
                  icon={Send}
                  used={todayStats?.fb_story_posted || 0}
                  limit={limits?.fb_story_per_day ?? limits?.fb_post_per_day ?? 0}
                  color="bg-zinc-900"
                  autoEnabled={autoSettings.fb_post !== false} onToggle={() => toggleAuto("fb_post")} updating={updatingAuto === "fb_post"}
                />
                <UsageBar
                  label="Threads Post đã đăng"
                  icon={Send}
                  used={todayStats?.threads_posts_count || 0}
                  limit={limits?.threads_post_per_day ?? 0}
                  color="bg-zinc-900"
                  autoEnabled={autoSettings.threads_post !== false} onToggle={() => toggleAuto("threads_post")} updating={updatingAuto === "threads_post"}
                />
                <UsageBar
                  label="Data Shopee (Link đã lưu)"
                  icon={Code}
                  used={todayStats?.parse_links_count || 0}
                  limit={limits?.max_links || 4}
                  color="bg-zinc-900"
                />
                <UsageBar
                  label="Cào Threads (lần/ngày)"
                  icon={Bot}
                  used={todayStats?.crawls_count || 0}
                  limit={limits?.crawl_per_day || 1}
                  color="bg-zinc-900"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
