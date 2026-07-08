"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Network, LineChart, Rocket, CircleDollarSign, Bot,
  Crown, Zap, Activity, ChevronRight, ChevronLeft, PanelLeft, Search, LogOut
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
  { name: "Dashboard",    href: "/dashboard",          icon: LayoutDashboard, adminOnly: false },
  { name: "Bots & Config", href: "/dashboard/accounts", icon: Bot,             adminOnly: false },
  { name: "Analytics",    href: "/dashboard/analytics", icon: LineChart,       adminOnly: true  },
  { name: "Pricing",      href: "/pricing",             icon: CircleDollarSign, adminOnly: false },
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
    threads_post_per_day: toCount(limits?.fb_story_per_day ?? limits?.fb_post_per_day),
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tier, setTier] = useState<string>("free");
  const [limits, setLimits] = useState<any>(null);
  const [used, setUsed] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let currentUser: any = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      currentUser = user;
      setUser(user);
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
    <>
    <div className="flex min-h-screen bg-white">
      {/* Aurora */}
      <div className="aurora-bg opacity-30"><div className="aurora-blob-3" /></div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col bg-white/95 backdrop-blur-3xl border-r border-zinc-100/80 transition-all duration-300 w-[280px] max-md:shadow-2xl ${mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"} ${collapsed ? "md:w-[64px]" : "md:w-[256px]"}`}
      >
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-md text-gray-500 hover:text-gray-900 transition-all hover:scale-110"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 ml-0.5" /> : <ChevronLeft className="w-3.5 h-3.5 pr-0.5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center px-4 pt-6 pb-6 shrink-0 min-h-[80px] hover:opacity-80 transition-opacity">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? "md:w-0 md:opacity-0 md:hidden" : "w-full opacity-100"}`}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div className="whitespace-nowrap">
              <h1 className="font-semibold text-sm text-gray-900 tracking-tight leading-tight">Automation Hub</h1>
              <p className="text-[9px] font-medium text-gray-400 tracking-wider uppercase">V3.5</p>
            </div>
          </div>
          {collapsed && (
            <div className="hidden md:flex w-8 h-8 rounded-lg bg-blue-600 items-center justify-center text-white shadow-sm mx-auto shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-hidden">
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
            if (item.href === "/pricing") {
              return (
                <button
                  key={item.name}
                  onClick={() => setPricingOpen(true)}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900`}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className={`ml-3 font-medium text-[13px] whitespace-nowrap transition-all duration-300 ${collapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100"}`}>
                    {item.name}
                  </span>
                </button>
              );
            }

            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${active ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50" : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 font-medium"}`}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"}`} />
                <span className={`ml-3 text-[13px] whitespace-nowrap transition-all duration-300 ${collapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100"}`}>
                  {item.name}
                </span>
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Area */}
        <div className="p-3 border-t border-zinc-100 space-y-2">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden">
              <img src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? "md:opacity-0 md:w-0 md:hidden" : "w-full opacity-100"}`}>
              <p className="text-[12px] font-semibold text-gray-900 truncate pr-2">{user?.email}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <TierIcon className={`w-3 h-3 ${meta.color}`} />
                <span className={`text-[10px] font-bold ${meta.color} uppercase tracking-wider`}>{meta.label}</span>
              </div>
            </div>
          </div>

          {/* Usage Mini Widget */}
          <div className={`bg-gray-50 rounded-2xl p-3 border border-gray-100 ${collapsed ? "md:hidden" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Hôm nay</span>
              </div>
              {limits && used && (
                <div className="space-y-3">
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
            <button onClick={() => setPricingOpen(true)} className={`flex items-center justify-between w-full bg-gray-900 text-white font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-gray-800 transition-colors group ${collapsed ? "md:hidden" : ""}`}>
              <span>⚡ Nâng cấp gói</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all" />
            </button>
          )}

          <button 
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} 
            className={`flex items-center justify-between w-full bg-red-50 text-red-600 font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-red-100 transition-colors group ${collapsed ? "md:px-0 md:justify-center" : ""}`}
          >
            <span className={`${collapsed ? "md:hidden" : ""}`}>Đăng xuất</span>
            <LogOut className={`w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all`} />
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${collapsed ? "md:pl-[64px]" : "md:pl-[256px]"}`}>
        {/* Mobile Top Nav */}
        <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-zinc-200/50 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900 tracking-tight">Automation Hub</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="flex-1 z-10 overflow-hidden">{children}</div>
      </main>
    </div>

    {/* Pricing Modal — render ngoài layout để overlay toàn màn hình */}
    <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}
