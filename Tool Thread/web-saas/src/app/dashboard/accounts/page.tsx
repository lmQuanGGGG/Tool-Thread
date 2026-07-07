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

/* Terminal log colors (dark terminal) */
const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  INFO:    "text-zinc-400",
  SUCCESS: "text-emerald-400",
  WARN:    "text-amber-400",
  ERROR:   "text-red-400",
};
const LEVEL_BG: Record<LogEntry["level"], string> = {
  INFO:    "bg-white/5 text-zinc-400",
  SUCCESS: "bg-emerald-500/10 text-emerald-400",
  WARN:    "bg-amber-500/10 text-amber-400",
  ERROR:   "bg-red-500/10 text-red-400",
};

/* ─── Sub-components ─────────────────────────────────── */
function StatusDot({ active }: { active: boolean }) {
  return <span className={`status-dot ${active ? "status-dot-active" : "status-dot-inactive"}`} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{children}</h3>;
}

/* ─── Terminal Panel ─────────────────────────────────── */
function TerminalPanel({ logs, logEndRef, onClear, title }: {
  logs: LogEntry[];
  logEndRef: React.RefObject<HTMLDivElement | null>;
  onClear: () => void;
  title: string;
}) {
  return (
    <div className="terminal flex flex-col h-full">
      <div className="terminal-bar">
        <div className="flex items-center gap-3">
          <div className="terminal-dots">
            <span className="bg-[#FF5F57]" />
            <span className="bg-[#FEBC2E]" />
            <span className="bg-[#28C840]" />
          </div>
          <span className="text-[11px] font-mono font-medium text-zinc-500">{title}</span>
        </div>
        <button onClick={onClear} className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px]">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-zinc-600 shrink-0 tabular-nums">[{log.time}]</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${LEVEL_BG[log.level]}`}>{log.level}</span>
            <span className={`${LEVEL_COLOR[log.level]} break-words leading-relaxed`}>{log.msg}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
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
  const [activeTab, setActiveTab] = useState<"global" | "fb" | "threads">("global");

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
      const { data: cData } = await supabase.from('crawl_data').select('*').eq('user_id', user.id).eq('posted', false).order('created_at', { ascending: false }).limit(20);
      if (cData) setThreadsPosts(cData);
    }
    load();
  }, []);

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

  // Realtime logs
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
            
            if (newLog.level === 'success' && newLog.bot_type === 'threads_post') {
              supabase.from('crawl_data').select('*').eq('user_id', userId).eq('posted', false).order('created_at', { ascending: false }).limit(20).then(({data}) => {
                if (data) setThreadsPosts(data);
              });
            }
          } else {
            setFbLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
          }
          
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

    const getMaxLinks = (tier: string) => {
      if (tier === 'lite') return 3;
      if (tier === 'plus') return 10;
      if (tier === 'pro') return 20;
      if (tier === 'promax') return 9999;
      return 1;
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

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent-blue)] flex items-center justify-center shadow-md">
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

  return (
    <div className="min-h-screen flex flex-col font-[var(--font-sans)]">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 px-6 h-14 flex items-center justify-between bg-[var(--bg-surface-1)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--accent-blue)] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-[13px] text-[var(--text-primary)]">AutoFarm</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-surface-2)] text-[9px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] uppercase tracking-wider">v3.5</span>
          </div>

          {/* Tab bar */}
          <nav className="flex items-center gap-0.5 bg-[var(--bg-surface-2)] rounded-lg p-1">
            {(["global", "fb", "threads"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`tab ${activeTab === t ? "tab-active" : ""}`}
              >
                {t === "global" ? "Cấu Hình" : t === "fb" ? "Facebook" : "Threads"}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{userEmail}</span>
            <span className="text-[10px] font-mono text-[var(--accent-green)] uppercase tracking-widest font-semibold">{userTier} tier</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--text-primary)]">{userEmail?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* ── WORKSPACE ── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-8 py-8">
        
        {/* ═══ TAB: CẤU HÌNH CHUNG ═══ */}
        {activeTab === "global" && (
          <div className="space-y-7 animate-fade-up">
            <div>
              <h1 className="heading-page text-balance mb-1.5">Cấu Hình Chung</h1>
              <p className="text-sm text-[var(--text-secondary)] text-pretty">Quản lý kho link Affiliate và nhận thông báo qua Telegram.</p>
            </div>

            <div className="grid-2">
              {/* Affiliate */}
              <div className="card p-6 animate-fade-up delay-1">
                <div className="flex items-center justify-between mb-4">
                  <Label>Affiliate Link Pool</Label>
                  <StatusDot active={!!formData.affiliate_links} />
                </div>
                <textarea 
                  rows={4} 
                  value={formData.affiliate_links} 
                  onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder={"Nhập mỗi link 1 dòng.\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} 
                  className="input-clean w-full p-3.5 font-mono resize-none mb-4" 
                />
                <button 
                  onClick={() => handleTrigger("parse_links")} 
                  disabled={triggering || !formData.affiliate_links} 
                  className="w-full flex items-center justify-center gap-2 btn btn-primary text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:!transform-none"
                >
                  {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Đồng Bộ Tên & Sinh Comment AI
                </button>
              </div>

              {/* Telegram */}
              <div className="card p-6 h-fit animate-fade-up delay-2">
                <div className="flex items-center justify-between mb-4">
                  <Label>Telegram Notify</Label>
                  <StatusDot active={!!formData.tele_chat_id} />
                </div>
                <input 
                  type="text" 
                  value={formData.tele_chat_id} 
                  onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder="Chat ID — nhắn @userinfobot để lấy" 
                  className="input-clean w-full p-3.5 font-mono" 
                />
                <p className="mt-3.5 text-[12px] text-[var(--text-muted)] leading-relaxed">
                  Nhận cảnh báo real-time khi bot post bài thành công, lỗi cookie, hoặc các thống kê crawl định kỳ.
                </p>
              </div>
            </div>

            {/* Parsed Links */}
            {parsedLinks.length > 0 && (
              <div className="card p-6 animate-fade-up delay-3">
                <div className="flex items-center justify-between mb-5">
                  <Label>AI Parsing Results</Label>
                  <span className="px-2 py-1 rounded-md bg-[var(--bg-surface-2)] text-[11px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)]">{parsedLinks.length} items</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 dim-siblings">
                  {parsedLinks.map((p, i) => (
                    <div key={i} className="flex gap-3.5 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] p-3.5 rounded-xl hover:border-[var(--border-hover)] hover:shadow-sm transition-all">
                      <img src={p.image_url} alt="" className="w-14 h-14 rounded-lg object-cover bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate mb-0.5">{p.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono truncate mb-1">{p.aff_link}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] italic leading-snug">"{p.suggested_comment}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: FACEBOOK ═══ */}
        {activeTab === "fb" && (
          <div className="grid-2 animate-fade-up">
            <div className="space-y-5">
              <div>
                <h1 className="heading-page text-balance mb-1.5">Facebook Engine</h1>
                <p className="text-sm text-[var(--text-secondary)] text-pretty">Thiết lập Cookie và chạy tiến trình Facebook.</p>
              </div>

              <div className="card p-6 animate-fade-up delay-1">
                <div className="flex items-center justify-between mb-4">
                  <Label>FB Access Cookie</Label>
                  <StatusDot active={!!formData.fb_cookie} />
                </div>
                <textarea 
                  rows={4} 
                  value={formData.fb_cookie} 
                  onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder="c_user=...; xs=...; datr=...;" 
                  className="input-clean input-clean-green w-full p-3.5 font-mono text-emerald-700 font-semibold resize-none mb-5" 
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleTrigger("reels")} 
                    disabled={triggering || !formData.fb_cookie} 
                    className="flex items-center justify-center gap-2 btn btn-secondary text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:!transform-none"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    FB Reels
                  </button>
                  <button 
                    onClick={() => handleTrigger("fb_comment")} 
                    disabled={triggering || !formData.fb_cookie} 
                    className="flex items-center justify-center gap-2 btn btn-green text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:!transform-none"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Auto Comment
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[500px] animate-fade-up delay-2">
              <TerminalPanel
                logs={fbLogs}
                logEndRef={fbLogEndRef}
                onClear={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])}
                title="fb-live-logs.log"
              />
            </div>
          </div>
        )}

        {/* ═══ TAB: THREADS ═══ */}
        {activeTab === "threads" && (
          <div className="space-y-7 animate-fade-up">
            <div className="grid-2 items-start">
              <div className="space-y-5">
                <div>
                  <h1 className="heading-page text-balance mb-1.5">Threads Engine</h1>
                  <p className="text-sm text-[var(--text-secondary)] text-pretty">Cấu hình Bot Threads và chỉnh sửa bài đăng.</p>
                </div>

                <div className="card p-6 animate-fade-up delay-1">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Threads Access Cookie</Label>
                    <StatusDot active={!!formData.threads_cookie} />
                  </div>
                  <textarea 
                    rows={4} 
                    value={formData.threads_cookie} 
                    onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} 
                    onBlur={handleSave} 
                    placeholder="sessionid=...; ds_user_id=...;" 
                    className="input-clean input-clean-violet w-full p-3.5 font-mono text-violet-700 font-semibold resize-none mb-5" 
                  />
                  <button 
                    onClick={() => handleTrigger("threads")} 
                    disabled={triggering || !formData.threads_cookie} 
                    className="w-full flex items-center justify-center gap-2 btn btn-violet text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:!transform-none"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Khởi động AI Commenter
                  </button>
                </div>

                {/* Terminal */}
                <div className="h-[350px] animate-fade-up delay-2">
                  <TerminalPanel
                    logs={threadsLogs}
                    logEndRef={threadsLogEndRef}
                    onClear={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])}
                    title="threads-live-logs.log"
                  />
                </div>
              </div>

              {/* Threads Post Editor */}
              <div className="card-elevated p-6 flex flex-col h-[700px] animate-fade-up delay-3">
                <div className="flex items-center justify-between mb-5">
                  <Label>Threads Crawl Poster</Label>
                  <span className="px-2.5 py-1 rounded-md bg-violet-50 border border-violet-100 text-[11px] font-mono text-violet-600 font-semibold">{threadsPosts.length} Bài</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 dim-siblings">
                  {threadsPosts.map((post) => (
                    <div key={post.id} className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl p-5 relative group/post hover:border-[var(--border-hover)] hover:shadow-sm transition-all">
                      <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-3 right-3 btn-danger-subtle rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10"
                          title="Xoá bài viết"
                      >
                          <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <textarea 
                        className="w-full bg-transparent text-[13px] text-[var(--text-primary)] resize-none outline-none leading-relaxed min-h-[72px] placeholder:text-[var(--text-muted)]"
                        value={post.text_content}
                        onChange={(e) => handleUpdatePostText(post.id, e.target.value)}
                        placeholder="Nội dung bài viết..."
                      />
                      
                      {post.image_urls && post.image_urls.length > 0 && (
                         <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                            {post.image_urls.map((url: string, idx: number) => (
                               <div key={idx} className="relative group shrink-0">
                                 <img src={url} className="h-20 w-auto rounded-lg object-cover border border-[var(--border-subtle)] transition-all group-hover:opacity-30" />
                                 <button 
                                    onClick={() => handleRemovePostImage(post.id, idx)}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                               </div>
                            ))}
                         </div>
                      )}
                      
                      <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => handleSavePost(post)} className="btn btn-secondary text-[12px] font-medium px-4 py-1.5">
                          Lưu
                        </button>
                        <button onClick={() => handlePostToThreads(post)} className="btn btn-violet text-[12px] font-medium px-4 py-1.5">
                          Đăng Lên Threads
                        </button>
                      </div>
                    </div>
                  ))}
                  {threadsPosts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                       <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                       <p className="text-sm">Không có dữ liệu Crawl nào.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
      </main>
    </div>
  );
}
