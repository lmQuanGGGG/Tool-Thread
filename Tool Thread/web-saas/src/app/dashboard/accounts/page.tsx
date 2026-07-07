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
    <div className="glass-panel rounded-2xl p-6 transition-all hover:border-zinc-600/80 group">
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
          <p className="font-mono text-sm text-zinc-500 text-pretty">Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hyper-modern bg-grainy text-zinc-300 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-hyper-modern bg-grainy/80 backdrop-blur-xl border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-zinc-100" />
            <span className="font-semibold text-sm tracking-tight text-zinc-100">AutoFarm Simulator</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800/50 text-[10px] font-mono text-zinc-400 border border-white/5 uppercase">v3.5</span>
          </div>

          <nav className="flex items-center gap-1">
            <button 
              onClick={() => setActiveTab("global")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "global" ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              Cấu Hình Chung
            </button>
            <button 
              onClick={() => setActiveTab("fb")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === "fb" ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              Facebook Engine
            </button>
            <button 
              onClick={() => setActiveTab("threads")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === "threads" ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              Threads Engine
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium text-zinc-400">{userEmail}</span>
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">{userTier} TIER</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center border border-white/10">
            <span className="text-xs font-bold text-zinc-300">{userEmail?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-8">
        
        {/* TAB 1: GLOBAL CONFIGS */}
        {activeTab === "global" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div>
              <h1 className="text-fluid-h1 font-semibold text-zinc-100 tracking-tight mb-2 text-balance">Cấu Hình Chung</h1>
              <p className="text-sm text-zinc-500 text-pretty">Quản lý kho link Affiliate và nhận thông báo qua Telegram.</p>
            </div>

            <div className="page-layout">
              <div className="area-half shadow-layered glass-panel p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">Affiliate Link Pool</h3>
                  <div className={`w-2 h-2 rounded-full ${formData.affiliate_links ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                </div>
                <textarea 
                  rows={4} 
                  value={formData.affiliate_links} 
                  onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder={"Nhập mỗi link 1 dòng.\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} 
                  className="w-full bg-hyper-modern bg-grainy border border-white/5 rounded-xl p-4 text-[13px] font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/50 resize-none transition-all mb-4" 
                />
                <button 
                  onClick={() => handleTrigger("parse_links")} 
                  disabled={triggering || !formData.affiliate_links} 
                  className="w-full flex items-center justify-center gap-2 btn-premium bg-white text-black hover:bg-zinc-200 font-medium text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Đồng Bộ Tên & Sinh Comment AI
                </button>
              </div>

              <div className="area-half shadow-layered glass-panel p-6 hover:border-white/10 transition-colors h-fit">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">Telegram Notify</h3>
                  <div className={`w-2 h-2 rounded-full ${formData.tele_chat_id ? 'bg-sky-500' : 'bg-zinc-700'}`} />
                </div>
                <input 
                  type="text" 
                  value={formData.tele_chat_id} 
                  onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder="Chat ID — nhắn @userinfobot để lấy" 
                  className="w-full bg-hyper-modern bg-grainy border border-white/5 rounded-xl p-4 text-[13px] font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/50 transition-all" 
                />
                <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
                  Nhận cảnh báo real-time khi bot post bài thành công, lỗi cookie, hoặc các thống kê crawl định kỳ.
                </p>
              </div>
            </div>

            {/* Parsing Results */}
            {parsedLinks.length > 0 && (
              <div className="glass-panel p-6">
                <h3 className="font-medium text-zinc-200 mb-6">AI Parsing Results ({parsedLinks.length})</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 dim-siblings">
                  {parsedLinks.map((p, i) => (
                    <div key={i} className="flex gap-4 bg-hyper-modern bg-grainy border border-white/5 p-4 rounded-xl">
                      <img src={p.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-zinc-900 border border-white/5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate mb-1">{p.title}</p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate mb-2">{p.aff_link}</p>
                        <p className="text-xs text-zinc-400 italic">"{p.suggested_comment}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FACEBOOK ENGINE */}
        {activeTab === "fb" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 page-layout">
            <div className="area-half space-y-6">
              <div>
                <h1 className="text-fluid-h1 font-semibold text-zinc-100 tracking-tight mb-2 text-balance">Facebook Engine</h1>
                <p className="text-sm text-zinc-500 text-pretty">Thiết lập Cookie và chạy tiến trình Facebook.</p>
              </div>

              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">FB Access Cookie</h3>
                  <div className={`w-2 h-2 rounded-full ${formData.fb_cookie ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                </div>
                <textarea 
                  rows={4} 
                  value={formData.fb_cookie} 
                  onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder="c_user=...; xs=...; datr=...;" 
                  className="w-full bg-hyper-modern bg-grainy border border-white/5 rounded-xl p-4 text-[13px] font-mono text-emerald-400/80 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition-all mb-6" 
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleTrigger("reels")} 
                    disabled={triggering || !formData.fb_cookie} 
                    className="flex items-center justify-center gap-2 btn-premium bg-zinc-100 text-zinc-900 hover:bg-white font-medium text-sm px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    FB Reels
                  </button>
                  <button 
                    onClick={() => handleTrigger("fb_comment")} 
                    disabled={triggering || !formData.fb_cookie} 
                    className="flex items-center justify-center gap-2 btn-premium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-medium text-sm px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Auto Comment
                  </button>
                </div>
              </div>
            </div>

            <div className="area-half shadow-layered h-[500px] bg-[#0c0c0c] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#111]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-mono font-medium text-zinc-300">fb-live-logs.log</span>
                </div>
                <button onClick={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[12px] custom-scrollbar">
                {fbLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    <span className={`px-1.5 rounded text-[10px] font-bold uppercase shrink-0 ${LEVEL_BG[log.level]}`}>{log.level}</span>
                    <span className={`${LEVEL_COLOR[log.level]} break-words leading-relaxed`}>{log.msg}</span>
                  </div>
                ))}
                <div ref={fbLogEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THREADS ENGINE */}
        {activeTab === "threads" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="page-layout items-start">
              <div className="area-half space-y-6">
                <div>
                  <h1 className="text-fluid-h1 font-semibold text-zinc-100 tracking-tight mb-2 text-balance">Threads Engine</h1>
                  <p className="text-sm text-zinc-500 text-pretty">Cấu hình Bot Threads và chỉnh sửa bài đăng.</p>
                </div>

                <div className="glass-panel p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium text-zinc-200">Threads Access Cookie</h3>
                    <div className={`w-2 h-2 rounded-full ${formData.threads_cookie ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                  </div>
                  <textarea 
                    rows={4} 
                    value={formData.threads_cookie} 
                    onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} 
                    onBlur={handleSave} 
                    placeholder="sessionid=...; ds_user_id=...;" 
                    className="w-full bg-hyper-modern bg-grainy border border-white/5 rounded-xl p-4 text-[13px] font-mono text-blue-400/80 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all mb-6" 
                  />
                  <button 
                    onClick={() => handleTrigger("threads")} 
                    disabled={triggering || !formData.threads_cookie} 
                    className="w-full flex items-center justify-center gap-2 btn-premium bg-blue-600 text-white hover:bg-blue-500 font-medium text-sm px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Khởi động AI Commenter
                  </button>
                </div>

                {/* Threads Terminal */}
                <div className="h-[350px] bg-[#0c0c0c] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#111]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-mono font-medium text-zinc-300">threads-live-logs.log</span>
                    </div>
                    <button onClick={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[12px] custom-scrollbar">
                    {threadsLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                        <span className={`px-1.5 rounded text-[10px] font-bold uppercase shrink-0 ${LEVEL_BG[log.level]}`}>{log.level}</span>
                        <span className={`${LEVEL_COLOR[log.level]} break-words leading-relaxed`}>{log.msg}</span>
                      </div>
                    ))}
                    <div ref={threadsLogEndRef} />
                  </div>
                </div>

              </div>

              {/* Right Col: Threads Poster */}
              <div className="area-half shadow-layered glass-panel p-6 flex flex-col h-[700px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">Threads Crawl Poster</h3>
                  <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400">{threadsPosts.length} Bài Đăng</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar dim-siblings">
                  {threadsPosts.map((post, i) => (
                    <div key={post.id} className="bg-hyper-modern bg-grainy border border-white/5 rounded-xl p-5 relative group/post transition-colors hover:border-zinc-700">
                      <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-4 right-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10"
                          title="Xoá bài viết này"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>

                      <textarea 
                        className="w-full bg-transparent text-[13px] text-zinc-300 resize-none outline-none leading-relaxed min-h-[100px]"
                        value={post.text_content}
                        onChange={(e) => handleUpdatePostText(post.id, e.target.value)}
                        placeholder="Nội dung bài viết..."
                      />
                      
                      {post.image_urls && post.image_urls.length > 0 && (
                         <div className="mt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {post.image_urls.map((url: string, idx: number) => (
                               <div key={idx} className="relative group shrink-0">
                                 <img src={url} className="h-24 w-auto rounded-lg object-cover border border-white/5 transition-all group-hover:opacity-30" />
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
                      
                      <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => handleSavePost(post)} className="btn-premium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium px-4 py-2 rounded-lg transition-all">
                          Lưu
                        </button>
                        <button onClick={() => handlePostToThreads(post)} className="btn-premium bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium px-5 py-2 rounded-lg transition-all">
                          Đăng Lên Threads
                        </button>
                      </div>
                    </div>
                  ))}
                  {threadsPosts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                       <MessageCircle className="w-10 h-10 mb-4 opacity-50" />
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
