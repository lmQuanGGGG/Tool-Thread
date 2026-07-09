"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, LineChart, Rocket, CircleDollarSign, Bot,
  Crown, Zap, Activity, ChevronRight, ChevronLeft, LogOut, X, Menu
} from "lucide-react";
import { supabase } from "../../utils/supabase";
import PricingModal from "../../components/PricingModal";

// Dark theme meta (mobile drawer)
const TIER_META_DARK: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  free:   { label: "Free",   icon: Activity, color: "text-gray-400"   },
  lite:   { label: "Lite",   icon: Zap,      color: "text-emerald-400" },
  plus:   { label: "Plus",   icon: Zap,      color: "text-blue-400"   },
  pro:    { label: "Pro",    icon: Crown,    color: "text-amber-400"  },
  promax: { label: "ProMax", icon: Crown,    color: "text-violet-400" },
};

// Light theme meta (desktop sidebar)
const TIER_META_LIGHT: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  free:   { label: "Free",   icon: Activity, color: "text-gray-500"    },
  lite:   { label: "Lite",   icon: Zap,      color: "text-emerald-600" },
  plus:   { label: "Plus",   icon: Zap,      color: "text-blue-600"    },
  pro:    { label: "Pro",    icon: Crown,    color: "text-amber-600"   },
  promax: { label: "ProMax", icon: Crown,    color: "text-violet-600"  },
};

const ADMIN_EMAIL = "lmquang.devops@gmail.com";

const NAV_ITEMS = [
  { name: "Dashboard",    href: "/dashboard",          icon: LayoutDashboard,  adminOnly: false },
  { name: "Bots & Config", href: "/dashboard/accounts", icon: Bot,              adminOnly: false },
  { name: "Analytics",    href: "/dashboard/analytics", icon: LineChart,        adminOnly: true  },
  { name: "Pricing",      href: "/pricing",             icon: CircleDollarSign, adminOnly: false },
];

function todayLocalDate() {
  return new Date().toLocaleDateString("en-CA");
}
function toCount(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function normalizeUsage(s: any) {
  return {
    reels_posted:      toCount(s?.reels_posted),
    threads_commented: toCount(s?.threads_commented),
    fb_story_posted:   Math.max(toCount(s?.fb_story_posted), toCount(s?.fb_posts_count)),
  };
}
function normalizeLimits(l: any) {
  return {
    ...(l || {}),
    reels_per_day:        toCount(l?.reels_per_day),
    threads_per_day:      toCount(l?.threads_per_day),
    fb_story_per_day:     toCount(l?.fb_story_per_day ?? l?.fb_post_per_day),
    threads_post_per_day: toCount(l?.fb_story_per_day ?? l?.fb_post_per_day),
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [tier, setTier]               = useState<string>("free");
  const [limits, setLimits]           = useState<any>(null);
  const [used, setUsed]               = useState<any>(null);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [user, setUser]               = useState<any>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      setIsAdmin(user.email === ADMIN_EMAIL);
      const today = todayLocalDate();
      Promise.all([
        supabase.from("usage_stats").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("profiles").select("tier").eq("id", user.id).maybeSingle(),
      ]).then(([statsRes, profileRes]) => {
        const t = profileRes.data?.tier || "free";
        setTier(t);
        setUsed(normalizeUsage(statsRes.data));
        supabase.from("tier_limits").select("*").eq("tier", t).maybeSingle()
          .then(({ data }) => setLimits(normalizeLimits(data)));
      });

      const chName = `realtime_layout_${user.id}_${Date.now()}`;
      channel = supabase.channel(chName)
        .on("postgres_changes", { event: "*", schema: "public", table: "usage_stats", filter: `user_id=eq.${user.id}` }, (p) => {
          const today = todayLocalDate();
          if (p.new && (p.new as any).date === today) setUsed(normalizeUsage(p.new));
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (p) => {
          if (p.new && (p.new as any).tier) {
            const nt = (p.new as any).tier;
            setTier(nt);
            supabase.from("tier_limits").select("*").eq("tier", nt).maybeSingle()
              .then(({ data }) => setLimits(normalizeLimits(data)));
          }
        })
        .subscribe();
    });
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const metaDark  = TIER_META_DARK[tier]  || TIER_META_DARK.free;
  const metaLight = TIER_META_LIGHT[tier] || TIER_META_LIGHT.free;
  const isPro = tier === "pro" || tier === "promax";

  const getThreadsPostLimit = (t: string) => {
    if (t === 'promax') return -1;
    if (t === 'pro') return 15;
    if (t === 'plus') return 6;
    if (t === 'lite') return 3;
    if (t === 'free') return 1;
    return 3;
  };

  const usageRows = [
    { label: "Reels",    used: used?.reels_posted || 0,       limit: limits?.reels_per_day,    color: "bg-blue-500"   },
    { label: "Comment",  used: used?.threads_commented || 0,  limit: limits?.threads_per_day,  color: "bg-violet-500" },
    { label: "FB Post",  used: used?.fb_story_posted || 0,    limit: limits?.fb_story_per_day, color: "bg-amber-500"  },
    { label: "Th. Post", used: used?.threads_posts_count || 0, limit: getThreadsPostLimit(tier), color: "bg-pink-500" },
  ];

  const avatarUrl = user?.user_metadata?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || "U")}&background=2563eb&color=fff`;

  return (
    <>
    <div className="flex min-h-screen bg-white">
      <div className="aurora-bg opacity-30"><div className="aurora-blob-3" /></div>

      {/* MOBILE DRAWER — Backdrop (chỉ render khi mở, không block content khi đóng) */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[99]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER — Panel (luôn render nhưng slide qua transform) */}
      <div className={`md:hidden fixed inset-y-0 left-0 w-[300px] bg-white flex flex-col shadow-2xl z-[100] transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
                <Rocket className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900 tracking-tight leading-tight">Automation Hub</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">V3.5</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
              if (item.href === "/pricing") {
                return (
                  <button
                    key={item.name}
                    onClick={() => { setPricingOpen(true); setMobileOpen(false); }}
                    className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-[0.98]"
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0 text-gray-400" />
                    <span className="text-[15px] font-medium">{item.name}</span>
                  </button>
                );
              }
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="text-[15px]">{item.name}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 pb-8 pt-4 border-t border-gray-100 space-y-3">
            {/* Usage widget */}
            {limits && used && (
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Hôm nay</p>
                <div className="space-y-3">
                  {usageRows.map(({ label, used: u, limit: l, color }) => {
                    const unlimited = l === -1;
                    const remaining = unlimited ? "∞" : Math.max(0, l - u);
                    const pct = unlimited ? 12 : l === 0 ? 100 : Math.min(100, (u / l) * 100);
                    const nearLimit = !unlimited && l > 0 && pct >= 80;
                    return (
                      <div key={label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[11px] text-gray-400">{label}</span>
                          <span className={`text-[11px] font-semibold ${nearLimit ? "text-red-500" : "text-gray-500"}`}>
                            {l === 0 ? "—" : unlimited ? "∞" : `còn ${remaining}`}
                          </span>
                        </div>
                        {l !== 0 && (
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${nearLimit ? "bg-red-500" : color}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upgrade */}
            {tier !== "promax" && (
              <button
                onClick={() => { setPricingOpen(true); setMobileOpen(false); }}
                className="flex items-center justify-between w-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-white font-semibold text-[13px] py-3.5 px-4 rounded-2xl transition-colors group"
              >
                <span>⚡ Nâng cấp gói</span>
                <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}

            {/* User + Logout row */}
            <div className="flex items-center gap-3 px-1 py-1">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-900 truncate">{user?.email}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <metaLight.icon className={`w-3 h-3 ${metaLight.color}`} />
                  <span className={`text-[10px] font-bold ${metaLight.color} uppercase tracking-wider`}>{metaLight.label}</span>
                </div>
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
      </div>

      {/* ═══════════════════════════
          DESKTOP SIDEBAR — white/light
          ═══════════════════════════ */}
      <aside className={`hidden md:flex fixed top-0 left-0 h-screen z-40 flex-col bg-white/95 backdrop-blur-3xl border-r border-zinc-100/80 transition-all duration-300 ${collapsed ? "w-[64px]" : "w-[256px]"}`}>
        {/* Collapse btn */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-900 transition-all hover:scale-110"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 ml-0.5" /> : <ChevronLeft className="w-3.5 h-3.5 pr-0.5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center px-4 pt-6 pb-6 shrink-0 min-h-[80px] hover:opacity-80 transition-opacity">
          {!collapsed ? (
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Rocket className="w-4 h-4" />
              </div>
              <div className="whitespace-nowrap">
                <h1 className="font-semibold text-sm text-gray-900 tracking-tight leading-tight">Automation Hub</h1>
                <p className="text-[9px] font-medium text-gray-400 tracking-wider uppercase">V3.5</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm mx-auto">
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
                  className="flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span className="ml-3 font-medium text-[13px] whitespace-nowrap">{item.name}</span>}
                </button>
              );
            }
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50"
                    : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 font-medium"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"}`} />
                {!collapsed && <span className="ml-3 text-[13px] whitespace-nowrap">{item.name}</span>}
                {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        {!collapsed ? (
          <div className="p-3 border-t border-zinc-100 space-y-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden border border-white shadow-sm">
                <img src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || "U")}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[12px] font-semibold text-gray-900 truncate">{user?.email}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <metaLight.icon className={`w-3 h-3 ${metaLight.color}`} />
                  <span className={`text-[10px] font-bold ${metaLight.color} uppercase tracking-wider`}>{metaLight.label}</span>
                </div>
              </div>
            </div>

            {limits && used && (
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase block mb-3">Hôm nay</span>
                <div className="space-y-3">
                  {usageRows.map(({ label, used: u, limit: l, color }) => {
                    const unlimited = l === -1;
                    const remaining = unlimited ? "∞" : Math.max(0, l - u);
                    const pct = unlimited ? 12 : l === 0 ? 100 : Math.min(100, (u / l) * 100);
                    const nearLimit = !unlimited && l > 0 && pct >= 80;
                    return (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
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
            )}

            {tier !== "promax" && (
              <button onClick={() => setPricingOpen(true)} className="flex items-center justify-between w-full bg-gray-900 text-white font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-gray-800 transition-colors group">
                <span>⚡ Nâng cấp gói</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </button>
            )}

            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              className="flex items-center justify-between w-full bg-red-50 text-red-600 font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-red-100 transition-colors group"
            >
              <span>Đăng xuất</span>
              <LogOut className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-zinc-100">
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              title="Đăng xuất"
              className="flex items-center justify-center w-full py-2.5 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${collapsed ? "md:pl-[64px]" : "md:pl-[256px]"}`}>
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-zinc-200/40 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[14px] text-gray-900 tracking-tight">Automation Hub</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Dot grid bg */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="flex-1 z-10">{children}</div>
      </main>
    </div>

    <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}
