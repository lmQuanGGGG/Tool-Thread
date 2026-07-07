"use client";

import {
  Save, Cookie, Link as LinkIcon, MessageCircle, AlertCircle,
  Zap, Loader2, CheckCircle2, Bot, Settings, Play, Terminal, Trash2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../utils/supabase";

/* ─── Types ─────────────────────────────────────────── */
interface FormData {
  fb_cookie: string;
  threads_cookie: string;
  affiliate_links: string;
  tele_chat_id: string;
}
interface LogEntry {
  time: string;
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
  msg: string;
}

interface ParsedLink {
  aff_link: string;
  title: string;
  image_url: string;
  suggested_comment: string;
}

/* ─── Helpers ────────────────────────────────────────── */
const now = () => new Date().toLocaleTimeString("vi-VN", { hour12: false });

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  INFO:    "text-zinc-400",
  SUCCESS: "text-emerald-400",
  WARN:    "text-amber-400",
  ERROR:   "text-red-400",
};
const LEVEL_BG: Record<LogEntry["level"], string> = {
  INFO:    "bg-zinc-700/60 text-zinc-300",
  SUCCESS: "bg-emerald-500/20 text-emerald-400",
  WARN:    "bg-amber-500/20 text-amber-400",
  ERROR:   "bg-red-500/20 text-red-400",
};

/* ─── Sub-components ─────────────────────────────────── */
function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]" : "bg-zinc-600"}`} />
  );
}

function ModuleCard({
  label, subtitle, dotActive, children
}: { label: string; subtitle: string; dotActive: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-600/80 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <StatusDot active={dotActive} />
          <span className="font-mono font-bold text-sm text-zinc-100 tracking-widest uppercase">{label}</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
export default function AccountsPage() {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [userId, setUserId]       = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userTier, setUserTier]   = useState<string>("free");
  const [formData, setFormData]   = useState<FormData>({
    fb_cookie: "", threads_cookie: "", affiliate_links: "", tele_chat_id: "",
  });
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([]);
  const [fbLogs, setFbLogs] = useState<LogEntry[]>([{ time: now(), level: "INFO", msg: "FB System khởi động..." }]);
  const [threadsLogs, setThreadsLogs] = useState<LogEntry[]>([{ time: now(), level: "INFO", msg: "Threads System khởi động..." }]);
  const [threadsPosts, setThreadsPosts] = useState<any[]>([]);
  const fbLogEndRef = useRef<HTMLDivElement>(null);
  const threadsLogEndRef = useRef<HTMLDivElement>(null);

  const pushFbLog = (level: LogEntry["level"], msg: string) => setFbLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushThreadsLog = (level: LogEntry["level"], msg: string) => setThreadsLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushLog = (level: LogEntry["level"], msg: string, target: "fb" | "threads" | "both" = "both") => {
    if (target === "fb" || target === "both") pushFbLog(level, msg);
    if (target === "threads" || target === "both") pushThreadsLog(level, msg);
  };

  useEffect(() => { fbLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [fbLogs]);
  useEffect(() => { threadsLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadsLogs]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); pushLog("ERROR", "Chưa đăng nhập!"); return; }
      setUserId(user.id);
      setUserEmail(user.email || null);

      const { data, error } = await supabase
        .from("profiles").select("fb_cookie, threads_cookie, affiliate_links, tele_chat_id, tier, parsed_affiliate_links")
        .eq("id", user.id).single();

      if (!error && data) {
        setUserTier(data.tier || "free");
        setFormData({
          fb_cookie: data.fb_cookie || "",
          threads_cookie: data.threads_cookie || "",
          affiliate_links: data.affiliate_links || "",
          tele_chat_id: data.tele_chat_id || "",
        });
        setParsedLinks(data.parsed_affiliate_links || []);
        pushLog("SUCCESS", `Đã tải profile. Tier: ${(data.tier || "free").toUpperCase()}`);
        if (data.fb_cookie)      pushLog("INFO", "FB Cookie: Đã cấu hình ✓", "fb");
        if (data.threads_cookie) pushLog("INFO", "Threads Cookie: Đã cấu hình ✓", "threads");
      }
      setLoading(false);
      // Fetch crawl data
      const { data: cData } = await supabase.from('crawl_data').select('*').eq('user_id', user.id).eq('posted', false).order('created_at', { ascending: false }).limit(20);
      if (cData) setThreadsPosts(cData);
    }
    load();
  }, []);

  // Các hàm quản lý Threads Post Editor
  const handleUpdatePostText = (id: string, newText: string) => {
    setThreadsPosts(prev => prev.map(p => p.id === id ? { ...p, text_content: newText } : p));
  };

  const handleRemovePostImage = (id: string, imgIdx: number) => {
    setThreadsPosts(prev => prev.map(p => {
      if (p.id === id) {
         const newUrls = [...(p.image_urls || [])];
         newUrls.splice(imgIdx, 1);
         return { ...p, image_urls: newUrls };
      }
      return p;
    }));
  };

  const handleSavePost = async (post: any) => {
    pushLog("INFO", `Đang lưu bài viết...`, "threads");
    const { error } = await supabase.from('crawl_data').update({
      text_content: post.text_content,
      image_urls: post.image_urls
    }).eq('id', post.id);

    if (error) {
       pushLog("ERROR", `Lỗi lưu bài viết: ${error.message}`, "threads");
       return false;
    }
    pushLog("SUCCESS", `Đã lưu bài viết thành công.`, "threads");
    return true;
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá bài viết này không?")) return;
    
    pushLog("INFO", `Đang xoá bài viết...`, "threads");
    const { error } = await supabase.from('crawl_data').delete().eq('id', id);
    if (error) {
       pushLog("ERROR", `Lỗi xoá bài viết: ${error.message}`, "threads");
       return;
    }
    setThreadsPosts(prev => prev.filter(p => p.id !== id));
    pushLog("SUCCESS", `Đã xoá bài viết vĩnh viễn.`, "threads");
  };

  const handlePostToThreads = async (post: any) => {
    const saved = await handleSavePost(post);
    if (saved) {
      handleTrigger("threads_post_" + post.id);
    }
  };

  // Lắng nghe log Realtime từ Bot (Github Actions) qua Supabase
  useEffect(() => {
    if (!userEmail) return;

    const channel = supabase
      .channel('realtime_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bot_logs', filter: `email=eq.${userEmail}` },
        (payload) => {
          const newLog = payload.new;
          let level: LogEntry["level"] = "INFO";
          if (newLog.level === 'error') level = "ERROR";
          if (newLog.level === 'success') level = "SUCCESS";
          if (newLog.level === 'warn') level = "WARN";
          
          const timeStr = new Date(newLog.created_at).toLocaleTimeString("vi-VN", { hour12: false });
          const prefix = newLog.bot_type ? `[${newLog.bot_type.toUpperCase()}] ` : '';
          
          if (newLog.bot_type && newLog.bot_type.includes('threads')) {
            setThreadsLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
            
            // Xoá bài khỏi UI tự động nếu Threads Post báo thành công
            if (newLog.level === 'success' && newLog.bot_type === 'threads_post') {
              supabase.from('crawl_data').select('*').eq('user_id', userId).eq('posted', false).order('created_at', { ascending: false }).limit(20).then(({data}) => {
                if (data) setThreadsPosts(data);
              });
            }
          } else {
            setFbLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
          }
          
          // Tự động refetch data nếu bot parse_links báo thành công
          if (newLog.bot_type === 'parse_links' && newLog.level === 'success') {
            supabase.from("profiles").select("parsed_affiliate_links").eq("email", userEmail).single().then(({data}) => {
              if (data && data.parsed_affiliate_links) {
                setParsedLinks(data.parsed_affiliate_links);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, userId]);

  const handleSave = async () => {
    if (!userId) return;

    // Validate link count based on tier
    const getMaxLinks = (tier: string) => {
      if (tier === 'lite') return 3;
      if (tier === 'plus') return 10;
      if (tier === 'pro') return 20;
      if (tier === 'promax') return 9999; // Không giới hạn
      return 1; // free
    };
    
    const maxLinks = getMaxLinks(userTier);
    const linkCount = formData.affiliate_links.split("\n").filter(Boolean).length;
    
    if (linkCount > maxLinks) {
      pushLog("ERROR", `Lỗi: Gói ${userTier.toUpperCase()} chỉ được tối đa ${maxLinks} link (Bạn nhập ${linkCount}). Hãy nâng cấp gói!`);
      return;
    }

    setSaving(true);
    pushLog("INFO", "Đang lưu cấu hình...");
    const { error } = await supabase.from("profiles").update(formData).eq("id", userId);
    if (error) {
      pushLog("ERROR", `Lưu thất bại: ${error.message}`);
    } else {
      pushLog("SUCCESS", "Cấu hình đã được lưu thành công.");
    }
    setSaving(false);
  };

  const handleTrigger = async (botType: string) => {
    const isThreads = botType.includes('threads');
    const target = isThreads ? 'threads' : 'fb';

    if (!userId) {
      pushLog("WARN", "Chưa đăng nhập!", target);
      return;
    }

    if (isThreads && !formData.threads_cookie) {
      pushLog("WARN", "Thiếu Threads Cookie! Lưu cookie trước khi chạy Bot.", target);
      return;
    } else if (!isThreads && !formData.fb_cookie) {
      pushLog("WARN", "Thiếu FB Cookie! Lưu cookie trước khi chạy Bot.", target);
      return;
    }

    setTriggering(true);
    pushLog("INFO", `Đang kích hoạt Bot [${botType.toUpperCase()}]...`, target);
    try {
      const res = await fetch("/api/trigger-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, botType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      pushLog("SUCCESS", `Bot [${botType.toUpperCase()}] đã được kích hoạt thành công!`, target);
      pushLog("INFO", "Theo dõi tiến trình qua Telegram Bot của bạn.", target);
    } catch (e: any) {
      pushLog("ERROR", e.message || "Kích hoạt thất bại.", target);
    } finally {
      setTriggering(false);
    }
  };

  const isManual  = userTier === "free" || userTier === "lite";
  const linkCount = formData.affiliate_links.split("\n").filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Bot className="w-10 h-10 text-emerald-400 animate-pulse" />
          <p className="font-mono text-sm text-zinc-500">Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    /* Dark full-page wrapper — fit viewport */
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">

      {/* ── TITLE BAR ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center gap-3">
          {/* macOS traffic lights */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-[13px] text-zinc-100 tracking-widest uppercase">
              AutoFarm Simulator v3.4
            </span>
          </div>
        </div>

        {/* Tier badge + status */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Tier: <span className="text-emerald-400 font-bold">{userTier.toUpperCase()}</span>
          </span>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400 font-bold">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col flex-1 overflow-hidden p-6 gap-6">
        {/* SHARED TOP ROW */}
        <div className="flex shrink-0 gap-6">
          {/* Affiliate Links */}
          <div className="flex-[2] min-w-0">
            <ModuleCard label="Affiliate Link Pool" subtitle={"Giới hạn theo Tier"} dotActive={formData.affiliate_links.length > 0}>
              <textarea rows={3} value={formData.affiliate_links} onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} onBlur={handleSave} placeholder={"Nhập mỗi link 1 dòng.\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none transition-all mb-3" />
              <button onClick={() => handleTrigger("parse_links")} disabled={triggering || formData.affiliate_links.length === 0} className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40 w-fit">
                {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Đồng bộ Tên & Sinh AI Comment
              </button>
              {parsedLinks.length > 0 && (
                <div className="mt-5 border-t border-zinc-800/60 pt-4">
                  <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase mb-3">AI Parsing Results ({parsedLinks.length})</p>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {parsedLinks.map((p, i) => (
                      <div key={i} className="flex gap-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                        <div className="w-12 h-12 shrink-0 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800"><img src={p.image_url} alt="img" className="w-full h-full object-cover opacity-90" /></div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-[11px] text-zinc-200 font-bold truncate mb-0.5">{p.title}</p>
                          <p className="text-[9px] text-zinc-500 font-mono truncate mb-1">Link: <span className="text-zinc-400">{p.aff_link}</span></p>
                          <p className="text-[10px] text-emerald-400 italic truncate">" {p.suggested_comment} "</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ModuleCard>
          </div>

          {/* Telegram Notify */}
          <div className="flex-[1] min-w-0">
            <ModuleCard label="Telegram Notify" subtitle="Real-time alerts" dotActive={!!formData.tele_chat_id}>
              <input type="text" value={formData.tele_chat_id} onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} onBlur={handleSave} placeholder="Chat ID — nhắn @userinfobot để lấy" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-sky-300 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 transition-all" />
            </ModuleCard>
          </div>
        </div>

        {/* BOTTOM ROW: FB & THREADS */}
        <div className="flex flex-1 overflow-hidden gap-6">
          {/* LEFT COLUMN: FACEBOOK */}
          <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
              {/* Module 1: FB Cookie */}
              <ModuleCard label="FB Reels Engine" subtitle="Bypass Cookie Auth v2.0" dotActive={!!formData.fb_cookie}>
                <textarea rows={3} value={formData.fb_cookie} onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} onBlur={handleSave} placeholder="c_user=...; xs=...; datr=...;" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-emerald-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-all mb-3" />
                {formData.fb_cookie && (
                  <div className="flex items-center gap-2 mb-4"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" /><span className="font-mono text-[10px] text-emerald-400">Cookie loaded — Ready to deploy</span></div>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={() => handleTrigger("reels")} disabled={triggering || !formData.fb_cookie} className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run FB Reels
                  </button>
                  <button onClick={() => handleTrigger("fb_comment")} disabled={triggering || !formData.fb_cookie} className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    Run FB Auto Comment
                  </button>
                </div>
              </ModuleCard>
            </div>

            {/* FB LOGS */}
            <div className="h-[280px] shrink-0 bg-zinc-900/80 border border-zinc-700/60 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
                <div className="flex items-center gap-2.5"><Terminal className="w-4 h-4 text-emerald-400" /><span className="font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-widest">FB Live Logs</span></div>
                <button onClick={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-800/50 hover:bg-zinc-700 p-1.5 rounded-md" title="Clear logs"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] custom-scrollbar">
                {fbLogs.map((log, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2"><span className="text-zinc-600">[{log.time}]</span><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${LEVEL_BG[log.level]}`}>{log.level}</span></div>
                    <p className={`leading-relaxed pl-1 ${LEVEL_COLOR[log.level]}`}>{log.msg}</p>
                  </div>
                ))}
                <div ref={fbLogEndRef} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: THREADS */}
          <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
              {/* Module 2: Threads Cookie */}
              <ModuleCard label="Threads AI Commenter" subtitle="Simulate Authentic Discourse" dotActive={!!formData.threads_cookie}>
                <textarea rows={3} value={formData.threads_cookie} onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} onBlur={handleSave} placeholder="sessionid=...; ds_user_id=...;" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-blue-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none transition-all mb-3" />
                {formData.threads_cookie && (
                  <div className="flex items-center gap-2 mb-4"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)]" /><span className="font-mono text-[10px] text-blue-400">Threads auth — Connected</span></div>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={() => handleTrigger("threads")} disabled={triggering || !formData.threads_cookie} className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run Threads Comment Bot
                  </button>
                </div>
              </ModuleCard>

              {/* Module: Crawl Data */}
              <ModuleCard label="Threads Crawl Poster" subtitle={threadsPosts.length + " bài khả dụng"} dotActive={threadsPosts.length > 0}>
                <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {threadsPosts.map((post, i) => (
                    <div key={post.id} className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 relative group/post transition-colors">
                      <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-3 right-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10"
                          title="Xoá bài viết này"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>

                      <textarea 
                        className="w-full bg-zinc-900/30 border border-transparent focus:border-zinc-700 hover:border-zinc-800 rounded-lg p-3 pr-10 text-[12px] text-zinc-300 resize-none transition-all outline-none leading-relaxed"
                        rows={4}
                        value={post.text_content}
                        onChange={(e) => handleUpdatePostText(post.id, e.target.value)}
                      />
                      {post.image_urls && post.image_urls.length > 0 && (
                         <div className="mt-3 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {post.image_urls.map((url: string, idx: number) => (
                               <div key={idx} className="relative group shrink-0">
                                 <img src={url} className="h-24 w-auto rounded-lg object-cover border border-zinc-800 transition-all group-hover:opacity-40" />
                                 <button 
                                    onClick={() => handleRemovePostImage(post.id, idx)}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                            ))}
                         </div>
                      )}
                      <div className="mt-4 flex justify-end gap-3 border-t border-zinc-800/60 pt-4">
                        <button onClick={() => handleSavePost(post)} className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold px-4 py-2 rounded-lg transition-all">
                          Lưu Thay Đổi
                        </button>
                        <button onClick={() => handlePostToThreads(post)} className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-[11px] font-bold px-5 py-2 rounded-lg transition-all">
                          Post To Threads
                        </button>
                      </div>
                    </div>
                  ))}
                  {threadsPosts.length === 0 && <p className="text-zinc-500 text-[12px] italic text-center py-4">Không có dữ liệu Crawl.</p>}
                </div>
              </ModuleCard>
            </div>

            {/* THREADS LOGS */}
            <div className="h-[280px] shrink-0 bg-zinc-900/80 border border-zinc-700/60 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
                <div className="flex items-center gap-2.5"><Terminal className="w-4 h-4 text-blue-400" /><span className="font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-widest">Threads Live Logs</span></div>
                <button onClick={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-800/50 hover:bg-zinc-700 p-1.5 rounded-md" title="Clear logs"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] custom-scrollbar">
                {threadsLogs.map((log, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2"><span className="text-zinc-600">[{log.time}]</span><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${LEVEL_BG[log.level]}`}>{log.level}</span></div>
                    <p className={`leading-relaxed pl-1 ${LEVEL_COLOR[log.level]}`}>{log.msg}</p>
                  </div>
                ))}
                <div ref={threadsLogEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
