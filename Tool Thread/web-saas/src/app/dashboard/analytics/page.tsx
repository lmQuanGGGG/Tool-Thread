"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabase";
import {
  Calendar, Download, Banknote, Users, TrendingUp, ArrowUpRight,
  Minus, ShieldAlert, CheckCircle, Clock, XCircle
} from "lucide-react";

const ADMIN_EMAIL = "lmquang.devops@gmail.com";

function formatVND(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M₫`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K₫`;
  return `${amount}₫`;
}

function formatVNDFull(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

const TIER_COLOR: Record<string, string> = {
  free: "#a1a1aa", lite: "#60a5fa", pro: "#818cf8", promax: "#f59e0b"
};

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PAID:      { label: "Đã thanh toán", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle className="w-3 h-3" /> },
  PENDING:   { label: "Chờ thanh toán", cls: "bg-amber-50 text-amber-700 border-amber-200",    icon: <Clock className="w-3 h-3" /> },
  CANCELLED: { label: "Đã huỷ",        cls: "bg-red-50 text-red-600 border-red-200",           icon: <XCircle className="w-3 h-3" /> },
};

// Tạo sparkline SVG path từ mảng giá trị
function buildSparkline(values: number[], w = 200, h = 50): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 6) - 3;
    return `${x},${y}`;
  });
  return "M " + pts.join(" L ");
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        setAuthorized(false); setLoading(false); return;
      }
      setAuthorized(true);

      // Dùng API Route server-side (service role) để bypass RLS và lấy toàn bộ data
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setOrders(json.orders || []);
        setProfiles(json.profiles || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!authorized) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900">Truy cập bị từ chối</h2>
      <p className="text-zinc-500 text-sm max-w-xs">Trang Analytics chỉ dành riêng cho tài khoản Admin.</p>
      <button onClick={() => router.push("/dashboard")}
        className="mt-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-700 transition-colors">
        Quay về Dashboard
      </button>
    </div>
  );

  // --- KPIs ---
  const paidOrders = orders.filter(o => o.status === "PAID");
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.amount || 0), 0);
  const totalUsers = profiles.length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentRevenue = paidOrders.filter(o => o.created_at >= thirtyDaysAgo).reduce((s, o) => s + o.amount, 0);

  const tierCount: Record<string, number> = {};
  profiles.forEach(p => { tierCount[p.tier] = (tierCount[p.tier] || 0) + 1; });

  // Revenue theo ngày (7 ngày gần nhất cho sparkline)
  const revenueByDay: Record<string, number> = {};
  paidOrders.forEach(o => {
    const day = o.created_at.slice(0, 10);
    revenueByDay[day] = (revenueByDay[day] || 0) + o.amount;
  });
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const sparkValues = last7Days.map(d => revenueByDay[d] || 0);
  const sparkPath = buildSparkline(sparkValues);

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-tight mb-2">
            Performance<br/>Overview
          </h2>
          <p className="text-zinc-500 text-sm md:text-base max-w-sm leading-relaxed">
            Deep dive into revenue and user growth across all tiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs px-4 py-3 rounded-full flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Only</span>
          </div>
          <button className="bg-[#232325] text-white font-medium text-xs px-5 py-3 rounded-full flex items-center gap-2 hover:bg-black transition-colors shadow-md">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ── 3 Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Revenue Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Revenue</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <h3 className="text-[3rem] leading-none font-medium text-zinc-900 tracking-tight">
              {formatVND(totalRevenue)}
            </h3>
          </div>
          <p className="text-zinc-400 text-xs mb-4">{paidOrders.length} đơn thành công</p>
          <div className="flex items-center gap-1.5 text-blue-500 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>{recentRevenue > 0 ? `+${formatVND(recentRevenue)} / 30 ngày` : "Chưa có doanh thu"}</span>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Users</span>
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <h3 className="text-[3rem] leading-none font-medium text-zinc-900 tracking-tight">{totalUsers}</h3>
          </div>
          <p className="text-zinc-400 text-xs mb-4">tài khoản đã đăng ký</p>
          <div className="flex items-center gap-1.5 text-zinc-900 text-xs font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>
              {Object.entries(tierCount).filter(([t]) => t !== "free").map(([t, c]) => `${c} ${t}`).join(" · ") || "Chưa có paid user"}
            </span>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pending Orders</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <h3 className="text-[3rem] leading-none font-medium text-zinc-900 tracking-tight">
              {formatVND(orders.filter(o => o.status === "PENDING").reduce((s, o) => s + o.amount, 0))}
            </h3>
          </div>
          <p className="text-zinc-400 text-xs mb-4">{orders.filter(o => o.status === "PENDING").length} đơn đang chờ</p>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
            <Minus className="w-4 h-4" />
            <span>Chưa thanh toán</span>
          </div>
        </div>

      </div>

      {/* ── Bottom: Chart + Table ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Sparkline + Tier Breakdown */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow space-y-6">
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Revenue / 7 ngày</p>
            <svg viewBox="0 0 200 50" className="w-full h-14">
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {sparkPath && (
                <>
                  <path d={sparkPath + ` L 200,50 L 0,50 Z`} fill="url(#sg)" />
                  <path d={sparkPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
              {!sparkPath && (
                <text x="100" y="28" textAnchor="middle" className="text-xs" fill="#d4d4d8" fontSize="10">Chưa có data</text>
              )}
            </svg>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Phân bổ Gói</p>
            <div className="space-y-2.5">
              {(["promax","pro","lite","free"] as const).map(tier => {
                const count = tierCount[tier] || 0;
                const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                return (
                  <div key={tier} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: TIER_COLOR[tier] }} />
                    <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: TIER_COLOR[tier] }} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-700 w-14 text-right capitalize">{tier} ({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Giao dịch gần nhất</h3>
            <div className="flex items-center bg-zinc-100 p-1 rounded-full">
              <span className="bg-white text-zinc-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">All</span>
              <span className="text-zinc-400 text-xs font-bold px-4 py-1.5">Paid</span>
            </div>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {orders.length === 0 && (
              <p className="text-zinc-400 text-sm text-center py-10">Chưa có giao dịch nào.</p>
            )}
            {orders.map(order => {
              const profile = profiles.find(p => p.id === order.user_id);
              const s = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
              return (
                <div key={order.order_code}
                  className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                      {(profile?.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 truncate max-w-[180px]">{profile?.email || "Unknown"}</p>
                      <p className="text-[10px] text-zinc-400">{formatDate(order.created_at)} · <span className="capitalize font-medium">{order.tier}</span></p>
                    </div>
                  </div>
                  {/* Amount + Status */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-bold text-zinc-900">{formatVNDFull(order.amount)}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>
                      {s.icon}{s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
