"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabase";
import {
  Calendar, Banknote, Bot, Users, TrendingUp, Clock, CheckCircle, XCircle, ShieldAlert
} from "lucide-react";

// Email tài khoản Admin duy nhất được phép xem trang này
const ADMIN_EMAIL = "lmquang.devops@gmail.com";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

const STATUS_STYLE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  PAID:    { label: "Đã thanh toán", className: "bg-green-50 text-green-700 border-green-200",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  PENDING: { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "Đã huỷ",       className: "bg-red-50 text-red-600 border-red-200",       icon: <XCircle className="w-3.5 h-3.5" /> },
};

const TIER_LABEL: Record<string, string> = {
  free: "Free", lite: "Lite", pro: "Pro", promax: "Pro Max"
};

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
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);

      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from("payment_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, email, tier, created_at"),
      ]);

      setOrders(ordersRes.data || []);
      setProfiles(profilesRes.data || []);
      setLoading(false);
    }
    init();
  }, []);

  // --- Guard: chưa check xong ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Guard: không phải admin ---
  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Truy cập bị từ chối</h2>
        <p className="text-zinc-500 text-sm max-w-xs">
          Trang Analytics chỉ dành riêng cho tài khoản Admin.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-700 transition-colors"
        >
          Quay về Dashboard
        </button>
      </div>
    );
  }

  // --- Tính KPIs từ data thật ---
  const paidOrders = orders.filter(o => o.status === "PAID");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalUsers = profiles.length;

  // Doanh thu 30 ngày gần nhất
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentPaid = paidOrders.filter(o => o.created_at >= thirtyDaysAgo);
  const recentRevenue = recentPaid.reduce((sum, o) => sum + (o.amount || 0), 0);

  // Phân bổ tier
  const tierCount: Record<string, number> = {};
  profiles.forEach(p => { tierCount[p.tier] = (tierCount[p.tier] || 0) + 1; });

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 leading-tight mb-1">
            Revenue<br/>Analytics
          </h2>
          <p className="text-zinc-500 text-sm">Dữ liệu thật từ hệ thống — chỉ Admin xem được.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          Admin Only
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <Banknote className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tổng Doanh Thu</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{formatVND(totalRevenue)}</p>
          <p className="text-xs text-zinc-400 mt-1">{paidOrders.length} đơn thành công</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">30 Ngày Gần Nhất</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{formatVND(recentRevenue)}</p>
          <p className="text-xs text-zinc-400 mt-1">{recentPaid.length} đơn</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tổng Khách Hàng</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{totalUsers}</p>
          <p className="text-xs text-zinc-400 mt-1">tài khoản đã đăng ký</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Chờ Thanh Toán</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            {formatVND(orders.filter(o => o.status === "PENDING").reduce((s, o) => s + o.amount, 0))}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{orders.filter(o => o.status === "PENDING").length} đơn pending</p>
        </div>
      </div>

      {/* Tier Breakdown + Lịch sử đơn hàng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Phân bổ tier */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" /> Phân bổ Gói
          </h3>
          <div className="space-y-3">
            {["promax", "pro", "lite", "free"].map(tier => (
              <div key={tier} className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">{TIER_LABEL[tier] || tier}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: totalUsers > 0 ? `${((tierCount[tier] || 0) / totalUsers) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-900 w-4 text-right">{tierCount[tier] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lịch sử đơn hàng */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" /> Lịch sử Giao dịch
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {orders.length === 0 && (
              <p className="text-zinc-400 text-sm text-center py-6">Chưa có giao dịch nào.</p>
            )}
            {orders.map(order => {
              const profile = profiles.find(p => p.id === order.user_id);
              const s = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;
              return (
                <div key={order.order_code} className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-zinc-800">{profile?.email || order.user_id.slice(0,8)+"..."}</span>
                    <span className="text-[10px] text-zinc-400">{formatDate(order.created_at)} · {TIER_LABEL[order.tier] || order.tier}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-zinc-900">{formatVND(order.amount)}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.className}`}>
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
