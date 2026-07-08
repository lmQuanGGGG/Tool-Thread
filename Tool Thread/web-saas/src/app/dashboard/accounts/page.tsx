"use client";

import {
  Save, Cookie, Link as LinkIcon, MessageCircle, AlertCircle,
  Zap, Loader2, CheckCircle2, Bot, Settings, Play, Terminal, Trash2, Image, Info, FileText, LogOut, ChevronLeft, ChevronRight, X, Image as ImageIcon
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../utils/supabase";
import ThreadsCrawler from "@/components/ThreadsCrawler";

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

/* ─── Main ──────────────────────────────────────────── */
export default function AccountsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
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
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const threadsCarouselRef = useRef<HTMLDivElement>(null);
  const shopeeCarouselRef = useRef<HTMLDivElement>(null);

  const scrollShopee = (direction: "left" | "right") => {
    if (shopeeCarouselRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      shopeeCarouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollThreads = (direction: "left" | "right") => {
    if (threadsCarouselRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      threadsCarouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  const [terminalHeight, setTerminalHeight] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 150 && newHeight < window.innerHeight - 150) {
        setTerminalHeight(newHeight);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);
  const [terminalTab, setTerminalTab] = useState<"global" | "fb" | "threads">("global");

  const globalLogEndRef = useRef<HTMLDivElement>(null);
  const fbLogEndRef = useRef<HTMLDivElement>(null);
  const threadsLogEndRef = useRef<HTMLDivElement>(null);

  const pushGlobalLog = (level: LogEntry["level"], msg: string) => setGlobalLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushFbLog = (level: LogEntry["level"], msg: string) => setFbLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushThreadsLog = (level: LogEntry["level"], msg: string) => setThreadsLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushLog = (level: LogEntry["level"], msg: string, target: "global" | "fb" | "threads" | "both" = "both") => {
    if (target === "global") pushGlobalLog(level, msg);
    if (target === "fb" || target === "both") pushFbLog(level, msg);
    if (target === "threads" || target === "both") pushThreadsLog(level, msg);
  };

  useEffect(() => { globalLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [globalLogs]);

  const [threadsTotalCount, setThreadsTotalCount] = useState<number>(0);

  useEffect(() => { fbLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [fbLogs]);
  useEffect(() => { threadsLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadsLogs]);

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
    if (error) { pushLog("ERROR", `Lỗi lưu bài viết: ${error.message}`, "threads"); return false; }
    pushLog("SUCCESS", `Đã lưu bài viết thành công.`, "threads");
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
    if (error) { pushLog("ERROR", `Lỗi lưu Shopee Data: ${error.message}`, "global"); return false; }
    pushLog("SUCCESS", `Đã lưu Shopee Data thành công.`, "global");
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
          supabase.from('crawl_data').select('*').eq('user_id', userId).eq('posted', false).order('created_at', { ascending: false }).limit(20).then(({data}) => { if (data) setThreadsPosts(data); });
        }
      } else if (newLog.bot_type === 'parse_links') {
        setGlobalLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
      } else {
        setFbLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
      }
      if (newLog.bot_type === 'parse_links' && newLog.level === 'success') {
        supabase.from("profiles").select("parsed_affiliate_links").eq("email", userEmail).single().then(({data}) => { if (data && data.parsed_affiliate_links) setParsedLinks(data.parsed_affiliate_links); });
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
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
        alert(`Lỗi: Gói ${userTier.toUpperCase()} chỉ được tối đa ${maxLinks} link (Bạn nhập ${linkCount}). Hãy nâng cấp gói hoặc xoá bớt link!`);
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
    } else { 
        pushLog("SUCCESS", "Cấu hình đã được lưu thành công.", "global"); 
        pushLog("SUCCESS", "Cấu hình đã được lưu thành công.", "fb"); 
        pushLog("SUCCESS", "Cấu hình đã được lưu thành công.", "threads"); 
    }
    setSaving(false);
  };

  const handleTrigger = async (botType: string) => {
    const isThreads = botType.includes('threads');
    const isGlobal = botType === 'parse_links';
    const target = isGlobal ? 'global' : (isThreads ? 'threads' : 'fb');
    if (!userId) { pushLog("WARN", "Chưa đăng nhập!", target); return; }
    if (isThreads && !formData.threads_cookie) { pushLog("WARN", "Thiếu Threads Cookie!", target); return; }
    else if (!isThreads && !isGlobal && !formData.fb_cookie) { pushLog("WARN", "Thiếu FB Cookie!", target); return; }
    setTriggering(true);
    pushLog("INFO", `Đang kích hoạt Bot [${botType.toUpperCase()}]...`, target);
    try {
      const res = await fetch("/api/trigger-bot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: userEmail, botType }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      pushLog("SUCCESS", `Bot [${botType.toUpperCase()}] đã được kích hoạt thành công!`, target);
      pushLog("INFO", "Theo dõi tiến trình qua Telegram Bot của bạn.", target);
    } catch (e: any) { pushLog("ERROR", e.message || "Kích hoạt thất bại.", target); }
    finally { setTriggering(false); }
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
  const cardClass = "bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-300";
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-[13px] font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all";
  const btnPrimary = "btn-shimmer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm shadow-blue-600/25 hover:shadow-md hover:shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";
  const btnSecondary = "btn-shimmer flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-800 font-medium text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";
  const btnGreen = "btn-shimmer flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm shadow-emerald-600/25 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";
  const btnViolet = "btn-shimmer flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm shadow-violet-600/25 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:!translate-y-0";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 px-6 h-14 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-[13px] text-gray-900">AutoFarm</span>
            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[9px] font-mono text-gray-400 border border-gray-200/80 uppercase tracking-wider">v3.5</span>
          </div>

          {/* Tab bar */}
          <nav className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
            {(["global", "fb", "threads"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                  activeTab === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "global" ? "Cấu Hình" : t === "fb" ? "Facebook" : "Threads"}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium text-gray-600">{userEmail}</span>
            <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest font-semibold">{userTier} tier</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200/80 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{userEmail?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* ── WORKSPACE ── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-8 py-8">
        
        {/* ═══ CẤU HÌNH CHUNG ═══ */}
        {activeTab === "global" && (
          <div className="space-y-7 anim-fade-up">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Cấu Hình Chung</h1>
              <p className="text-sm text-gray-500">Quản lý kho link Affiliate và nhận thông báo qua Telegram.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                

                <div className={`${cardClass} p-6 anim-fade-up anim-d1`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Affiliate Link Pool</h3>
                    <StatusDot active={!!formData.affiliate_links} />
                  </div>
                  <textarea rows={4} value={formData.affiliate_links} onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} onBlur={handleSave} placeholder={"Nhập mỗi link 1 dòng.\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} className={`${inputClass} resize-none mb-4`} />
                  <button onClick={() => handleTrigger("parse_links")} disabled={triggering || !formData.affiliate_links} className={`${btnPrimary} w-full py-2.5`}>
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Đồng Bộ Tên & Sinh Comment AI
                  </button>
                </div>

                <div className={`${cardClass} p-6 h-fit anim-fade-up anim-d2`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Telegram Notify</h3>
                    <StatusDot active={!!formData.tele_chat_id} />
                  </div>
                  <input type="text" value={formData.tele_chat_id} onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} onBlur={handleSave} placeholder="Chat ID — nhắn @userinfobot để lấy" className={inputClass} />
                  <p className="mt-3.5 text-[12px] text-gray-400 leading-relaxed">Nhận cảnh báo real-time khi bot post bài thành công, lỗi cookie, hoặc các thống kê crawl định kỳ.</p>
                </div>
              </div>

              {/* Right Column Wrapper */}
              <div className="flex flex-col gap-6 h-[600px] lg:h-0 lg:min-h-full overflow-hidden">
                {/* Shopee Editor (AI Parsing Results) */}
                {parsedLinks.length > 0 && (
                  <div className={`${cardClass} p-6 flex flex-col flex-1 min-h-0 anim-fade-up anim-d3`}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[13px] font-semibold text-gray-900">Shopee Data (AI Parsing)</h3>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-[11px] font-mono text-emerald-600 font-semibold">{parsedLinks.length} items</span>
                    </div>
                    
                    <div className="relative flex-1 min-h-0">
                      <button onClick={() => scrollShopee('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                        <ChevronLeft className="w-5 h-5 pr-0.5" />
                      </button>
                      <button onClick={() => scrollShopee('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                        <ChevronRight className="w-5 h-5 pl-0.5" />
                      </button>
                      
                      <div ref={shopeeCarouselRef} className="flex overflow-x-auto gap-5 h-full snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden">
                        {parsedLinks.map((p, i) => (
                          <div key={i} className="w-[320px] shrink-0 h-full flex flex-col bg-gray-50 border border-gray-200/80 rounded-xl p-5 relative group/post hover:border-gray-300 hover:shadow-sm transition-all snap-center">
                            <button onClick={() => handleDeleteParsedLink(i)} className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10" title="Xoá">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            
                            <p className="text-[13px] font-semibold text-gray-900 truncate mb-1 pr-8">{p.title}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate mb-3">{p.aff_link}</p>
                            
                            <textarea className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[120px] placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-2" value={p.suggested_comment} onChange={(e) => handleUpdateParsedLinkText(i, e.target.value)} placeholder="Nội dung thả thính..." />
                            
                            <div className="mt-3 flex items-center gap-3 shrink-0">
                              <img src={p.image_url} alt="" className="h-72 w-auto rounded-xl object-cover border border-gray-200 shadow-sm" />
                            </div>
                            
                            <div className="mt-auto flex justify-end gap-2 shrink-0 border-t border-gray-200/60 pt-4">
                              <button onClick={handleSaveParsedLink} className={`${btnSecondary} text-[12px] px-4 py-1.5`}>Lưu Thay Đổi</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>



          </div>
        )}

        {/* ═══ FACEBOOK ═══ */}
        {activeTab === "fb" && (
          <div className="space-y-7 anim-fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Facebook Engine</h1>
                  <p className="text-sm text-gray-500">Thiết lập Cookie và chạy tiến trình Facebook.</p>
                </div>
                <div className={`${cardClass} p-6 min-h-[500px] flex flex-col justify-between anim-fade-up anim-d1`}>
                  <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Kênh Video Nguồn (Youtube/TikTok)</h3>
                    <StatusDot active={!!formData.target_channels} />
                  </div>
                  <textarea rows={3} value={formData.target_channels} onChange={(e) => setFormData({ ...formData, target_channels: e.target.value })} onBlur={handleSave} placeholder={"Nhập mỗi link kênh 1 dòng\nVí dụ: https://www.tiktok.com/@channel"} className={`${inputClass} resize-none mb-1`} />
                  <p className="text-[11px] text-gray-500 mb-5 leading-relaxed">
                    💡 Hỗ trợ quét và lấy video 1080p đa nền tảng: <span className="font-medium text-blue-600">YouTube, TikTok, Douyin, Facebook Reels, Instagram Reels, Twitter</span>.
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">FB Access Cookie</h3>
                    <StatusDot active={!!formData.fb_cookie} />
                  </div>
                  <textarea rows={3} value={formData.fb_cookie} onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} onBlur={handleSave} placeholder="c_user=...; xs=...; datr=...;" className={`${inputClass} text-emerald-700 font-semibold resize-none mb-5 focus:border-emerald-500 focus:ring-emerald-500/10`} />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleTrigger("reels")} disabled={triggering || !formData.fb_cookie} className={`${btnSecondary} py-2.5`}>
                      {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      FB Reels
                    </button>
                    <button onClick={() => handleTrigger("fb_story")} disabled={triggering || !formData.fb_cookie} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-sm bg-purple-500 hover:bg-purple-600">
                      {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                      FB Story
                    </button>
                    <button onClick={() => handleTrigger("fb_comment")} disabled={triggering || !formData.fb_cookie} className={`${btnGreen} py-2.5 col-span-2`}>
                      {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                      Auto Comment
                    </button>
                  </div>
                  </div>
                </div>
                
              </div>

              {parsedLinks.length > 0 ? (
                <div className={`${cardClass} p-6 flex flex-col h-[600px] lg:h-0 lg:min-h-full overflow-hidden anim-fade-up anim-d3`}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[13px] font-semibold text-gray-900">FB Story Poster (Shopee Data)</h3>
                    <span className="px-2.5 py-1 rounded-md bg-purple-50 border border-purple-100 text-[11px] font-mono text-purple-600 font-semibold">{parsedLinks.length} items</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 dim-siblings">
                    {parsedLinks.map((p, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200/80 rounded-xl p-5 relative group/post hover:border-gray-300 hover:shadow-sm transition-all">
                        <button onClick={() => handleDeleteParsedLink(i)} className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10" title="Xoá">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-[13px] font-semibold text-gray-900 truncate mb-1 pr-8">{p.title}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate mb-3">{p.aff_link}</p>
                        
                        <textarea className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[120px] mb-2 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" value={p.suggested_comment} onChange={(e) => handleUpdateParsedLinkText(i, e.target.value)} placeholder="Nội dung thả thính..." />
                        
                        <div className="mt-3 flex items-center gap-3">
                          <img src={p.image_url} alt="" className="h-72 w-auto rounded-xl object-cover border border-gray-200 shadow-sm" />
                        </div>
                        
                        <div className="mt-4 flex justify-end gap-2">
                          <button onClick={handleSaveParsedLink} className={`${btnSecondary} text-[12px] px-4 py-1.5`}>Lưu Thay Đổi</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={`${cardClass} p-6 flex flex-col items-center justify-center h-[600px] lg:h-0 lg:min-h-full overflow-hidden anim-fade-up anim-d3 text-center`}>
                  <Image className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-[13px] font-medium text-gray-600">Chưa có Data Shopee</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[250px]">Hãy sang tab Cấu Hình Chung, dán link Affiliate và nhấn Đồng bộ để lấy dữ liệu nhé!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ THREADS ═══ */}
        {activeTab === "threads" && (
          <div className="space-y-7 anim-fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Threads Workspace</h1>
                  <p className="text-sm text-gray-500">Tự động lấy bài viết và cấu hình Bot Threads.</p>
                </div>

                <ThreadsCrawler 
                  userId={userId || ""} 
                  tier={userTier} 
                  credits={userCredits} 
                  setCredits={setUserCredits}
                  pushLog={pushLog}
                  onCrawlSuccess={() => { if(userId) fetchThreadsPosts(userId); setActiveTab("threads"); }} 
                />

                <div className={`${cardClass} p-6 anim-fade-up anim-d1`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Threads Access Cookie</h3>
                    <StatusDot active={!!formData.threads_cookie} />
                  </div>
                  <textarea rows={4} value={formData.threads_cookie} onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} onBlur={handleSave} placeholder="sessionid=...; ds_user_id=...;" className={`${inputClass} text-violet-700 font-semibold resize-none mb-5 focus:border-violet-500 focus:ring-violet-500/10`} />
                  <button onClick={() => handleTrigger("threads")} disabled={triggering || !formData.threads_cookie} className={`${btnViolet} w-full py-2.5`}>
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Khởi động AI Commenter
                  </button>
                </div>
                
              </div>

              <div className="flex flex-col gap-6 h-[600px] lg:h-0 lg:min-h-full overflow-hidden">
{/* Posts Editor */}
                <div className={`${cardClass} p-6 flex flex-col flex-1 min-h-0 anim-fade-up anim-d3`}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[13px] font-semibold text-gray-900">Threads Crawl Poster</h3>
                    <span className="px-2.5 py-1 rounded-md bg-violet-50 border border-violet-100 text-[11px] font-mono text-violet-600 font-semibold">{threadsTotalCount} Bài</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 dim-siblings [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {threadsPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 border border-gray-200/80 rounded-xl p-5 relative group/post hover:border-gray-300 hover:shadow-sm transition-all">
                      <button onClick={() => handleDeletePost(post.id)} className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10" title="Xoá">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <textarea className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[120px] placeholder:text-gray-400 mb-2 focus:border-violet-500 focus:ring-1 focus:ring-violet-500" value={post.text_content} onChange={(e) => handleUpdatePostText(post.id, e.target.value)} placeholder="Nội dung bài viết..." />
                      {post.image_urls && post.image_urls.length > 0 && (
                        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                          {post.image_urls.map((url: string, idx: number) => (
                            <div key={idx} className="relative group shrink-0">
                              <img src={url} className="h-72 w-auto rounded-xl object-cover border border-gray-200 transition-all group-hover:opacity-80 shadow-sm" />
                              <button onClick={() => handleRemovePostImage(post.id, idx)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex justify-end gap-2 border-t border-gray-200/60 pt-4">
                        <button onClick={() => handleSavePost(post)} className={`${btnSecondary} text-[12px] px-4 py-1.5`}>Lưu Thay Đổi</button>
                        <button onClick={() => handlePostToThreads(post)} className={`${btnViolet} text-[12px] px-4 py-1.5`}>Đăng Threads</button>
                      </div>
                    </div>
                  ))}
                  {threadsPosts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">Không có dữ liệu Crawl nào.</p>
                    </div>
                  )}
                </div>
                </div>

                              </div>
            </div>
          </div>
        )}
      </main>

      {/* VS Code Style Terminal Panel */}
      <div 
        className={`fixed bottom-0 right-0 left-0 lg:left-[256px] bg-[#0F0F14] shadow-2xl z-50 flex flex-col transition-transform ${isDragging ? "duration-0" : "duration-300"} ${isTerminalOpen ? "translate-y-0" : "translate-y-full border-transparent"}`}
        style={{ height: isTerminalOpen ? terminalHeight : 0 }}
      >
        {/* Drag Handle */}
        <div 
          onMouseDown={() => { setIsTerminalOpen(true); setIsDragging(true); }}
          className="h-1.5 w-full bg-[#161620] cursor-row-resize hover:bg-blue-500/50 transition-colors shrink-0"
        />
        {/* Header / Tabs */}
        <div className="flex items-center justify-between px-4 bg-[#161620] shrink-0 border-b border-white/[0.05]">
          <div className="flex gap-4">
            {(["global", "fb", "threads"] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setTerminalTab(tab)}
                className={`py-2 text-[11px] font-mono uppercase tracking-wider relative transition-colors ${terminalTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                {tab === "global" ? "Global Logs" : tab === "fb" ? "FB Logs" : "Threads Logs"}
                {terminalTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (terminalTab === "global") setGlobalLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
                if (terminalTab === "fb") setFbLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
                if (terminalTab === "threads") setThreadsLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
              }} 
              className="text-zinc-500 hover:text-white transition-colors"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsTerminalOpen(false)} className="text-zinc-500 hover:text-white transition-colors" title="Close Panel">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Log Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[12px] bg-[#0F0F14]">
          {(terminalTab === "global" ? globalLogs : terminalTab === "fb" ? fbLogs : threadsLogs).map((log, i) => (
            <div key={i} className="flex items-start gap-2 hover:bg-white/[0.02] px-2 py-0.5 rounded transition-colors -mx-2">
              <span className="text-zinc-600 shrink-0 tabular-nums">[{log.time}]</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${LEVEL_BG[log.level]}`}>{log.level}</span>
              <span className={`${LEVEL_COLOR[log.level]} break-words leading-relaxed`}>{log.msg}</span>
            </div>
          ))}
          <div ref={terminalTab === "global" ? globalLogEndRef : terminalTab === "fb" ? fbLogEndRef : threadsLogEndRef} />
        </div>
      </div>

      {/* Global Terminal Toggle Button (when closed) */}
      {!isTerminalOpen && (
        <button 
          onClick={() => setIsTerminalOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#0F0F14] hover:bg-[#161620] text-white rounded-full flex items-center justify-center shadow-2xl border border-white/[0.1] z-40 transition-all hover:scale-105"
          title="Open Terminal"
        >
          <Terminal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
