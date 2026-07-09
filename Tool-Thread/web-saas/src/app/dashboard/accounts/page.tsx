"use client";

import {
  Cookie, Link as LinkIcon, MessageCircle,
  Zap, Loader2, Bot, Play, Terminal, Trash2, Info, FileText, ChevronLeft, ChevronRight, Image as ImageIcon, Video
} from "lucide-react";
import { useState, useEffect, useRef, type ElementType } from "react";
import { supabase } from "../../../utils/supabase";
import ThreadsCrawler from "@/components/ThreadsCrawler";
import { showToast } from "@/components/Toast";

/* ─── Types ─────────────────────────────────────────── */
interface FormData { fb_cookie: string; threads_cookie: string; affiliate_links: string; tele_chat_id: string; target_channels: string; }
interface LogEntry { time: string; level: "INFO" | "SUCCESS" | "WARN" | "ERROR"; msg: string; }
interface ParsedLink { aff_link: string; title: string; image_url: string; suggested_comment: string; }

/* ─── Helpers ────────────────────────────────────────── */
const now = () => new Date().toLocaleTimeString("vi-VN", { hour12: false });

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  INFO: "text-zinc-400", SUCCESS: "text-emerald-400", WARN: "text-amber-400", ERROR: "text-red-400",
};
const LEVEL_BG: Record<LogEntry["level"], string> = {
  INFO: "bg-white/5 text-zinc-400", SUCCESS: "bg-emerald-500/10 text-emerald-400",
  WARN: "bg-amber-500/10 text-amber-400", ERROR: "bg-red-500/10 text-red-400",
};

/* ─── Status Dot ─── */
function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative w-2 h-2 rounded-full shrink-0" style={{ background: active ? '#059669' : '#D1D5DB' }}>
      {active && <span className="absolute -inset-1 rounded-full border-[1.5px] border-emerald-500 animate-ping opacity-40" />}
    </span>
  );
}

function StatusPill({ active, label = "SAVED" }: { active: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-gray-200 bg-gray-50 text-gray-400"
      }`}>
      <StatusDot active={active} />
      {active ? label : "UNSAVED"}
    </span>
  );
}

function CardTitle({
  icon: Icon,
  title,
  subtitle,
  active,
  tone = "blue",
}: {
  icon: ElementType;
  title: string;
  subtitle: string;
  active?: boolean;
  tone?: "blue" | "emerald" | "violet" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
  }[tone];

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClass}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-gray-950 tracking-tight">{title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{subtitle}</p>
        </div>
      </div>
      {typeof active === "boolean" && <StatusPill active={active} />}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────── */
export default function AccountsPage() {
  const [loading, setLoading] = useState(true);
  const [triggeringType, setTriggeringType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [userCredits, setUserCredits] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({ fb_cookie: "", threads_cookie: "", affiliate_links: "", tele_chat_id: "", target_channels: "" });
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([]);
  const [globalLogs, setGlobalLogs] = useState<LogEntry[]>([{ time: now(), level: "INFO", msg: "Hệ thống sẵn sàng." }]);
  const [fbLogs, setFbLogs] = useState<LogEntry[]>([{ time: now(), level: "INFO", msg: "FB System khởi động..." }]);
  const [threadsLogs, setThreadsLogs] = useState<LogEntry[]>([{ time: now(), level: "INFO", msg: "Threads System khởi động..." }]);
  const [threadsPosts, setThreadsPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"global" | "fb" | "threads">("global");
  const [pausedCarousel, setPausedCarousel] = useState<"global" | "fb" | "threads" | null>(null);
  const shopeeCarouselRef = useRef<HTMLDivElement>(null);
  const fbStoryCarouselRef = useRef<HTMLDivElement>(null);
  const threadsPosterCarouselRef = useRef<HTMLDivElement>(null);

  const scrollShopee = (direction: "left" | "right") => {
    scrollLoopCarousel(shopeeCarouselRef.current, direction, 280);
  };

  const scrollFbStory = (direction: "left" | "right") => {
    scrollLoopCarousel(fbStoryCarouselRef.current, direction, 300);
  };

  const scrollThreadsPoster = (direction: "left" | "right") => {
    scrollLoopCarousel(threadsPosterCarouselRef.current, direction, 360);
  };

  const scrollLoopCarousel = (el: HTMLDivElement | null, direction: "left" | "right", step: number) => {
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const loopWidth = el.scrollWidth / 2;
    if (direction === "left" && el.scrollLeft <= step) {
      el.scrollTo({ left: loopWidth + el.scrollLeft, behavior: "instant" });
    }
    if (direction === "right" && el.scrollLeft >= loopWidth - step) {
      el.scrollTo({ left: el.scrollLeft - loopWidth, behavior: "instant" });
    }
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  useEffect(() => {
    const getActiveCarousel = () => {
      if (activeTab === "global") return { el: shopeeCarouselRef.current, step: 280 };
      if (activeTab === "fb") return { el: fbStoryCarouselRef.current, step: 300 };
      return { el: threadsPosterCarouselRef.current, step: 360 };
    };

    const timer = window.setInterval(() => {
      if (pausedCarousel === activeTab) return;
      const { el, step } = getActiveCarousel();
      if (!el || el.scrollWidth <= el.clientWidth) return;
      const loopWidth = el.scrollWidth / 2;
      if (el.scrollLeft >= loopWidth) {
        el.scrollTo({ left: el.scrollLeft - loopWidth, behavior: "instant" });
      }
      el.scrollBy({ left: step, behavior: "smooth" });
    }, 3200);

    return () => window.clearInterval(timer);
  }, [activeTab, pausedCarousel]);

  const carouselPauseHandlers = (tab: "global" | "fb" | "threads") => ({
    onPointerEnter: () => setPausedCarousel(tab),
    onPointerLeave: () => setPausedCarousel(prev => prev === tab ? null : prev),
    onPointerDown: () => setPausedCarousel(tab),
    onPointerUp: () => setPausedCarousel(prev => prev === tab ? null : prev),
    onTouchStart: () => setPausedCarousel(tab),
    onTouchEnd: () => setPausedCarousel(prev => prev === tab ? null : prev),
  });

  const globalLogContainerRef = useRef<HTMLDivElement>(null);
  const fbLogContainerRef = useRef<HTMLDivElement>(null);
  const threadsLogContainerRef = useRef<HTMLDivElement>(null);

  const pushGlobalLog = (level: LogEntry["level"], msg: string) => setGlobalLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushFbLog = (level: LogEntry["level"], msg: string) => setFbLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushThreadsLog = (level: LogEntry["level"], msg: string) => setThreadsLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushLog = (level: LogEntry["level"], msg: string, target: "global" | "fb" | "threads" | "both" = "both") => {
    if (target === "global") pushGlobalLog(level, msg);
    if (target === "fb" || target === "both") pushFbLog(level, msg);
    if (target === "threads" || target === "both") pushThreadsLog(level, msg);
  };

  useEffect(() => {
    globalLogContainerRef.current?.scrollTo({ top: globalLogContainerRef.current.scrollHeight, behavior: "smooth" });
  }, [globalLogs]);

  const [threadsTotalCount, setThreadsTotalCount] = useState<number>(0);

  useEffect(() => {
    fbLogContainerRef.current?.scrollTo({ top: fbLogContainerRef.current.scrollHeight, behavior: "smooth" });
  }, [fbLogs]);
  useEffect(() => {
    threadsLogContainerRef.current?.scrollTo({ top: threadsLogContainerRef.current.scrollHeight, behavior: "smooth" });
  }, [threadsLogs]);

  const fetchThreadsPosts = async (uid: string) => {
    const { count } = await supabase.from('crawl_data').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('posted', false);
    setThreadsTotalCount(count || 0);
    const { data: cData } = await supabase.from('crawl_data').select('*').eq('user_id', uid).eq('posted', false).order('created_at', { ascending: false }).limit(20);
    if (cData) setThreadsPosts(cData);
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); pushLog("ERROR", "Chưa đăng nhập!"); return; }
      setUserId(user.id);
      setUserEmail(user.email || null);
      const { data, error } = await supabase.from("profiles").select("fb_cookie, threads_cookie, affiliate_links, tele_chat_id, tier, parsed_affiliate_links, target_channels, credits").eq("id", user.id).single();
      if (!error && data) {
        setUserTier(data.tier || "free");
        setUserCredits(data.credits || 0);
        setFormData({ fb_cookie: data.fb_cookie || "", threads_cookie: data.threads_cookie || "", affiliate_links: data.affiliate_links || "", tele_chat_id: data.tele_chat_id || "", target_channels: data.target_channels || "" });
        setParsedLinks(data.parsed_affiliate_links || []);
        pushLog("SUCCESS", `Đã tải profile. Tier: ${(data.tier || "free").toUpperCase()}`, "global");
        if (data.fb_cookie) pushLog("INFO", "FB Cookie: Đã cấu hình ✓", "fb");
        if (data.threads_cookie) pushLog("INFO", "Threads Cookie: Đã cấu hình ✓", "threads");
      }
      setLoading(false);
      await fetchThreadsPosts(user.id);
    }
    load();
  }, []);

  const handleUpdatePostText = (id: string, newText: string) => {
    setThreadsPosts(prev => prev.map(p => p.id === id ? { ...p, text_content: newText } : p));
  };
  const handleRemovePostImage = (id: string, imgIdx: number) => {
    setThreadsPosts(prev => prev.map(p => {
      if (p.id === id) { const newUrls = [...(p.image_urls || [])]; newUrls.splice(imgIdx, 1); return { ...p, image_urls: newUrls }; }
      return p;
    }));
  };
  const handleSavePost = async (post: any) => {
    pushLog("INFO", `Đang lưu bài viết...`, "threads");
    const { error } = await supabase.from('crawl_data').update({ text_content: post.text_content, image_urls: post.image_urls }).eq('id', post.id);
    if (error) {
      pushLog("ERROR", `Lỗi lưu bài viết: ${error.message}`, "threads");
      showToast(`Lỗi lưu bài viết: ${error.message}`);
      return false;
    }
    pushLog("SUCCESS", `Đã lưu thay đổi bài viết.`, "threads");
    showToast("Đã lưu thay đổi bài viết thành công.");
    return true;
  };
  const handleDeletePost = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá bài viết này không?")) return;
    pushLog("INFO", `Đang xoá bài viết...`, "threads");
    const { error } = await supabase.from('crawl_data').delete().eq('id', id);
    if (error) { pushLog("ERROR", `Lỗi xoá bài viết: ${error.message}`, "threads"); return; }
    setThreadsPosts(prev => prev.filter(p => p.id !== id));
    setThreadsTotalCount(prev => Math.max(0, prev - 1));
    pushLog("SUCCESS", `Đã xoá bài viết vĩnh viễn.`, "threads");
  };
  const handlePostToThreads = async (post: any) => {
    showToast("Vui lòng không ghim bài viết nào ở trang cá nhân để bot chạy chính xác nhất nhé sếp!");
    const saved = await handleSavePost(post);
    if (saved) handleTrigger("threads_post_" + post.id);
  };

  // Realtime
  const handleUpdateParsedLinkText = (index: number, newText: string) => {
    setParsedLinks(prev => prev.map((p, i) => i === index ? { ...p, suggested_comment: newText } : p));
  };
  const handleSaveParsedLink = async () => {
    pushLog("INFO", `Đang lưu thay đổi Shopee Data...`, "global");
    const { error } = await supabase.from('profiles').update({ parsed_affiliate_links: parsedLinks }).eq('id', userId);
    if (error) {
      pushLog("ERROR", `Lỗi lưu Shopee Data: ${error.message}`, "global");
      showToast(`Lỗi lưu Shopee Data: ${error.message}`);
      return false;
    }
    pushLog("SUCCESS", `Đã lưu Shopee Data thành công.`, "global");
    showToast("Đã lưu Shopee Data thành công.");
    return true;
  };
  const handleDeleteParsedLink = async (index: number) => {
    if (!confirm("Xoá link này khỏi danh sách?")) return;
    pushLog("INFO", `Đang xoá link...`, "global");
    const updated = parsedLinks.filter((_, i) => i !== index);
    const { error } = await supabase.from('profiles').update({ parsed_affiliate_links: updated }).eq('id', userId);
    if (error) { pushLog("ERROR", `Lỗi xoá link: ${error.message}`, "global"); return; }
    setParsedLinks(updated);
    pushLog("SUCCESS", `Đã xoá link thành công.`, "global");
  };

  useEffect(() => {
    if (!userEmail) return;
    const channel = supabase.channel('realtime_logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bot_logs', filter: `email=eq.${userEmail}` }, (payload) => {
      const newLog = payload.new;
      let level: LogEntry["level"] = "INFO";
      if (newLog.level === 'error') level = "ERROR";
      if (newLog.level === 'success') level = "SUCCESS";
      if (newLog.level === 'warn') level = "WARN";
      const timeStr = new Date(newLog.created_at).toLocaleTimeString("vi-VN", { hour12: false });
      const prefix = newLog.bot_type ? `[${newLog.bot_type.toUpperCase()}] ` : '';

      if (newLog.bot_type && newLog.bot_type.includes('threads')) {
        setThreadsLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);

        if (newLog.level === 'success' && newLog.bot_type === 'threads_post' && newLog.message.includes('ID:')) {
          const match = newLog.message.match(/\[ID:\s*([a-zA-Z0-9-]+)\]/);
          if (match && match[1]) {
            const postedId = match[1];
            setThreadsPosts(prev => prev.filter(p => p.id !== postedId));
            setThreadsTotalCount(prev => Math.max(0, prev - 1));
          }
          supabase.from('crawl_data').select('*').eq('user_id', userId).eq('posted', false).order('created_at', { ascending: false }).limit(20).then(({ data }) => { if (data) setThreadsPosts(data); });
        }
      } else if (newLog.bot_type === 'parse_links') {
        setGlobalLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
      } else {
        setFbLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
      }
      if (newLog.bot_type === 'parse_links' && newLog.level === 'success') {
        supabase.from("profiles").select("parsed_affiliate_links").eq("email", userEmail).single().then(({ data }) => { if (data && data.parsed_affiliate_links) setParsedLinks(data.parsed_affiliate_links); });
      }
    }).subscribe();

    // Realtime lắng nghe dữ liệu crawl mới nhất
    const crawlChannel = supabase.channel('realtime_crawl_data')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crawl_data', filter: `user_id=eq.${userId}` }, (payload) => {
        setThreadsPosts(prev => {
          // Bỏ qua nếu đã tồn tại
          if (prev.find(p => p.id === payload.new.id)) return prev;
          return [payload.new, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
        });
        setThreadsTotalCount(prev => prev + 1);
      }).subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(crawlChannel);
    };
  }, [userEmail, userId]);

  const handleSave = async () => {
    if (!userId) return;

    // Tự động lọc trùng và làm sạch link rỗng
    const rawLinks = formData.affiliate_links.split("\n").map(l => l.trim()).filter(Boolean);
    const uniqueLinks = Array.from(new Set(rawLinks));
    const cleanedText = uniqueLinks.join("\n");

    if (cleanedText !== formData.affiliate_links) {
      setFormData(prev => ({ ...prev, affiliate_links: cleanedText }));
    }

    const payloadToSave = { ...formData, affiliate_links: cleanedText };

    const getMaxLinks = (tier: string) => { if (tier === 'lite') return 3; if (tier === 'plus') return 10; if (tier === 'pro') return 20; if (tier === 'promax') return 9999; return 2; };
    const maxLinks = getMaxLinks(userTier);
    const linkCount = uniqueLinks.length;
    if (linkCount > maxLinks) {
      showToast(`Lỗi: Gói ${userTier.toUpperCase()} chỉ được tối đa ${maxLinks} link (Bạn nhập ${linkCount}). Hãy nâng cấp gói hoặc xoá bớt link!`);
      pushLog("ERROR", `Lỗi: Gói ${userTier.toUpperCase()} chỉ được tối đa ${maxLinks} link.`, "global");
      return;
    }
    setSaving(true);
    pushLog("INFO", "Đang lưu cấu hình...", "global");
    pushLog("INFO", "Đang lưu cấu hình...", "fb");
    pushLog("INFO", "Đang lưu cấu hình...", "threads");

    const { error } = await supabase.from("profiles").update(payloadToSave).eq("id", userId);
    if (error) {
      pushLog("ERROR", `Lưu thất bại: ${error.message}`, "global");
      pushLog("ERROR", `Lưu thất bại: ${error.message}`, "fb");
      pushLog("ERROR", `Lưu thất bại: ${error.message}`, "threads");
      showToast(`Lưu thất bại: ${error.message}`);
    } else {
      pushLog("SUCCESS", "Cấu hình đã được lưu thành công.", "global");
      pushLog("SUCCESS", "Cấu hình đã được lưu thành công.", "fb");
      pushLog("SUCCESS", "Cấu hình đã được lưu thành công.", "threads");
      showToast("Cấu hình đã được lưu thành công.");
    }
    setSaving(false);
  };

  const handleTrigger = async (botType: string) => {
    const isThreads = botType.includes('threads');
    const isGlobal = botType === 'parse_links';
    const target = isGlobal ? 'global' : (isThreads ? 'threads' : 'fb');
    if (!userId) { pushLog("WARN", "Chưa đăng nhập!", target); return; }

    try {
      if (userTier !== 'promax') {
        const today = new Date().toLocaleDateString("en-CA");
        const [{ data: stat }, { data: limitData }] = await Promise.all([
          supabase.from("usage_stats").select("*").eq("user_id", userId).eq("date", today).maybeSingle(),
          supabase.from("tier_limits").select("*").eq("tier", userTier).maybeSingle()
        ]);

        let isOverLimit = false;
        let limitMsg = "";
        const safeCount = (v: any) => typeof v === 'number' ? v : 0;

        if (botType.includes('threads_post')) {
          const used = safeCount(stat?.threads_posts_count);
          let limit = limitData?.threads_post_per_day ?? limitData?.reels_per_day ?? 2;
          if (limit !== -1 && used >= limit) { isOverLimit = true; limitMsg = `Hết lượt Đăng Threads (${used}/${limit}).`; }
        } else if (botType.includes('threads_comment')) {
          const used = safeCount(stat?.threads_commented);
          const limit = safeCount(limitData?.threads_per_day);
          if (limit !== -1 && used >= limit) { isOverLimit = true; limitMsg = `Hết lượt Comment Threads (${used}/${limit}).`; }
        } else if (botType.includes('fb_story') || botType.includes('fb_post') || botType === 'fb_bot') {
          const used = Math.max(safeCount(stat?.fb_story_posted), safeCount(stat?.fb_posts_count));
          const limit = limitData?.fb_story_per_day ?? limitData?.fb_post_per_day ?? 3;
          if (limit !== -1 && used >= limit) { isOverLimit = true; limitMsg = `Hết lượt đăng FB (${used}/${limit}).`; }
        } else if (botType.includes('reels')) {
          const used = safeCount(stat?.reels_posted);
          const limit = safeCount(limitData?.reels_per_day);
          if (limit !== -1 && used >= limit) { isOverLimit = true; limitMsg = `Hết lượt Up Reels (${used}/${limit}).`; }
        }

        if (isOverLimit) {
          showToast(limitMsg + " Vui lòng nâng cấp gói!");
          pushLog("ERROR", limitMsg + " Yêu cầu đã bị huỷ.", target);
          return;
        }
      }
    } catch (e) {
      console.error('Limit check error:', e);
    }

    if (isThreads && !formData.threads_cookie) { pushLog("WARN", "Thiếu Threads Cookie!", target); return; }
    else if (!isThreads && !isGlobal && !formData.fb_cookie) { pushLog("WARN", "Thiếu FB Cookie!", target); return; }
    setTriggeringType(botType);
    pushLog("INFO", `Đang kích hoạt Bot [${botType.toUpperCase()}]...`, target);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/trigger-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email: userEmail, botType: botType.split('_card')[0] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      pushLog("SUCCESS", `Bot [${botType.toUpperCase().replace('_CARD', '')}] đã được kích hoạt thành công!`, target);
      pushLog("INFO", "Theo dõi tiến trình qua Telegram Bot của bạn.", target);
    } catch (e: any) { pushLog("ERROR", e.message || "Kích hoạt thất bại.", target); }
    finally { setTriggeringType(null); }
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="space-y-2 text-center">
            <div className="skeleton h-4 w-44 mx-auto" />
            <div className="skeleton h-3 w-28 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Shared Styles ─── */
  const cardClass = "bg-white rounded-[32px] transition-all duration-500 border-none shadow-none";
  const inputClass = "w-full bg-zinc-50/80 rounded-2xl p-4 text-[13.5px] font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-[4px] focus:ring-blue-500/10 transition-all border-none shadow-none appearance-none";
  const editorCardClass = "bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[32px] p-5 relative group/post shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:bg-white/80 hover:border-white transition-all duration-500 ring-1 ring-black/[0.02]";
  const btnPrimary = "btn-shimmer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm shadow-blue-600/25 hover:shadow-md hover:shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";
  const btnSecondary = "btn-shimmer flex items-center justify-center gap-2 bg-white/80 backdrop-blur-md border border-white/60 text-gray-700 font-semibold text-[13px] rounded-2xl transition-all hover:-translate-y-0.5 hover:bg-white active:translate-y-0 active:scale-[0.98] shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";
  const btnGreen = "btn-shimmer flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm shadow-emerald-600/25 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";
  const btnViolet = "btn-shimmer flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm shadow-violet-600/25 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";

  const renderInlineTerminal = (tab: "global" | "fb" | "threads") => {
    const logs = tab === "global" ? globalLogs : tab === "fb" ? fbLogs : threadsLogs;
    const containerRef = tab === "global" ? globalLogContainerRef : tab === "fb" ? fbLogContainerRef : threadsLogContainerRef;
    const clearLogs = () => {
      if (tab === "global") setGlobalLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
      if (tab === "fb") setFbLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
      if (tab === "threads") setThreadsLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
    };

    return (
      <div className="h-[200px] shrink-0 overflow-hidden rounded-[24px] bg-[#0A0A0A] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border border-white/10 flex flex-col relative z-20">
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.06] shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/90 font-medium">
              {tab === "global" ? "Global Logs" : tab === "fb" ? "FB Logs" : "Threads Logs"}
            </span>
          </div>
          <button onClick={clearLogs} className="text-zinc-500 hover:text-white transition-colors" title="Clear Terminal">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[12px] bg-transparent">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 hover:bg-white/[0.03] px-2.5 py-1 rounded-lg transition-colors -mx-2.5">
              <span className="text-zinc-600 shrink-0 tabular-nums">[{log.time}]</span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0 ${LEVEL_BG[log.level]}`}>{log.level}</span>
              <span className={`${LEVEL_COLOR[log.level]} break-words leading-relaxed`}>{log.msg}</span>
            </div>
          ))}

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ── HEADER ── */}
      <header className="sticky top-[52px] md:top-0 z-40 px-4 md:px-6 h-14 flex items-center justify-center bg-white/95 backdrop-blur-xl">
        <nav className="flex items-center gap-8 justify-center">
          {(["global", "fb", "threads"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`text-[14px] font-medium transition-colors ${activeTab === t
                  ? "text-zinc-900 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              {t === "global" ? "Cấu Hình" : t === "fb" ? "Facebook" : "Threads"}
            </button>
          ))}
        </nav>
      </header>

      {/* ── WORKSPACE ── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-0 md:px-8 py-4 md:py-8">

        {/* ═══ CẤU HÌNH CHUNG ═══ */}
        {activeTab === "global" && (
          <div className="anim-fade-up px-4 md:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="space-y-6 h-full">


                <div className={`${cardClass} p-2 md:p-8 anim-fade-up anim-d1 flex flex-col`}>
                  {/* Cấu Hình Mạng Lưới */}
                  <div className="mb-6">
                    <CardTitle
                      icon={LinkIcon}
                      title="Affiliate Link Pool"
                      subtitle="Dán danh sách link, hệ thống tự lọc trùng và sinh nội dung bán hàng."
                      active={!!formData.affiliate_links}
                      tone="blue"
                    />
                  </div>
                  <textarea rows={4} value={formData.affiliate_links} onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} onBlur={handleSave} placeholder={"Nhập mỗi link 1 dòng.\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} className={`${inputClass} resize-none mb-6`} />
                  <button onClick={() => handleTrigger("parse_links")} disabled={triggeringType !== null || !formData.affiliate_links} className={`${btnPrimary} w-full py-3.5 rounded-[16px]`}>
                    {triggeringType === "parse_links" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    Đồng Bộ Tên & Sinh Comment AI
                  </button>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent my-10"></div>

                  {/* Thông báo Telegram */}
                  <div className="mb-6">
                    <CardTitle
                      icon={MessageCircle}
                      title="Telegram Notify"
                      subtitle="Nhận log chạy bot, cảnh báo lỗi cookie và báo cáo ngay trên Telegram."
                      active={!!formData.tele_chat_id}
                      tone="emerald"
                    />
                  </div>
                  <input type="text" value={formData.tele_chat_id} onChange={(e) => {
                    if (userTier === "free" || userTier === "lite") {
                      showToast("Gói Free và Lite không hỗ trợ nhận thông báo. Vui lòng nâng cấp lên gói Plus hoặc cao hơn.");
                      return;
                    }
                    setFormData({ ...formData, tele_chat_id: e.target.value })
                  }} onBlur={handleSave} placeholder="Chat ID — nhắn @userinfobot để lấy" className={inputClass} />
                  <div className="mt-5 rounded-2xl bg-emerald-50/50 px-5 py-4 text-[13px] text-emerald-700 leading-relaxed border-none shadow-none">
                    Bot sẽ gửi thông báo realtime khi đăng bài thành công, lỗi cookie hoặc hoàn tất crawl định kỳ.
                  </div>
                </div>
              </div>

              {/* Right Column Wrapper */}
              <div className="flex flex-col gap-5 h-[700px] lg:h-full lg:min-h-[660px] overflow-hidden">
                {/* Shopee Editor (AI Parsing Results) */}
                {parsedLinks.length > 0 && (
                  <div className={`${cardClass} p-2 md:p-5 flex flex-col h-[480px] shrink-0 min-h-0 overflow-hidden anim-fade-up anim-d3`}>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle
                        icon={FileText}
                        title="Shopee Data"
                        subtitle="Duyệt lại tiêu đề, ảnh và comment trước khi bot sử dụng."
                        tone="emerald"
                      />
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-mono text-emerald-600 font-semibold">{parsedLinks.length} items</span>
                    </div>

                    <div className="relative flex-1 min-h-0">
                      <button onClick={() => scrollShopee('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                        <ChevronLeft className="w-5 h-5 pr-0.5" />
                      </button>
                      <button onClick={() => scrollShopee('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                        <ChevronRight className="w-5 h-5 pl-0.5" />
                      </button>

                      <div ref={shopeeCarouselRef} {...carouselPauseHandlers("global")} className="flex overflow-x-auto overflow-y-hidden gap-4 h-full snap-x snap-mandatory pb-2 -mx-2 md:-mx-5 px-2 md:px-5 [&::-webkit-scrollbar]:hidden">
                        {[...parsedLinks, ...parsedLinks].map((p, i) => {
                          const sourceIndex = i % parsedLinks.length;
                          return (
                            <div key={`shopee-${i}`} className="w-[75vw] md:w-[320px] shrink-0 min-h-full flex flex-col snap-center group/post">
                              <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden mb-5 bg-gray-900 border border-black/[0.03]">
                                <img src={p.image_url} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110" />
                                <img src={p.image_url} alt={p.title || "Shopee product"} className="relative h-full w-full object-contain" />
                                <button onClick={() => handleDeleteParsedLink(sourceIndex)} className="absolute top-4 right-4 bg-white/40 backdrop-blur-md hover:bg-red-500 text-gray-700 hover:text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10 shadow-sm" title="Xoá">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <h3 className="text-[16px] font-semibold text-gray-900 leading-tight mb-2 line-clamp-2 pr-4">{p.title}</h3>
                              <textarea className="w-full bg-transparent border-none p-0 text-[14px] text-gray-500 resize-none outline-none leading-relaxed min-h-[60px] placeholder:text-gray-300 focus:ring-0 mb-4" value={p.suggested_comment} onChange={(e) => handleUpdateParsedLinkText(sourceIndex, e.target.value)} placeholder="Nội dung thả thính..." />

                              <div className="mt-auto flex justify-end gap-4 items-center pt-2">
                                <span className="text-[12px] text-gray-400 font-mono truncate max-w-[140px] mr-auto">{p.aff_link}</span>
                                <button onClick={handleSaveParsedLink} className="text-[14px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors group">
                                  Lưu thay đổi <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {renderInlineTerminal("global")}
              </div>
            </div>



          </div>
        )}

        {/* ═══ FACEBOOK ═══ */}
        {activeTab === "fb" && (
          <div className="anim-fade-up px-4 md:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="space-y-5 h-full">
                <div className={`${cardClass} p-2 md:p-8 flex flex-col justify-between anim-fade-up anim-d1`}>
                  <div>
                    <div className="mb-6">
                      <CardTitle
                        icon={Video}
                        title="Kênh Video Nguồn"
                        subtitle="Thêm kênh YouTube, TikTok hoặc Reels để bot quét video mới."
                        active={!!formData.target_channels}
                        tone="blue"
                      />
                    </div>
                    <textarea rows={3} value={formData.target_channels} onChange={(e) => setFormData({ ...formData, target_channels: e.target.value })} onBlur={handleSave} placeholder={"Nhập mỗi link kênh 1 dòng\nVí dụ: https://www.tiktok.com/@channel"} className={`${inputClass} resize-none mb-2`} />
                    <div className="mb-8 mt-3 flex items-start gap-3 rounded-2xl bg-blue-50/50 px-4 py-3 text-[13px] text-blue-700 leading-relaxed border-none shadow-none">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Hỗ trợ quét video 1080p từ YouTube, TikTok, Douyin, Facebook Reels, Instagram Reels và Twitter.</span>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent my-10"></div>

                    <div className="mb-6">
                      <CardTitle
                        icon={Cookie}
                        title="FB Access Cookie"
                        subtitle="Cookie dùng để đăng Reels, Story và chạy comment trên Facebook."
                        active={!!formData.fb_cookie}
                        tone="emerald"
                      />
                    </div>
                    <textarea rows={3} value={formData.fb_cookie} onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} onBlur={handleSave} placeholder="c_user=...; xs=...; datr=...;" className={`${inputClass} text-emerald-700 font-semibold resize-none mb-8 focus:border-emerald-500 focus:ring-emerald-500/10`} />
                    <div className="flex flex-col gap-3">
                      <button onClick={() => handleTrigger("reels")} disabled={triggeringType !== null || !formData.fb_cookie} className={`${btnSecondary} py-3.5 w-full rounded-[16px]`}>
                        {triggeringType === "reels" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        FB Reels
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-[740px] lg:h-full lg:min-h-[740px] flex-col gap-5">
                {parsedLinks.length > 0 ? (
                  <div className={`${cardClass} p-5 flex flex-col h-[540px] shrink-0 lg:min-h-0 overflow-hidden anim-fade-up anim-d3`}>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <CardTitle
                        icon={ImageIcon}
                        title="FB Story Poster"
                        subtitle="Danh sách sản phẩm dùng để dựng story bán hàng."
                        tone="purple"
                      />
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-[11px] font-mono text-purple-600 font-semibold">{parsedLinks.length} items</span>
                    </div>
                    <div className="relative flex-1 min-h-0">
                      <button onClick={() => scrollFbStory('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                        <ChevronLeft className="w-5 h-5 pr-0.5" />
                      </button>
                      <button onClick={() => scrollFbStory('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                        <ChevronRight className="w-5 h-5 pl-0.5" />
                      </button>

                      <div ref={fbStoryCarouselRef} {...carouselPauseHandlers("fb")} className="flex overflow-x-auto overflow-y-hidden gap-4 md:gap-6 h-full snap-x snap-mandatory pb-2 -mx-2 md:-mx-8 px-2 md:px-8 [&::-webkit-scrollbar]:hidden">
                        {[...parsedLinks, ...parsedLinks].map((p, i) => {
                          const sourceIndex = i % parsedLinks.length;
                          return (
                            <div key={`fb-story-${i}`} className="w-[75vw] md:w-[320px] shrink-0 min-h-full flex flex-col snap-center group/post">
                              <div className="relative w-full aspect-[9/16] rounded-[32px] overflow-hidden mb-5 bg-gray-900 border border-black/[0.03]">
                                <img src={p.image_url} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110" />
                                <img src={p.image_url} alt={p.title || "FB Story"} className="relative h-full w-full object-contain" />
                                <button onClick={() => handleDeleteParsedLink(sourceIndex)} className="absolute top-4 right-4 bg-white/40 backdrop-blur-md hover:bg-red-500 text-gray-700 hover:text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10 shadow-sm" title="Xoá">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <h3 className="text-[16px] font-semibold text-gray-900 leading-tight mb-2 line-clamp-2 pr-4">{p.title}</h3>
                              <textarea className="w-full bg-transparent border-none p-0 text-[14px] text-gray-500 resize-none outline-none leading-relaxed min-h-[60px] placeholder:text-gray-300 focus:ring-0 mb-4" value={p.suggested_comment} onChange={(e) => handleUpdateParsedLinkText(sourceIndex, e.target.value)} placeholder="Nội dung thả thính..." />

                              <div className="mt-auto flex justify-end gap-4 items-center pt-2 border-t border-gray-100/50">
                                <button onClick={handleSaveParsedLink} className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors px-2">Lưu</button>
                                <button onClick={() => handleTrigger("fb_story_card" + sourceIndex)} disabled={triggeringType !== null || !formData.fb_cookie} className="text-[14px] font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors group">
                                  {triggeringType === ("fb_story_card" + sourceIndex) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng FB"} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`${cardClass} p-6 flex flex-col items-center justify-center h-[540px] shrink-0 lg:min-h-0 overflow-hidden anim-fade-up anim-d3 text-center`}>
                    <ImageIcon className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-[13px] font-medium text-gray-600">Chưa có Data Shopee</p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[250px]">Hãy sang tab Cấu Hình Chung, dán link Affiliate và nhấn Đồng bộ để lấy dữ liệu nhé!</p>
                  </div>
                )}
                {renderInlineTerminal("fb")}
              </div>
            </div>
          </div>
        )}

        {/* ═══ THREADS ═══ */}
        {activeTab === "threads" && (
          <div className="anim-fade-up px-4 md:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="space-y-5 h-full">
                <ThreadsCrawler
                  userId={userId || ""}
                  tier={userTier}
                  credits={userCredits}
                  setCredits={setUserCredits}
                  pushLog={pushLog}
                  onCrawlSuccess={() => { if (userId) fetchThreadsPosts(userId); setActiveTab("threads"); }}
                />

                <div className={`${cardClass} p-2 md:p-8 anim-fade-up anim-d1`}>
                  <div className="mb-6">
                    <CardTitle
                      icon={Cookie}
                      title="Threads Access Cookie"
                      subtitle="Cookie dùng để đăng bài và chạy AI commenter trên Threads."
                      active={!!formData.threads_cookie}
                      tone="violet"
                    />
                  </div>
                  <textarea rows={4} value={formData.threads_cookie} onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} onBlur={handleSave} placeholder="sessionid=...; ds_user_id=...;" className={`${inputClass} text-violet-700 font-semibold resize-none mb-6 focus:border-violet-500 focus:ring-violet-500/10`} />
                  <button onClick={() => handleTrigger("threads")} disabled={triggeringType !== null || !formData.threads_cookie} className={`${btnViolet} w-full py-3.5 rounded-[16px]`}>
                    {triggeringType === "threads" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    Khởi động AI Commenter
                  </button>
                </div>

              </div>

              <div className="flex h-[760px] lg:h-full lg:min-h-[740px] flex-col gap-5">
                <div className={`${cardClass} p-2 md:p-6 flex flex-col h-[560px] shrink-0 lg:min-h-0 overflow-hidden anim-fade-up anim-d3`}>
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <CardTitle
                      icon={MessageCircle}
                      title="Threads Crawl Poster"
                      subtitle="Chỉnh nội dung và ảnh trước khi đăng thủ công lên Threads."
                      tone="violet"
                    />
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-[11px] font-mono text-violet-600 font-semibold">{threadsTotalCount} Bài</span>
                  </div>
                  <div className="relative flex-1 min-h-0">
                    {threadsPosts.length > 0 && (
                      <>
                        <button onClick={() => scrollThreadsPoster('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                          <ChevronLeft className="w-5 h-5 pr-0.5" />
                        </button>
                        <button onClick={() => scrollThreadsPoster('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                          <ChevronRight className="w-5 h-5 pl-0.5" />
                        </button>
                      </>
                    )}

                    <div ref={threadsPosterCarouselRef} {...carouselPauseHandlers("threads")} className="flex h-full gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-2 -mx-2 md:-mx-6 px-2 md:px-6 [&::-webkit-scrollbar]:hidden">
                      {[...threadsPosts, ...threadsPosts].map((post, i) => {
                        const hasImages = post.image_urls && post.image_urls.length > 0;
                        return (
                          <div key={`threads-${post.id}-${i}`} className="w-[75vw] md:w-[360px] shrink-0 min-h-full flex flex-col snap-center group/post">
                            {hasImages ? (
                              <div className="relative w-full aspect-video rounded-[32px] overflow-hidden mb-5 bg-gray-900 border border-black/[0.03] group/img-carousel">
                                {post.image_urls.length > 1 && (
                                  <>
                                    <button onClick={(e) => {
                                      const c = e.currentTarget.parentElement?.querySelector('.scroll-container');
                                      if (c) c.scrollBy({ left: -c.clientWidth, behavior: 'smooth' });
                                    }} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:text-black hover:bg-white opacity-0 group-hover/img-carousel:opacity-100 transition-all shadow-sm">
                                      <ChevronLeft className="w-4 h-4 pr-0.5" />
                                    </button>
                                    <button onClick={(e) => {
                                      const c = e.currentTarget.parentElement?.querySelector('.scroll-container');
                                      if (c) c.scrollBy({ left: c.clientWidth, behavior: 'smooth' });
                                    }} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:text-black hover:bg-white opacity-0 group-hover/img-carousel:opacity-100 transition-all shadow-sm">
                                      <ChevronRight className="w-4 h-4 pl-0.5" />
                                    </button>
                                  </>
                                )}
                                <div className="scroll-container flex h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                                  {post.image_urls.map((url: string, idx: number) => (
                                    <div key={idx} className="w-full h-full shrink-0 snap-center relative group/img">
                                      <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110" />
                                      <img src={url} alt="Threads media" className="relative h-full w-full object-contain" />
                                      <button onClick={() => handleRemovePostImage(post.id, idx)} className="absolute bottom-4 right-4 bg-white/40 backdrop-blur-md hover:bg-red-500 text-gray-700 hover:text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all shadow-md">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => handleDeletePost(post.id)} className="absolute top-4 right-4 bg-white/40 backdrop-blur-md hover:bg-red-500 text-gray-700 hover:text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10 shadow-sm" title="Xoá Post">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-full aspect-video rounded-[32px] overflow-hidden mb-5 bg-gradient-to-br from-violet-100 to-indigo-50 flex flex-col items-center justify-center p-6">
                                <MessageCircle className="w-12 h-12 text-violet-300 mb-3" />
                                <p className="text-violet-400 font-medium text-sm">Text Only Post</p>
                                <button onClick={() => handleDeletePost(post.id)} className="absolute top-4 right-4 bg-white/40 backdrop-blur-md hover:bg-red-500 text-gray-700 hover:text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10 shadow-sm" title="Xoá">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            <textarea className="w-full bg-transparent border-none p-0 text-[15px] font-medium text-gray-900 resize-none outline-none leading-relaxed min-h-[80px] placeholder:text-gray-300 focus:ring-0 mb-4" value={post.text_content} onChange={(e) => handleUpdatePostText(post.id, e.target.value)} placeholder="Nội dung bài viết..." />

                            <div className="mt-auto flex justify-end gap-4 items-center pt-2 border-t border-gray-100/50">
                              <button onClick={() => handleSavePost(post)} className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors px-2">Lưu</button>
                              <button onClick={() => handlePostToThreads(post)} disabled={triggeringType !== null} className="text-[14px] font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors group">
                                {triggeringType === ("threads_post_" + post.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng Threads"} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {threadsPosts.length === 0 && (
                        <div className="h-full w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 text-center text-gray-400 px-6">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm">
                            <MessageCircle className="w-5 h-5 opacity-40" />
                          </div>
                          <p className="text-sm font-medium text-gray-600">Không có dữ liệu Crawl nào.</p>
                          <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-gray-400">Chạy crawler bên trái để đưa bài mới vào hàng chờ đăng Threads.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {renderInlineTerminal("threads")}

              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
