"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid, Network, BarChart, Rocket, CreditCard, Video,
  Crown, Zap, Activity, ChevronRight, PanelLeft, Search
} from "lucide-react";
import { supabase } from "../../utils/supabase";

const TIER_META: Record<string, { label: string; icon: React.ElementType; color: string; textColor: string }> = {
  free:   { label: "Free",   icon: Activity, color: "bg-zinc-100",    textColor: "text-zinc-500" },
  lite:   { label: "Lite",   icon: Zap,      color: "bg-emerald-100", textColor: "text-emerald-700" },
  plus:   { label: "Plus",   icon: Zap,      color: "bg-blue-100",    textColor: "text-blue-700" },
  pro:    { label: "Pro",    icon: Crown,    color: "bg-amber-100",   textColor: "text-amber-700" },
  promax: { label: "ProMax", icon: Crown,    color: "bg-violet-100",  textColor: "text-violet-700" },
};

const NAV_ITEMS = [
  { name: "Dashboard",    href: "/dashboard",          icon: Grid },
  { name: "Bots & Config", href: "/dashboard/accounts", icon: Video },
  { name: "Crawl Data",    href: "/dashboard/crawl",     icon: Search },
  { name: "Proxies",      href: "/dashboard/proxies",  icon: Network },
  { name: "Analytics",    href: "/dashboard/analytics", icon: BarChart },
  { name: "Pricing",      href: "/pricing",             icon: CreditCard },
];

const SIDEBAR_W = 272; // px khi mở

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tier, setTier] = useState<string>("free");
  const [limits, setLimits] = useState<any>(null);
  const [used, setUsed] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];

      Promise.all([
        supabase.from("usage_stats")
          .select("reels_posted, threads_commented, fb_posts_count")
          .eq("user_id", user.id).eq("date", today).single(),
      ]).then(([statsRes]) => {
        // TẠM THỜI HARDCODE PROMAX TRÊN SIDEBAR CHO SẾP TEST
        const t = "promax";
        setTier(t);
        setUsed(statsRes.data || { reels_posted: 0, threads_commented: 0, fb_posts_count: 0 });
        supabase.from("tier_limits")
          .select("reels_per_day, threads_per_day, fb_post_per_day")
          .eq("tier", t).single()
          .then(({ data }) => setLimits(data));
      });
    });
  }, []);

  const meta = TIER_META[tier] || TIER_META.free;
  const TierIcon = meta.icon;
  const isPro = tier === "pro" || tier === "promax";

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">

      {/* ===== FIXED SIDEBAR ===== */}
      <aside
        className="fixed top-0 left-0 h-screen z-30 flex flex-col bg-[#F8F9FA] border-r border-zinc-200/80 transition-all duration-300 ease-in-out"
        style={{ width: collapsed ? 64 : SIDEBAR_W }}
      >
        {/* Top: Logo + Toggle Button */}
        <div className="flex items-center justify-between px-4 pt-8 pb-10 shrink-0">
          {/* Logo - ẩn text khi collapsed */}
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-full opacity-100"}`}>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Rocket className="w-4.5 h-4.5" />
            </div>
            <div className="whitespace-nowrap">
              <h1 className="font-semibold text-[15px] text-zinc-900 tracking-tight leading-tight">Automation Hub</h1>
              <p className="text-[9px] font-medium text-zinc-400 tracking-wider uppercase">V3.4 Active</p>
            </div>
          </div>

          {/* Khi collapsed: show only logo icon */}
          {collapsed && (
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mx-auto">
              <Rocket className="w-4 h-4" />
            </div>
          )}

          {/* Toggle button - chỉ hiện khi mở rộng */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all shrink-0"
              title="Thu gọn sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-1 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3.5 rounded-full text-[13px] font-medium transition-all duration-150 ${
                  collapsed ? "justify-center w-10 h-10 mx-auto px-0" : "px-4 py-3"
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Tier Card + Upgrade (ẩn khi collapsed) */}
        <div className="p-3 pb-6 space-y-2.5 shrink-0">
          {collapsed ? (
            /* Mini icon khi thu gọn */
            <button
              onClick={() => setCollapsed(false)}
              title="Mở rộng sidebar"
              className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all"
            >
              <PanelLeft className="w-4 h-4 rotate-180" />
            </button>
          ) : (
            <>
              {/* Tier Card */}
              <div className="bg-white rounded-2xl p-3.5 border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${meta.color}`}>
                      <TierIcon className={`w-3 h-3 ${meta.textColor}`} />
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-zinc-400 leading-none">Gói hiện tại</p>
                      <p className={`text-[12px] font-bold ${meta.textColor} mt-0.5`}>{meta.label}</p>
                    </div>
                  </div>
                  <Link href="/pricing" className="text-[10px] text-blue-600 font-semibold hover:underline whitespace-nowrap">
                    Xem gói →
                  </Link>
                </div>

                {/* Mini usage bars */}
                {limits && used && (
                  <div className="space-y-1.5 border-t border-zinc-50 pt-2.5">
                    {[
                      { label: "Reels", used: used.reels_posted || 0, limit: limits.reels_per_day, emoji: "📹" },
                      { label: "Comment", used: used.threads_commented || 0, limit: limits.threads_per_day, emoji: "💬" },
                      { label: "FB Post", used: used.fb_posts_count || 0, limit: limits.fb_post_per_day, emoji: "📝" },
                    ].map(({ label, used: u, limit: l, emoji }) => {
                      const unlimited = l === -1;
                      const remaining = unlimited ? "∞" : Math.max(0, l - u);
                      const pct = unlimited ? 15 : l === 0 ? 100 : Math.min(100, (u / l) * 100);
                      const nearLimit = !unlimited && l > 0 && pct >= 80;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-zinc-400">{emoji} {label}</span>
                            <span className={`text-[9px] font-bold ${nearLimit ? "text-red-500" : "text-zinc-500"}`}>
                              {l === 0 ? "—" : unlimited ? "∞" : `còn ${remaining}`}
                            </span>
                          </div>
                          {l !== 0 && (
                            <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${nearLimit ? "bg-red-400" : "bg-blue-500"}`}
                                style={{ width: `${pct}%` }}
                              />
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
                    : <span className="text-zinc-400">
                        {tier === "free" && "Nâng cấp để bot tự động!"}
                        {tier === "lite" && "Nâng Plus để tự động mỗi ngày!"}
                        {tier === "plus" && "Nâng Pro để tăng gấp đôi giới hạn."}
                      </span>
                  }
                </div>
              </div>

              {/* Upgrade Button */}
              {tier !== "promax" && (
                <Link
                  href="/pricing"
                  className="flex items-center justify-between w-full bg-zinc-900 text-white font-bold text-[11px] tracking-wide py-3 px-4 rounded-full hover:bg-zinc-700 transition-colors group"
                >
                  <span>⚡ Nâng cấp gói</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </Link>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ===== MAIN CONTENT - offset theo sidebar ===== */}
      <main
        className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-[#F8F9FA] transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? 64 : SIDEBAR_W }}
      >
        {/* Dotted grid background */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(#d4d4d8 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        {/* Toggle button nổi khi collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="fixed top-6 left-[72px] z-40 w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:shadow-lg transition-all"
            title="Mở rộng sidebar"
          >
            <PanelLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}

        {/* Page Content */}
        <div className="flex-1 z-10 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
