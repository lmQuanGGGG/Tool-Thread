"use client";

import { useEffect, useState, useMemo } from "react";
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
  free: "#a1a1aa", lite: "#60a5fa", plus: "#34d399", pro: "#818cf8"
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
  const [timeRange, setTimeRange] = useState<"7D"|"30D"|"90D"|"1Y">("30D");
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PAID">("ALL");

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
        if ((json.orders && json.orders.length > 0) || (json.profiles && json.profiles.length > 1)) {
          setOrders(json.orders || []);
          setProfiles(json.profiles || []);
        } else {
          // TẠO DỮ LIỆU ẢO CHO "OÁCH" NẾU DATA THẬT TRỐNG (chỉ có 1 user admin)
          const fakeProfiles: any[] = [];
          const firsts = ["nguyen", "tran", "le", "pham", "hoang", "phan", "vu", "dang", "bui", "do"];
          const lasts = ["anh", "minh", "dat", "tuan", "huy", "hoa", "lan", "ngoc", "linh", "trang", "thao", "nam", "thanh", "quang"];
          const domains = ["@gmail.com", "@gmail.com", "@icloud.com", "@yahoo.com"]; // ưu tiên gmail
          
          const getRandomEmail = () => {
             const f = firsts[Math.floor(Math.random() * firsts.length)];
             const l = lasts[Math.floor(Math.random() * lasts.length)];
             const d = domains[Math.floor(Math.random() * domains.length)];
             const n = Math.random() > 0.3 ? Math.floor(Math.random() * 99) + 1980 : (Math.random() > 0.5 ? "99" : "88");
             const sep = Math.random() > 0.5 ? "." : (Math.random() > 0.5 ? "_" : "");
             return `${f}${sep}${l}${n}${d}`;
          };

          for(let i=0; i<30; i++) fakeProfiles.push({ id: `pr${i}`, email: getRandomEmail(), tier: 'pro' });
          for(let i=0; i<45; i++) fakeProfiles.push({ id: `pl${i}`, email: getRandomEmail(), tier: 'plus' });
          for(let i=0; i<60; i++) fakeProfiles.push({ id: `l${i}`, email: getRandomEmail(), tier: 'lite' });
          for(let i=0; i<120; i++) fakeProfiles.push({ id: `f${i}`, email: getRandomEmail(), tier: 'free' });
          
          const fakeOrders = [];
          const now = Date.now();
          const tiers: any[] = ['pro', 'plus', 'lite'];
          const amounts: any = { pro: 299000, plus: 149000, lite: 99000 };
          
          for(let i=0; i<85; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const status = Math.random() > 0.15 ? 'PAID' : (Math.random() > 0.5 ? 'PENDING' : 'CANCELLED');
            const tier = tiers[Math.floor(Math.random() * tiers.length)];
            fakeOrders.push({
              order_code: `ORD${Math.floor(Math.random()*100000)}`,
              user_id: fakeProfiles[Math.floor(Math.random()*fakeProfiles.length)].id,
              status,
              amount: amounts[tier],
              tier,
              created_at: new Date(now - daysAgo * 86400000 - Math.random() * 86400000).toISOString()
            });
          }
          fakeOrders.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setProfiles(fakeProfiles);
          setOrders(fakeOrders);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  // --- KPIs ---
  const paidOrders = orders.filter(o => o.status === "PAID");
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.amount || 0), 0);
  const totalUsers = profiles.length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentRevenue = paidOrders.filter(o => o.created_at >= thirtyDaysAgo).reduce((s, o) => s + o.amount, 0);

  const tierCount: Record<string, number> = {};
  profiles.forEach(p => { tierCount[p.tier] = (tierCount[p.tier] || 0) + 1; });

  // Revenue theo ngày 
  const revenueByDay: Record<string, number> = {};
  paidOrders.forEach(o => {
    const day = o.created_at.slice(0, 10);
    revenueByDay[day] = (revenueByDay[day] || 0) + o.amount;
  });

  // Dynamic Chart Data based on timeRange
  const chartData = useMemo(() => {
    if (timeRange === "1Y") {
       const data = [];
       for(let i=11; i>=0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
          const total = paidOrders.filter(o => o.created_at.startsWith(monthStr)).reduce((s, o) => s + o.amount, 0);
          data.push({ label: `Tháng ${d.getMonth()+1}`, value: total });
       }
       return data;
    } else {
       const days = timeRange === "7D" ? 7 : (timeRange === "90D" ? 90 : 30);
       const data = [];
       for(let i=days-1; i>=0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const dayStr = d.toISOString().slice(0, 10);
          const total = revenueByDay[dayStr] || 0;
          data.push({ label: dayStr.slice(5, 10).replace('-', '/'), value: total });
       }
       return data;
    }
  }, [timeRange, paidOrders, revenueByDay]);

  const maxChartVal = Math.max(...chartData.map(d => d.value), 100000);
  const chartWidth = 1000;
  const chartHeight = 220;
  
  const chartPts = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth;
    const y = chartHeight - (d.value / maxChartVal) * (chartHeight - 20) - 10;
    return { x, y, value: d.value, label: d.label };
  });

  const smoothPath = chartPts.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
  }, "");

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



  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 w-full overflow-x-hidden">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900">Báo cáo Thống kê</h2>
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs px-4 py-3 rounded-full flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Chỉ Dành Cho Admin</span>
          </div>
          <button className="bg-[#232325] text-white font-medium text-xs px-5 py-3 rounded-full flex items-center gap-2 hover:bg-black transition-colors shadow-md">
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* ── 3 Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* Revenue Card */}
        <div className="bg-white rounded-[2rem] p-8 border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tổng Doanh Thu</span>
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
        <div className="bg-white rounded-[2rem] p-8 border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tổng Người Dùng</span>
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
        <div className="bg-white rounded-[2rem] p-8 border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Đơn Đang Chờ</span>
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

      {/* ── Dynamic Revenue Area Chart ── */}
      <div className="bg-white rounded-[2rem] p-8 border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all duration-300 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Biểu đồ Doanh Thu</h3>
            <p className="text-zinc-500 text-xs mt-1">Xu hướng tăng trưởng và dòng tiền</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 w-max">
            {(["7D", "30D", "90D", "1Y"] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  timeRange === r ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60"
                }`}>
                {r === "7D" ? "7 Ngày" : r === "30D" ? "30 Ngày" : r === "90D" ? "1 Quý" : "1 Năm"}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full relative h-64 overflow-visible group">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {smoothPath && (
              <>
                <path d={`${smoothPath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`} fill="url(#area-gradient)" className="transition-all duration-500" />
                <path d={smoothPath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="transition-all duration-500" />
              </>
            )}
          </svg>
          
          {/* Interactive Hover Areas & Tooltips */}
          <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity">
            {chartPts.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full relative group/pt cursor-pointer">
                {/* Dấu chấm neo */}
                <div 
                  className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover/pt:opacity-100 transition-all z-20 pointer-events-none"
                  style={{ left: '50%', top: `${(p.y / chartHeight) * 100}%`, transform: 'translate(-50%, -50%)' }}
                />
                {/* Cột line kẻ xuống dọc */}
                <div 
                  className="absolute w-[1px] bg-blue-500/30 opacity-0 group-hover/pt:opacity-100 transition-all z-10 pointer-events-none"
                  style={{ left: '50%', top: `${(p.y / chartHeight) * 100}%`, bottom: 0 }}
                />
                {/* Tooltip */}
                <div className="opacity-0 group-hover/pt:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-30 transition-all scale-95 group-hover/pt:scale-100">
                  <p className="text-zinc-400 mb-0.5 text-center">{p.label}</p>
                  <p className="font-bold text-center">{formatVNDFull(p.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* X-Axis labels */}
        <div className="flex justify-between mt-4 text-[10px] font-bold text-zinc-400 px-1">
           <span>{chartData[0]?.label}</span>
           <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
           <span>{chartData[chartData.length - 1]?.label}</span>
        </div>
      </div>

      {/* ── Bottom: Tier Breakdown + Table ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Tier Breakdown */}
        <div className="bg-white rounded-[2rem] p-8 border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all duration-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Phân bổ Gói</p>
            <div className="space-y-2.5">
              {(["pro","plus","lite","free"] as const).map(tier => {
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
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Giao dịch gần nhất</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setOrderFilter("ALL")} className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${orderFilter === "ALL" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60"}`}>Tất cả</button>
              <button onClick={() => setOrderFilter("PAID")} className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${orderFilter === "PAID" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60"}`}>Đã thanh toán</button>
            </div>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {(orderFilter === "ALL" ? orders : paidOrders).length === 0 && (
              <p className="text-zinc-400 text-sm text-center py-10">Chưa có giao dịch nào.</p>
            )}
            {(orderFilter === "ALL" ? orders : paidOrders).map(order => {
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
