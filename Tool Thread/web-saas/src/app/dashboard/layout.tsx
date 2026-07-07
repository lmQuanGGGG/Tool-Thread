"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid, Network, BarChart, Rocket, CreditCard, Video,
  Crown, Zap, Activity, ChevronRight, PanelLeft, Search
} from "lucide-react";
import { supabase } from "../../utils/supabase";

const TIER_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  free:   { label: "Free",   icon: Activity, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-surface-2)]" },
  lite:   { label: "Lite",   icon: Zap,      color: "text-emerald-600", bg: "bg-emerald-50" },
  plus:   { label: "Plus",   icon: Zap,      color: "text-blue-600", bg: "bg-blue-50" },
  pro:    { label: "Pro",    icon: Crown,    color: "text-amber-600", bg: "bg-amber-50" },
  promax: { label: "ProMax", icon: Crown,    color: "text-violet-600", bg: "bg-violet-50" },
};

const NAV_ITEMS = [
  { name: "Dashboard",    href: "/dashboard",          icon: Grid },
  { name: "Bots & Config", href: "/dashboard/accounts", icon: Video },
  { name: "Crawl Data",    href: "/dashboard/crawl",     icon: Search },
  { name: "Proxies",      href: "/dashboard/proxies",  icon: Network },
  { name: "Analytics",    href: "/dashboard/analytics", icon: BarChart },
  { name: "Pricing",      href: "/pricing",             icon: CreditCard },
];

const SIDEBAR_W = 256;

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
    <div className="flex min-h-screen bg-[var(--bg-page)]">

      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-blob-3" />
      </div>

      {/* ===== SIDEBAR ===== */}
      <aside
        className="fixed top-0 left-0 h-screen z-30 flex flex-col bg-[var(--bg-surface-1)] border-r border-[var(--border-subtle)] transition-all duration-300"
        style={{ width: collapsed ? 64 : SIDEBAR_W }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-6 pb-7 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-full opacity-100"}`}>
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] flex items-center justify-center text-white shadow-sm shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div className="whitespace-nowrap">
              <h1 className="font-semibold text-[14px] text-[var(--text-primary)] tracking-tight leading-tight">Automation Hub</h1>
              <p className="text-[9px] font-medium text-[var(--text-muted)] tracking-wider uppercase">V3.5</p>
            </div>
          </div>

          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] flex items-center justify-center text-white shadow-sm mx-auto">
              <Rocket className="w-4 h-4" />
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-all shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`nav-link ${collapsed ? "justify-center !px-0 w-9 h-9 mx-auto" : ""} ${isActive ? "nav-link-active" : ""}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Tier */}
        <div className="p-3 pb-4 space-y-2 shrink-0">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 mx-auto rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-all"
            >
              <PanelLeft className="w-4 h-4 rotate-180" />
            </button>
          ) : (
            <>
              <div className="card p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${meta.bg}`}>
                      <TierIcon className={`w-3 h-3 ${meta.color}`} />
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-[var(--text-muted)] leading-none">Gói hiện tại</p>
                      <p className={`text-[12px] font-bold ${meta.color} mt-0.5`}>{meta.label}</p>
                    </div>
                  </div>
                  <Link href="/pricing" className="text-[10px] text-[var(--accent-blue)] font-semibold hover:underline whitespace-nowrap">
                    Xem gói →
                  </Link>
                </div>

                {limits && used && (
                  <div className="space-y-2 border-t border-[var(--border-subtle)] pt-2.5">
                    {[
                      { label: "Reels", used: used.reels_posted || 0, limit: limits.reels_per_day, color: "bg-blue-500" },
                      { label: "Comment", used: used.threads_commented || 0, limit: limits.threads_per_day, color: "bg-violet-500" },
                      { label: "FB Post", used: used.fb_posts_count || 0, limit: limits.fb_post_per_day, color: "bg-amber-500" },
                    ].map(({ label, used: u, limit: l, color }) => {
                      const unlimited = l === -1;
                      const remaining = unlimited ? "∞" : Math.max(0, l - u);
                      const pct = unlimited ? 12 : l === 0 ? 100 : Math.min(100, (u / l) * 100);
                      const nearLimit = !unlimited && l > 0 && pct >= 80;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
                            <span className={`text-[10px] font-semibold ${nearLimit ? "text-red-500" : "text-[var(--text-secondary)]"}`}>
                              {l === 0 ? "—" : unlimited ? "∞" : `còn ${remaining}`}
                            </span>
                          </div>
                          {l !== 0 && (
                            <div className="w-full h-1 bg-[var(--bg-surface-3)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${nearLimit ? "bg-red-500" : color}`}
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
                    : <span className="text-[var(--text-muted)]">
                        {tier === "free" && "Nâng cấp để bot tự động!"}
                        {tier === "lite" && "Nâng Plus để tự động mỗi ngày!"}
                        {tier === "plus" && "Nâng Pro để tăng gấp đôi giới hạn."}
                      </span>
                  }
                </div>
              </div>

              {tier !== "promax" && (
                <Link
                  href="/pricing"
                  className="flex items-center justify-between w-full btn btn-primary font-semibold text-[11px] tracking-wide py-2.5 px-4 group"
                >
                  <span>⚡ Nâng cấp gói</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main
        className="flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300"
        style={{ marginLeft: collapsed ? 64 : SIDEBAR_W }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="fixed top-5 z-40 w-7 h-7 rounded-md bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            style={{ left: 72 }}
          >
            <PanelLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}

        <div className="flex-1 z-10 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
