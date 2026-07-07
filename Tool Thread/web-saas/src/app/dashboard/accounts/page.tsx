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
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: now(), level: "INFO", msg: "AutoFarm System khởi động. Chờ lệnh..." },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const pushLog = (level: LogEntry["level"], msg: string) => {
    setLogs(prev => [...prev, { time: now(), level, msg }]);
  };

  // Auto scroll log
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

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
        if (data.fb_cookie)      pushLog("INFO", "FB Cookie: Đã cấu hình ✓");
        if (data.threads_cookie) pushLog("INFO", "Threads Cookie: Đã cấu hình ✓");
      }
      setLoading(false);
    }
    load();
  }, []);

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
          
          setLogs(prev => [...prev, { time: timeStr, level, msg: `${prefix}${newLog.message}` }]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `email=eq.${userEmail}` },
        (payload) => {
          if (payload.new.parsed_affiliate_links) {
            setParsedLinks(payload.new.parsed_affiliate_links);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  const handleSave = async () => {
    if (!userId) return;

    // Validate link count based on tier
    const getMaxLinks = (tier: string) => {
      if (tier === 'lite') return 1;
      if (tier === 'plus') return 2;
      if (tier === 'pro') return 4;
      if (tier === 'promax') return 9999; // Không giới hạn
      return 0; // free
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
    if (!userId || !formData.fb_cookie) {
      pushLog("WARN", "Thiếu FB Cookie! Lưu cookie trước khi chạy Bot.");
      return;
    }
    setTriggering(true);
    pushLog("INFO", `Đang kích hoạt Bot [${botType.toUpperCase()}]...`);
    try {
      const res = await fetch("/api/trigger-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, botType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      pushLog("SUCCESS", `Bot [${botType.toUpperCase()}] đã được kích hoạt thành công!`);
      pushLog("INFO", "Theo dõi tiến trình qua Telegram Bot của bạn.");
    } catch (e: any) {
      pushLog("ERROR", e.message || "Kích hoạt thất bại.");
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

      {/* ── BODY: 2-col ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Config Modules: 2x2 grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 h-full">

          {/* Module 1: FB Cookie */}
          <ModuleCard
            label="FB Reels Engine"
            subtitle="Bypass Cookie Auth v2.0"
            dotActive={!!formData.fb_cookie}
          >
            <textarea
              rows={4}
              value={formData.fb_cookie}
              onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })}
              placeholder="c_user=...; xs=...; datr=...;"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-emerald-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-all"
            />
            {formData.fb_cookie && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="font-mono text-[10px] text-emerald-400">Cookie loaded — Ready to deploy</span>
              </div>
            )}
          </ModuleCard>

          {/* Module 2: Threads Cookie */}
          <ModuleCard
            label="Threads AI Commenter"
            subtitle="Simulate Authentic Discourse"
            dotActive={!!formData.threads_cookie}
          >
            <textarea
              rows={4}
              value={formData.threads_cookie}
              onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })}
              placeholder="sessionid=...; ds_user_id=...;"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-blue-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none transition-all"
            />
            {formData.threads_cookie && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <span className="font-mono text-[10px] text-blue-400">Threads auth — Connected</span>
              </div>
            )}
          </ModuleCard>

          {/* Module 3: Affiliate Links */}
          <ModuleCard
            label="Affiliate Link Pool"
            subtitle={`${linkCount} link${linkCount !== 1 ? "s" : ""} loaded (Giới hạn theo Tier)`}
            dotActive={linkCount > 0}
          >
            <textarea
              rows={4}
              value={formData.affiliate_links}
              onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })}
              placeholder={"Nhập mỗi link 1 dòng.\nGiới hạn: Lite(1), Plus(2), Pro(4), Promax(∞)"}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none transition-all mb-2"
            />
            <button onClick={() => handleTrigger("parse_links")} disabled={triggering || linkCount === 0}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
              {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Đồng bộ Tên & Sinh AI Comment
            </button>
            
            {/* Hiển thị kết quả AI */}
            {parsedLinks.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase">AI Parsing Results ({parsedLinks.length})</p>
                <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {parsedLinks.map((p, i) => (
                    <div key={i} className="flex gap-2 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                      <div className="w-10 h-10 shrink-0 bg-zinc-900 rounded overflow-hidden">
                        <img src={p.image_url} alt="img" className="w-full h-full object-cover opacity-80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-300 font-bold truncate">{p.title}</p>
                        <p className="text-[9px] text-zinc-400 font-mono truncate mt-0.5">Link: {p.aff_link}</p>
                        <p className="text-[10px] text-emerald-400 italic truncate mt-1">" {p.suggested_comment} "</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ModuleCard>

          {/* Module 4: Telegram + Actions */}
          <ModuleCard
            label="Telegram Notify"
            subtitle="Real-time alerts"
            dotActive={!!formData.tele_chat_id}
          >
            <input
              type="text"
              value={formData.tele_chat_id}
              onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })}
              placeholder="Chat ID — nhắn @userinfobot để lấy"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-sky-300 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 transition-all mb-3"
            />

            {/* Action buttons inside last card */}
            <div className="flex flex-wrap gap-2 mt-1">
              <button onClick={handleSave} disabled={saving || !userId}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving..." : "Save"}
              </button>
              {isManual && (
                <>
                  <button onClick={() => handleTrigger("reels")} disabled={triggering || !formData.fb_cookie}
                    className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Run Reels
                  </button>
                  <button onClick={() => handleTrigger("threads")} disabled={triggering || !formData.threads_cookie}
                    className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-400 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Run Threads
                  </button>
                </>
              )}
              {!isManual && (
                <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-scheduled daily
                </span>
              )}
            </div>
          </ModuleCard>

          </div>
        </div>

        {/* RIGHT — Console Live Logs */}
        <div className="w-[300px] shrink-0 border-l border-zinc-800/80 flex flex-col bg-zinc-900/40">
          {/* Console header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Console Live Logs</span>
            </div>
            <button
              onClick={() => setLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[10px]">
            {logs.map((log, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600">[{log.time}]</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${LEVEL_BG[log.level]}`}>
                    {log.level}
                  </span>
                </div>
                <p className={`leading-relaxed pl-1 ${LEVEL_COLOR[log.level]}`}>{log.msg}</p>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="font-mono text-[9px] text-zinc-600">Server: localhost:3000</span>
            <span className="font-mono text-[9px] text-zinc-600">{logs.length} entries</span>
          </div>
        </div>

      </div>
    </div>
  );
}
