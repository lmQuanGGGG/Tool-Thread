"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid, Network, BarChart, Rocket, CreditCard, Video,
  Crown, Zap, Activity, ChevronRight, PanelLeft, Search, LogOut
} from "lucide-react";
import { supabase } from "../../utils/supabase";
import PricingModal from "../../components/PricingModal";

const TIER_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  free:   { label: "Free",   icon: Activity, color: "text-gray-500", bg: "bg-gray-100" },
  lite:   { label: "Lite",   icon: Zap,      color: "text-emerald-600", bg: "bg-emerald-50" },
  plus:   { label: "Plus",   icon: Zap,      color: "text-blue-600", bg: "bg-blue-50" },
  pro:    { label: "Pro",    icon: Crown,    color: "text-amber-600", bg: "bg-amber-50" },
  promax: { label: "ProMax", icon: Crown,    color: "text-violet-600", bg: "bg-violet-50" },
};

const ADMIN_EMAIL = "lmquang.devops@gmail.com";

const NAV_ITEMS = [
  { name: "Dashboard",    href: "/dashboard",          icon: Grid,       adminOnly: false },
  { name: "Bots & Config", href: "/dashboard/accounts", icon: Video,      adminOnly: false },
  { name: "Analytics",    href: "/dashboard/analytics", icon: BarChart,   adminOnly: true  },
  { name: "Pricing",      href: "/pricing",             icon: CreditCard, adminOnly: false },
];

const SIDEBAR_W = 256;

function todayLocalDate() {
  return new Date().toLocaleDateString("en-CA");
}

function toCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeUsage(stats: any) {
  return {
    reels_posted: toCount(stats?.reels_posted),
    threads_commented: toCount(stats?.threads_commented),
    fb_story_posted: Math.max(toCount(stats?.fb_story_posted), toCount(stats?.fb_posts_count)),
  };
}

function normalizeLimits(limits: any) {
  return {
    ...(limits || {}),
    reels_per_day: toCount(limits?.reels_per_day),
    threads_per_day: toCount(limits?.threads_per_day),
    fb_story_per_day: toCount(limits?.fb_story_per_day ?? limits?.fb_post_per_day),
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tier, setTier] = useState<string>("free");
  const [limits, setLimits] = useState<any>(null);
  const [used, setUsed] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let currentUser: any = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      currentUser = user;
      setIsAdmin(user.email === ADMIN_EMAIL);
      const today = todayLocalDate();
      Promise.all([
        supabase.from("usage_stats")
          .select("*")
          .eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("profiles")
          .select("tier")
          .eq("id", user.id).maybeSingle()
      ]).then(([statsRes, profileRes]) => {
        const t = profileRes.data?.tier || "free";
        setTier(t);
        setUsed(normalizeUsage(statsRes.data));
        supabase.from("tier_limits")
          .select("*")
          .eq("tier", t).maybeSingle()
          .then(({ data }) => setLimits(normalizeLimits(data)));
      });

      // Lắng nghe realtime — dùng tên channel động để tránh lỗi trùng khi Strict Mode re-mount
      const channelName = `realtime_usage_profile_${user.id}_${Date.now()}`;
      channel = supabase.channel(channelName)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'usage_stats', 
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          const today = todayLocalDate();
          if (payload.new && (payload.new as any).date === today) {
            setUsed(normalizeUsage(payload.new));
          }
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${user.id}` 
        }, (payload) => {
          if (payload.new && (payload.new as any).tier) {
            const newTier = (payload.new as any).tier;
            setTier(newTier);
            supabase.from("tier_limits")
              .select("*")
              .eq("tier", newTier).maybeSingle()
              .then(({ data }) => setLimits(normalizeLimits(data)));
          }
        })
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const meta = TIER_META[tier] || TIER_META.free;
  const TierIcon = meta.icon;
  const isPro = tier === "pro" || tier === "promax";

  return (
    <div className="flex min-h-screen bg-[#F7F7F8]">
      {/* Aurora */}
      <div className="aurora-bg"><div className="aurora-blob-3" /></div>

      {/* ===== SIDEBAR ===== */}
      <aside
        className="fixed top-0 left-0 h-screen z-30 flex flex-col bg-white border-r border-gray-200/80 transition-all duration-300"
        style={{ width: collapsed ? 64 : SIDEBAR_W }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-6 pb-6 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-full opacity-100"}`}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div className="whitespace-nowrap">
              <h1 className="font-semibold text-sm text-gray-900 tracking-tight leading-tight">Automation Hub</h1>
              <p className="text-[9px] font-medium text-gray-400 tracking-wider uppercase">V3.5</p>
            </div>
          </div>
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm mx-auto">
              <Rocket className="w-4 h-4" />
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0">
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-hidden">
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
            // Pricing dùng modal thay vì navigate
            if (item.href === "/pricing") {
              return (
                <button
                  key={item.name}
                  onClick={() => setPricingOpen(true)}
                  title={collapsed ? item.name : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-gray-500 hover:text-gray-900 hover:bg-gray-50 ${
                    collapsed ? "justify-center !px-0 w-9 h-9 mx-auto" : ""
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </button>
              );
            }
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  collapsed ? "justify-center !px-0 w-9 h-9 mx-auto" : ""
                } ${
                  isActive
                    ? "text-blue-600 bg-blue-50 font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 pb-4 space-y-2 shrink-0">
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="w-9 h-9 mx-auto rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <PanelLeft className="w-4 h-4 rotate-180" />
            </button>
          ) : (
            <>
              <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${meta.bg}`}>
                      <TierIcon className={`w-3 h-3 ${meta.color}`} />
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-gray-400 leading-none">Gói hiện tại</p>
                      <p className={`text-xs font-bold ${meta.color} mt-0.5`}>{meta.label}</p>
                    </div>
                  </div>
                  <Link href="/pricing" className="text-[10px] text-blue-600 font-semibold hover:underline whitespace-nowrap">Xem gói →</Link>
                </div>

                {limits && used && (
                  <div className="space-y-2 border-t border-gray-100 pt-2.5">
                    {[
                      { label: "Reels", used: used.reels_posted || 0, limit: limits.reels_per_day, color: "bg-blue-500" },
                      { label: "Comment", used: used.threads_commented || 0, limit: limits.threads_per_day, color: "bg-violet-500" },
                      { label: "FB Post", used: used.fb_story_posted || 0, limit: limits.fb_story_per_day, color: "bg-amber-500" },
                    ].map(({ label, used: u, limit: l, color }) => {
                      const unlimited = l === -1;
                      const remaining = unlimited ? "∞" : Math.max(0, l - u);
                      const pct = unlimited ? 12 : l === 0 ? 100 : Math.min(100, (u / l) * 100);
                      const nearLimit = !unlimited && l > 0 && pct >= 80;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400">{label}</span>
                            <span className={`text-[10px] font-semibold ${nearLimit ? "text-red-500" : "text-gray-500"}`}>
                              {l === 0 ? "—" : unlimited ? "∞" : `còn ${remaining}`}
                            </span>
                          </div>
                          {l !== 0 && (
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${nearLimit ? "bg-red-500" : color}`} style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-2 text-[9px] leading-relaxed">
                  {isPro
                    ? <span className="text-emerald-600 font-medium">✅ Bot chạy tự động hàng ngày</span>
                    : <span className="text-gray-400">
                        {tier === "free" && "Nâng cấp để bot tự động!"}
                        {tier === "lite" && "Nâng Plus để tự động mỗi ngày!"}
                        {tier === "plus" && "Nâng Pro để tăng gấp đôi giới hạn."}
                      </span>
                  }
                </div>
              </div>

              {tier !== "promax" && (
                <Link href="/pricing" className="flex items-center justify-between w-full bg-gray-900 text-white font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-gray-800 transition-colors group">
                  <span>⚡ Nâng cấp gói</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all" />
                </Link>
              )}
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} 
                className="flex items-center justify-between w-full bg-red-50 text-red-600 font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-red-100 transition-colors group"
              >
                <span>Đăng xuất</span>
                <LogOut className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300" style={{ marginLeft: collapsed ? 64 : SIDEBAR_W }}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="fixed top-5 z-40 w-7 h-7 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all" style={{ left: 72 }}>
            <PanelLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}
        <div className="flex-1 z-10 overflow-hidden">{children}</div>
      </main>
    </div>

    {/* Pricing Modal — render ngoài layout để overlay toàn màn hình */}
    <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
  );
}
