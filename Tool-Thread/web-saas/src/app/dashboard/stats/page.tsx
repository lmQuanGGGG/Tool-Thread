"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../utils/supabase";
import { Zap, MessageSquare, Send, Code, Bot, UploadCloud } from "lucide-react";

// ─────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────
type Period = "today" | "7d" | "30d" | "3m" | "12m";

const BOTS = [
  { key: "reels_posted",        label: "Up Reels FB",      color: "#6366f1", icon: Zap },
  { key: "fb_comments_count",   label: "Cmt FB Rải Link",  color: "#f59e0b", icon: MessageSquare },
  { key: "threads_commented",   label: "Cmt Threads",      color: "#10b981", icon: MessageSquare },
  { key: "fb_posts_count",      label: "Đăng FB",          color: "#3b82f6", icon: Send },
  { key: "threads_posts_count", label: "Đăng Threads",     color: "#ec4899", icon: Send },
  { key: "parse_links",         label: "Quét Link Shopee", color: "#8b5cf6", icon: Code },
  { key: "crawls_count",        label: "Crawl Threads",    color: "#0ea5e9", icon: Bot },
  { key: "upload_images",       label: "Upload Ảnh Tele",  color: "#06b6d4", icon: UploadCloud },
] as const;

const PERIODS: { label: string; value: Period }[] = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "3 tháng", value: "3m" },
  { label: "12 tháng", value: "12m" },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function toCount(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function getVNDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + 7 * 3600 * 1000 + offsetDays * 86400 * 1000);
  return d.toISOString().split("T")[0];
}

function getPeriodDates(period: Period): { start: string; end: string; groupBy: "hour" | "day" | "week" | "month" } {
  const end = getVNDateString(0);
  let start = end;
  let groupBy: "hour" | "day" | "week" | "month" = "day";

  if (period === "today") { start = getVNDateString(0); groupBy = "hour"; }
  else if (period === "7d") { start = getVNDateString(-6); groupBy = "day"; }
  else if (period === "30d") { start = getVNDateString(-29); groupBy = "day"; }
  else if (period === "3m") { start = getVNDateString(-90); groupBy = "week"; }
  else { start = getVNDateString(-365); groupBy = "month"; }

  return { start, end, groupBy };
}

function buildDateRange(start: string, end: string, groupBy: "hour" | "day" | "week" | "month"): string[] {
  if (groupBy === "hour") {
    return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  }

  const result: string[] = [];
  const [sY, sM, sD] = start.split("-").map(Number);
  const [eY, eM, eD] = end.split("-").map(Number);
  const cur = new Date(sY, sM - 1, sD);
  const endDate = new Date(eY, eM - 1, eD);

  const formatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  if (groupBy === "day") {
    while (cur <= endDate) {
      result.push(formatDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
  } else if (groupBy === "week") {
    while (cur <= endDate) {
      result.push(formatDate(cur));
      cur.setDate(cur.getDate() + 7);
    }
  } else {
    while (cur <= endDate) {
      result.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return result;
}

function formatXLabel(key: string, groupBy: "hour" | "day" | "week" | "month"): string {
  if (groupBy === "hour") {
    return key;
  }
  if (groupBy === "month") {
    const [y, m] = key.split("-");
    return `T${parseInt(m)}/${y.slice(-2)}`;
  }
  if (groupBy === "week") {
    const [y, m, d] = key.split("-");
    return `${parseInt(d)}/${parseInt(m)}`;
  }
  const [y, m, d] = key.split("-");
  return `${parseInt(d)}/${parseInt(m)}`;
}

// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Area Chart SVG Component
// ─────────────────────────────────────────────
function AreaChart({ data, labels, color, height = 120 }: {
  data: number[]; labels: string[]; color: string; height?: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = Math.max(...data, 1);
  const gap = data.length > 1 ? 100 / (data.length - 1) : 100;

  let dCurve = "";
  let pathPts = data.map((val, i) => ({ x: i * gap, y: height - (val / max) * height }));
  
  if (pathPts.length === 1) {
    pathPts = [
      { x: 0, y: pathPts[0].y },
      { x: 100, y: pathPts[0].y }
    ];
    dCurve = `M 0,${pathPts[0].y} L 100,${pathPts[0].y}`;
  } else if (pathPts.length > 1) {
    dCurve = `M ${pathPts[0].x},${pathPts[0].y}`;
    for (let i = 0; i < pathPts.length - 1; i++) {
      const p0 = pathPts[i];
      const p1 = pathPts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      dCurve += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
    }
  }

  const dArea = dCurve + (pathPts.length > 0 ? ` L 100,${height} L 0,${height} Z` : "");
  const gradId = `grad-${color.replace('#', '')}`;
  const clipId = `clip-${color.replace('#', '')}`;

  const safeCx = hoverIndex !== null && pathPts[hoverIndex] ? pathPts[hoverIndex].x : 0;
  const safeCy = hoverIndex !== null && pathPts[hoverIndex] ? pathPts[hoverIndex].y : 0;

  return (
    <div className="w-full relative group" style={{ paddingBottom: '20px' }} onMouseLeave={() => setHoverIndex(null)}>
      {/* CSS Animation keyframes for entrance effect */}
      <style>{`
        @keyframes drawIn {
          from { clip-path: polygon(0 0, 0 100%, 0 100%, 0 0); }
          to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
        }
        .animate-draw-in {
          animation: drawIn 1.2s ease-in-out forwards;
        }
      `}</style>

      <svg viewBox={`0 -5 100 ${height + 10}`} preserveAspectRatio="none" className="w-full overflow-visible animate-draw-in" style={{ height: height + 10 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Area fill - use non-scaling-stroke if needed, but for fill it's fine */}
        <path d={dArea} fill={`url(#${gradId})`} />
        
        {/* Line stroke - FIXED nét thanh nét đậm! */}
        <path d={dCurve} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        
        {/* Active Point Dot - FIXED code lỗi! */}
        {hoverIndex !== null && pathPts.length > 0 && (
          <circle
            cx={safeCx} 
            cy={safeCy} 
            r="4"
            fill="#fff" stroke={color} strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            className="transition-all duration-200"
          />
        )}
      </svg>
      
      {/* HTML Overlay for Tooltips & Hover Areas */}
      <div className="absolute inset-0 z-10" style={{ top: '5px', bottom: '25px' }}>
        {data.map((val, i) => {
          const xPercent = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
          const yPercent = max > 0 ? (1 - (val / max)) * 100 : 100;
          const isActive = hoverIndex === i;
          
          return (
            <div 
              key={i} 
              className="absolute h-full cursor-crosshair"
              style={{ 
                left: `calc(${xPercent}% - ${data.length > 1 ? 100/(data.length-1)/2 : 50}%)`, 
                width: `${data.length > 1 ? 100/(data.length-1) : 100}%`,
                top: 0 
              }}
              onMouseEnter={() => setHoverIndex(i)}
            >
              <div 
                className={`absolute z-50 transition-all duration-200 pointer-events-none flex flex-col items-center justify-center bg-zinc-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl transform -translate-x-1/2 whitespace-nowrap border border-zinc-700/50 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ top: `calc(${yPercent}% - 40px)`, left: '50%' }}
              >
                <span className="font-bold text-sm" style={{ color }}>{val.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">{labels[i]}</span>
                {/* Triangle pointer */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45 border-r border-b border-zinc-700/50"></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="absolute bottom-0 w-full px-[2px]">
        {labels.map((l, i) => {
          const step = Math.max(1, Math.floor(labels.length / 5));
          if (i !== 0 && i !== labels.length - 1 && i % step !== 0) return null;
          const alignClass = i === 0 ? "origin-left" : i === labels.length - 1 ? "-translate-x-full origin-right" : "-translate-x-1/2";
          return (
            <span key={i} className={`text-[10px] font-medium text-zinc-400 absolute ${alignClass}`} style={{ left: `${i * gap}%` }}>
              {l}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function StatsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [rows, setRows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [totalCrawledData, setTotalCrawledData] = useState(0);
  const [remainingCrawledData, setRemainingCrawledData] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
      } else {
        setError("Chưa đăng nhập! Vui lòng đăng nhập để xem thống kê.");
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId || !userEmail) return;
    const { start, end } = getPeriodDates(period);
    const startUTC = new Date(new Date(start + "T00:00:00Z").getTime() - 7 * 3600 * 1000).toISOString();
    const endUTC = new Date(new Date(end + "T23:59:59.999Z").getTime() - 7 * 3600 * 1000).toISOString();
    setLoading(true);

    Promise.all([
      supabase
        .from("usage_stats")
        .select("date, reels_posted, fb_comments_count, threads_commented, fb_posts_count, threads_posts_count, crawls_count")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true }),
      supabase
        .from("bot_logs")
        .select("level, message, bot_type, created_at")
        .eq("email", userEmail)
        .gte("created_at", startUTC)
        .lte("created_at", endUTC)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("crawl_data")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("posted", false),
      supabase
        .from("crawl_data")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
    ]).then(([statsRes, logsRes, crawlUnpostedRes, crawlTotalRes]) => {
      setRows(statsRes.data || []);
      setLogs(logsRes.data || []);
      setRemainingCrawledData(crawlUnpostedRes.count || 0);
      setTotalCrawledData(crawlTotalRes.count || 0);
      setLoading(false);
    });
  }, [userId, userEmail, period]);

  const { start, end, groupBy } = useMemo(() => getPeriodDates(period), [period]);
  const dateKeys = useMemo(() => buildDateRange(start, end, groupBy), [start, end, groupBy]);

  const { successCount, errorCount, totalLinks } = useMemo(() => {
    let s = 0, e = 0, l = 0;
    const mainBots = ['yt-reels', 'fb-cmt-reels', 'fb-cmt-stranger', 'threads', 'threads_post', 'fb-post'];
    logs.forEach(log => {
      const isMain = mainBots.includes(log.bot_type);
      if (log.level === 'success' && isMain) s++;
      if (log.level === 'error' && isMain) e++;
      if (log.message?.includes('link Aff')) {
        const match = log.message.match(/(\d+)\s*link Aff/);
        if (match) l += parseInt(match[1], 10);
      }
      if (log.bot_type === 'threads' && log.level === 'success' && log.message?.includes('Đã bắn Comment + Ảnh thành công')) {
        l += 1;
      }
    });
    return { successCount: s, errorCount: e, totalLinks: l };
  }, [logs]);

  const chartData = useMemo(() => {
    const botTypeMap: Record<string, string[]> = {
      "reels_posted": ["yt-reels"],
      "fb_comments_count": ["fb-cmt-reels", "fb-cmt-stranger"],
      "threads_commented": ["threads"],
      "fb_posts_count": ["fb-post", "fb-story"], 
      "threads_posts_count": ["threads_post"],
      "parse_links": ["parse_links"],
      "crawls_count": ["threads_scraper"],
      "upload_images": ["upload_images"],
    };

    return BOTS.map((bot) => {
      let values: number[] = [];
      let total = 0;

      const types = botTypeMap[bot.key] || [];
      const botLogs = logs.filter(l => types.includes(l.bot_type) && l.level === 'success');

      if (groupBy === "hour") {
        values = dateKeys.map((key, i) => {
          return botLogs.filter(l => {
            if (!l.created_at) return false;
            const d = new Date(l.created_at);
            const vnHour = Math.floor((d.getTime() + 7 * 3600 * 1000) / 3600000) % 24;
            return vnHour === i;
          }).length;
        });

        if (bot.key === "parse_links" || bot.key === "upload_images") {
          total = botLogs.length;
        } else {
          const row = rows.find((r) => r.date === start);
          total = toCount(row?.[bot.key]);
        }
      } else {
        if (bot.key === "parse_links" || bot.key === "upload_images") {
          values = dateKeys.map((key) => {
            return botLogs.filter(l => {
              if (!l.created_at) return false;
              const vnDate = new Date(new Date(l.created_at).getTime() + 7 * 3600 * 1000).toISOString().split('T')[0];
              
              if (groupBy === "day") return vnDate === key;
              if (groupBy === "month") return vnDate.startsWith(key);
              if (groupBy === "week") {
                const ws = new Date(key).getTime();
                const we = ws + 6 * 86400 * 1000;
                const lt = new Date(vnDate).getTime();
                return lt >= ws && lt <= we;
              }
              return false;
            }).length;
          });
          total = values.reduce((a, b) => a + b, 0);
        } else {
          values = dateKeys.map((key) => {
            if (groupBy === "day") {
              const row = rows.find((r) => r.date === key);
              return toCount(row?.[bot.key]);
            } else if (groupBy === "week") {
              const weekStart = new Date(key);
              const weekEnd = new Date(key);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return rows
              .filter((r) => {
                const d = new Date(r.date);
                return d >= weekStart && d <= weekEnd;
              })
              .reduce((sum, r) => sum + toCount(r[bot.key]), 0);
          } else {
            return rows
              .filter((r) => r.date.startsWith(key))
              .reduce((sum, r) => sum + toCount(r[bot.key]), 0);
          }
        });
        total = values.reduce((a, b) => a + b, 0);
        }
      }

      return { ...bot, values, total };
    });
  }, [rows, logs, dateKeys, groupBy, start]);

  const xLabels = dateKeys.map((k) => formatXLabel(k, groupBy));

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center bg-white p-10 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-zinc-100 max-w-md">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Truy cập bị từ chối</h2>
          <p className="text-zinc-500 mb-8">{error}</p>
          <a href="/login" className="inline-block bg-zinc-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-black transition-colors">
            Quay lại trang Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 xl:p-12 xl:pt-16">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Thống kê hoạt động Bot</h1>
            <p className="text-sm text-zinc-500 mt-1">Theo dõi hiệu suất vận hành của 7 bot tự động</p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  period === p.value
                    ? "bg-white shadow-sm text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats Unified Banner */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-3xl p-6 border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all duration-300 mb-8 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
          
          <div className="w-full md:w-1/5 px-2 py-3 md:py-0 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">Tổng hành động</span>
            </div>
            <div className="text-3xl font-bold text-zinc-900">{(successCount + errorCount).toLocaleString()}</div>
          </div>

          <div className="w-full md:w-1/5 px-2 py-3 md:py-0 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">Log Thành công</span>
            </div>
            <div className="text-3xl font-bold text-zinc-900">{successCount.toLocaleString()}</div>
          </div>

          <div className="w-full md:w-1/5 px-2 py-3 md:py-0 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">Log Lỗi / Die</span>
            </div>
            <div className="text-3xl font-bold text-zinc-900">{errorCount.toLocaleString()}</div>
          </div>

          <div className="w-full md:w-1/5 px-2 py-3 md:py-0 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">Link Aff đã rải</span>
            </div>
            <div className="text-3xl font-bold text-zinc-900">{totalLinks.toLocaleString()}</div>
          </div>

          <div className="w-full md:w-1/5 px-2 py-3 md:py-0 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">Data Crawl (Còn/Tổng)</span>
            </div>
            <div className="text-3xl font-bold text-zinc-900">
              {remainingCrawledData.toLocaleString()}<span className="text-xl text-zinc-400">/{totalCrawledData.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Charts Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-zinc-100 p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">Đang tải dữ liệu...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {chartData.map((bot) => {
              const Icon = bot.icon;
              const maxVal = Math.max(...bot.values, 0);
              return (
                <div
                  key={bot.key}
                  className="rounded-3xl border border-transparent hover:bg-white hover:border-zinc-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] transition-all p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: bot.color + "18" }}>
                        <Icon className="w-4 h-4" style={{ color: bot.color }} />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-800 text-sm">{bot.label}</div>
                        <div className="text-xs text-zinc-400">Tổng: {bot.total} lần</div>
                      </div>
                    </div>
                    <div
                      className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ background: bot.color + "15", color: bot.color }}
                    >
                      Đỉnh: {maxVal}{period === "today" ? "/giờ" : (period === "7d" || period === "30d") ? "/ngày" : period === "3m" ? "/tuần" : "/tháng"}
                    </div>
                  </div>
                  <AreaChart
                    data={bot.values}
                    labels={xLabels}
                    color={bot.color}
                    height={100}
                  />
                </div>
              );
            })}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-16 text-center mt-6">
            <div className="text-4xl mb-3">📊</div>
            <div className="font-medium text-zinc-600">Chưa có dữ liệu trong khoảng này</div>
            <div className="text-sm text-zinc-400 mt-1">Chạy bot một vài lần rồi quay lại đây xem nhé!</div>
          </div>
        )}

      </div>
    </div>
  );
}
