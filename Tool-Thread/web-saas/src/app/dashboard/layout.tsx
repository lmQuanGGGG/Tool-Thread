"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, LineChart, Rocket, CircleDollarSign, Bot,
  Crown, Zap, Activity, ChevronRight, ChevronLeft, LogOut, LogIn, X, Menu, BarChart3
} from "lucide-react";
import { supabase } from "../../utils/supabase";
import PricingModal from "../../components/PricingModal";
import { showToast } from "../../components/Toast";

// Dark theme meta (mobile drawer)
const TIER_META_DARK: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  free: { label: "Free", icon: Activity, color: "text-gray-400" },
  lite: { label: "Lite", icon: Zap, color: "text-emerald-400" },
  plus: { label: "Plus", icon: Zap, color: "text-blue-400" },
  pro: { label: "Pro", icon: Crown, color: "text-amber-400" },
  promax: { label: "ProMax", icon: Crown, color: "text-violet-400" },
};

// Light theme meta (desktop sidebar)
const TIER_META_LIGHT: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  free: { label: "Free", icon: Activity, color: "text-gray-500" },
  lite: { label: "Lite", icon: Zap, color: "text-emerald-600" },
  plus: { label: "Plus", icon: Zap, color: "text-blue-600" },
  pro: { label: "Pro", icon: Crown, color: "text-amber-600" },
  promax: { label: "ProMax", icon: Crown, color: "text-violet-600" },
};

const ADMIN_EMAIL = "lmquang.devops@gmail.com";

const NAV_ITEMS = [
  { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { name: "Quản lý Bots", href: "/dashboard/accounts", icon: Bot, adminOnly: false },
  { name: "Thống kê", href: "/dashboard/stats", icon: BarChart3, adminOnly: false },
  { name: "Thống kê Admin", href: "/dashboard/analytics", icon: LineChart, adminOnly: true },
  { name: "Bảng giá", href: "/pricing", icon: CircleDollarSign, adminOnly: false },
];

function todayLocalDate() {
  return new Date().toLocaleDateString("en-CA");
}
function toCount(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function normalizeUsage(s: any) {
  return {
    reels_posted: toCount(s?.reels_posted),
    fb_comments_count: toCount(s?.fb_comments_count),
    threads_commented: toCount(s?.threads_commented),
    fb_story_posted: Math.max(toCount(s?.fb_story_posted), toCount(s?.fb_posts_count)),
    threads_posts_count: toCount(s?.threads_posts_count),
    crawls_count: toCount(s?.crawls_count),
    parse_links_count: toCount(s?.parse_links_count),
  };
}
function normalizeLimits(l: any, tier: string) {
  return {
    ...(l || {}),
    reels_per_day: toCount(l?.reels_per_day),
    fb_comments_per_day: tier === 'promax' ? -1 : tier === 'pro' ? 6 : tier === 'plus' ? 4 : tier === 'lite' ? 2 : 1,
    threads_per_day: toCount(l?.threads_per_day),
    fb_story_per_day: toCount(l?.fb_story_per_day ?? l?.fb_post_per_day),
    threads_post_per_day: toCount(l?.threads_post_per_day ?? l?.reels_per_day),
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
  const [giftModal, setGiftModal] = useState<{show: boolean, comments: number, tier: string} | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const toastedLimits = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      setIsAdmin(user.email === ADMIN_EMAIL);
      const today = todayLocalDate();
      Promise.all([
        supabase.from("usage_stats").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("profiles").select("tier, parsed_affiliate_links").eq("id", user.id).maybeSingle()
      ]).then(([statsRes, profileRes]) => {
        const t = profileRes.data?.tier || "free";
        setTier(t);
        
        if (sessionStorage.getItem('new_account') === 'true') {
          setTimeout(() => {
            showToast("🎉 Đã tự động tạo tài khoản mới cho sếp!");
          }, 500);
          sessionStorage.removeItem('new_account');
        } else if (sessionStorage.getItem('just_logged_in') === 'true') {
          setTimeout(() => {
            showToast(`👋 Chào mừng sếp trở lại!`);
          }, 500);
          sessionStorage.removeItem('just_logged_in');
        }

        if (!localStorage.getItem('gift_modal_dismissed') && !sessionStorage.getItem('gift_notified')) {
          let comments = 85;
          if (t === 'promax') comments = 510;
          else if (t === 'pro') comments = 340;
          else if (t === 'plus' || t === 'lite') comments = 170;

          setTimeout(() => {
            setGiftModal({ show: true, comments, tier: t });
          }, 1500);
          sessionStorage.setItem('gift_notified', 'true');
        }
        
        const stats = statsRes.data || {};
        stats.parse_links_count = profileRes.data?.parsed_affiliate_links?.length || 0;
        setUsed(normalizeUsage(stats));
        supabase.from("tier_limits").select("*").eq("tier", t).maybeSingle()
          .then(({ data }) => setLimits(normalizeLimits(data, t)));
      });

      const chName = `realtime_layout_${user.id}_${Date.now()}`;
      channel = supabase.channel(chName)
        .on("postgres_changes", { event: "*", schema: "public", table: "usage_stats", filter: `user_id=eq.${user.id}` }, (p) => {
          const today = todayLocalDate();
          if (p.new && (p.new as any).date === today) {
            setUsed((prev: any) => ({ ...normalizeUsage(p.new), parse_links_count: prev?.parse_links_count || 0 }));
          }
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (p) => {
          if (p.new) {
            if ((p.new as any).tier) {
              const nt = (p.new as any).tier;
              setTier(prev => {
                if (prev && prev !== nt) {
                  setTimeout(() => showToast(`🎉 Chúc mừng sếp! Đã nâng cấp thành công lên gói ${nt.toUpperCase()}!`), 0);
                }
                return nt;
              });
              supabase.from("tier_limits").select("*").eq("tier", nt).maybeSingle()
                .then(({ data }) => setLimits(normalizeLimits(data, nt)));
            }
            if ((p.new as any).parsed_affiliate_links !== undefined) {
              setUsed((prev: any) => ({ ...prev, parse_links_count: (p.new as any).parsed_affiliate_links?.length || 0 }));
            }
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "bot_logs", filter: `email=eq.${user.email}` }, (payload) => {
          const newLog = payload.new as any;
          if (newLog.level === 'success') {
            showToast(`${newLog.message}`);
          } else if (newLog.level === 'error') {
            showToast(`${newLog.message}`);
          } else if (newLog.message.toLowerCase().includes('hết hạn') || newLog.message.toLowerCase().includes('chết')) {
            // Cố tình vớt thêm các log bị đánh warn/info nhưng có nội dung cookie chết
            showToast(`${newLog.message}`);
          }
        })
        .subscribe();
    });
    
    const handleOpenPricing = () => setPricingOpen(true);
    window.addEventListener('open-pricing', handleOpenPricing);

    return () => { 
      if (channel) supabase.removeChannel(channel); 
      window.removeEventListener('open-pricing', handleOpenPricing);
    };
  }, []);

  // Monitor usage changes to show completion toasts
  useEffect(() => {
    if (!used || !limits) return;

    const keys = [
      { key: 'reels_posted', name: 'Đăng FB Reels', limit: limits.reels_per_day },
      { key: 'threads_commented', name: 'Auto Cmt Threads', limit: limits.threads_per_day },
      { key: 'threads_posts_count', name: 'Đăng bài Threads', limit: limits.threads_post_per_day },
      { key: 'fb_posts_count', name: 'Đăng bài Facebook', limit: limits.fb_post_per_day },
      { key: 'fb_comments_count', name: 'Auto Cmt mồi FB', limit: limits.fb_comments_per_day },
      { key: 'fb_story_posted', name: 'FB Post', limit: limits.fb_story_per_day }
    ];

    keys.forEach(({ key, name, limit }) => {
      if (limit !== -1 && limit > 0 && used[key] >= limit && !toastedLimits.current[key]) {
        toastedLimits.current[key] = true;
        showToast(`🎉 CHÚC MỪNG SẾP! Đã hoàn thành mục tiêu ${name} ngày hôm nay!`);
      }
    });
  }, [used, limits]);

  const metaDark = TIER_META_DARK[tier] || TIER_META_DARK.free;
  const metaLight = TIER_META_LIGHT[tier] || TIER_META_LIGHT.free;
  const isPro = tier === "pro" || tier === "promax";

  const getThreadsCrawlLimit = (t: string) => {
    if (t === 'promax') return 129;
    if (t === 'pro') return 59;
    if (t === 'plus') return 25;
    if (t === 'lite') return 12;
    return 5;
  };

  const usageRows = [
    { label: "Up Reels", used: used?.reels_posted || 0, limit: limits?.reels_per_day, color: "bg-zinc-900" },
    { label: "Cmt FB (Rải link)", used: used?.fb_comments_count || 0, limit: limits?.fb_comments_per_day, color: "bg-zinc-900" },
    { label: "Cmt Threads", used: used?.threads_commented || 0, limit: limits?.threads_per_day, color: "bg-zinc-900" },
    { label: "FB Post", used: used?.fb_story_posted || 0, limit: limits?.fb_story_per_day, color: "bg-zinc-900" },
    { label: "Th. Post", used: used?.threads_posts_count || 0, limit: limits?.threads_post_per_day, color: "bg-zinc-900" },
    { label: "Quét Shopee", used: used?.parse_links_count || 0, limit: limits?.max_links ?? -1, color: "bg-zinc-900" },
    { label: "Cào Threads (lần/ngày)", used: used?.crawls_count || 0, limit: limits?.crawl_per_day || 0, color: "bg-zinc-900" },
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
              <div className="w-9 h-9 rounded-[10px] overflow-hidden flex items-center justify-center shadow-sm">
                <img src="/rocket_logo.png" alt="AutoFarm" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900 tracking-tight leading-tight">AutoFarm</p>
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
              const active = item.href === "/dashboard" ? pathname === "/dashboard" : (pathname === item.href || pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] ${active
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
                    const pct = unlimited ? 100 : l === 0 ? 100 : Math.min(100, (u / l) * 100);
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
                            <div className={`h-full rounded-full transition-all duration-500 ${unlimited ? "bg-gradient-to-r from-purple-500 to-pink-500" : nearLimit ? "bg-red-500" : color}`} style={{ width: `${pct}%` }} />
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
                <p className="text-[12px] font-semibold text-gray-900 truncate">{user ? user.email : "Chưa đăng nhập"}</p>
                {user && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <metaLight.icon className={`w-3 h-3 ${metaLight.color}`} />
                    <span className={`text-[10px] font-bold ${metaLight.color} uppercase tracking-wider`}>{metaLight.label}</span>
                  </div>
                )}
              </div>
              {user ? (
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                </Link>
              )}
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
                <div className="w-8 h-8 rounded-[9px] overflow-hidden shadow-sm shrink-0">
                  <img src="/rocket_logo.png" alt="AutoFarm" className="w-full h-full object-cover" />
                </div>
                <div className="whitespace-nowrap">
                  <h1 className="font-semibold text-sm text-gray-900 tracking-tight leading-tight">AutoFarm</h1>
                  <p className="text-[9px] font-medium text-gray-400 tracking-wider uppercase">V3.5</p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-[9px] overflow-hidden shadow-sm mx-auto">
                <img src="/rocket_logo.png" alt="AutoFarm" className="w-full h-full object-cover" />
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
              const active = item.href === "/dashboard" ? pathname === "/dashboard" : (pathname === item.href || pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
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
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{user ? user.email : "Chưa đăng nhập"}</p>
                  {user && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <metaLight.icon className={`w-3 h-3 ${metaLight.color}`} />
                      <span className={`text-[10px] font-bold ${metaLight.color} uppercase tracking-wider`}>{metaLight.label}</span>
                    </div>
                  )}
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
                      ? <span className="text-emerald-600 font-medium">Bot chạy tự động hàng ngày</span>
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

              {user ? (
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                  className="flex items-center justify-between w-full bg-red-50 text-red-600 font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-red-100 transition-colors group"
                >
                  <span>Đăng xuất</span>
                  <LogOut className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-between w-full bg-blue-50 text-blue-600 font-semibold text-[11px] tracking-wide py-2.5 px-4 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <span>Đăng nhập</span>
                  <LogIn className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </Link>
              )}
            </div>
          ) : (
            <div className="p-3 border-t border-zinc-100">
              {user ? (
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                  title="Đăng xuất"
                  className="flex items-center justify-center w-full py-2.5 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/login"
                  title="Đăng nhập"
                  className="flex items-center justify-center w-full py-2.5 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${collapsed ? "md:pl-[64px]" : "md:pl-[256px]"}`}>
          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-zinc-200/40 px-4 py-3 sticky top-0 z-30">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-[7px] overflow-hidden shadow-sm shrink-0">
                <img src="/rocket_logo.png" alt="AutoFarm" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-[14px] text-gray-900 tracking-tight">AutoFarm</span>
            </Link>
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

      {/* Gift Modal */}
      {giftModal?.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setGiftModal(null)}></div>
          
          <div className="relative rounded-[24px] shadow-2xl overflow-hidden p-[2px] max-w-[380px] w-full transform transition-all duration-300 scale-100 opacity-100">
            {/* Animated Spinning Border (Green) */}
            <div className="absolute inset-[-100%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#10b981_100%)]"></div>
            
            <div className="relative bg-white rounded-[22px] p-7 w-full h-full">
              <button 
                onClick={() => {
                  if (dontShowAgain) localStorage.setItem('gift_modal_dismissed', 'true');
                  setGiftModal(null);
                }} 
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-16 h-16 bg-blue-50/80 rounded-[18px] flex items-center justify-center mx-auto mb-5 shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)] border border-blue-100/50 overflow-hidden">
                <img src="/rocket_logo.png" alt="AutoFarm Logo" className="w-full h-full object-cover" />
              </div>
              
              <h2 className="text-xl font-extrabold text-center text-gray-900 mb-2.5 tracking-tight">Quà Tặng Đặc Quyền!</h2>
              <p className="text-center text-gray-500 mb-6 text-[14px] leading-relaxed px-2">
                Cảm ơn sếp đã tin tưởng và đồng hành cùng <strong className="text-gray-700">AutoFarm</strong>! ❤️<br/><br/>
                Vì sếp đang sử dụng gói <span className="font-bold text-blue-600 uppercase tracking-wide">{giftModal.tier}</span>, hệ thống tặng riêng tính năng <span className="font-semibold text-gray-800">Auto rải {giftModal.comments} comment mồi</span> trên các Group FB mỗi ngày hoàn toàn miễn phí!<br/>
                <span className="block mt-2.5 font-semibold text-emerald-600">Chúc sếp lụm thật nhiều lúa và bùng nổ doanh số cùng AutoFarm nhé! 🚀🤑</span>
              </p>
              
              <div className="flex items-center gap-2 mb-4 px-2">
                <input 
                  type="checkbox" 
                  id="dontShowAgain" 
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <label htmlFor="dontShowAgain" className="text-xs text-gray-500 cursor-pointer select-none">
                  Không hiển thị lại thông báo này
                </label>
              </div>
              
              <button 
                onClick={() => {
                  if (dontShowAgain) localStorage.setItem('gift_modal_dismissed', 'true');
                  setGiftModal(null);
                }} 
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-[14px] font-semibold text-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98]"
              >
                Tuyệt vời, nhận quà!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
