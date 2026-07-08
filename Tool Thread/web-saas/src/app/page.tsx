"use client";

import { ArrowRight, Check, Download, Link2, CheckCircle2, Zap, Shield, Infinity, Bot, MessageSquare, BarChart2, Terminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef, useMemo, useCallback, type ReactNode } from "react";

/* ═══════════════════════════════════════════════
   useScrollReveal — IntersectionObserver hook
   ═══════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const Reveal = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => {
  const { ref, visible } = useScrollReveal(0.08);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-10 blur-[2px]"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Canvas Confetti — magnetic attraction to cursor
   ═══════════════════════════════════════════════ */
type Particle = {
  x: number; y: number; baseX: number; baseY: number;
  vx: number; vy: number;
  size: number; color: string; shape: number;
  angle: number; speed: number; depth: number;
  rotation: number; rotSpeed: number;
};

const ATTRACT_RADIUS = 200; // px — bán kính hút
const ATTRACT_FORCE = 0.04; // lực hút
const RETURN_FORCE = 0.015; // lực kéo về vị trí gốc
const FRICTION = 0.92;

const ConfettiCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = ["#4285F4", "#EA4335", "#FBBC04", "#34A853", "#7B61FF", "#FF6D93", "#00BCD4", "#FF9800", "#A855F7", "#06B6D4"];
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(150, Math.floor(w * h / 8000));
    const pts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const depth = 0.3 + Math.random() * 0.7;
      pts.push({
        x: Math.random() * w, y: Math.random() * h,
        baseX: Math.random() * w, baseY: Math.random() * h,
        vx: 0, vy: 0,
        size: (2 + Math.random() * 4) * depth,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.floor(Math.random() * 3),
        angle: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.3,
        depth,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    let raf: number;
    let t = 0;

    const draw = () => {
      t += 0.005;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mouseActive = mouseRef.current.active;

      for (const p of pts) {
        // Drift nhẹ cho base position
        p.baseX += Math.cos(p.angle) * p.speed * 0.2;
        p.baseY += Math.sin(p.angle) * p.speed * 0.2;
        if (p.baseX < -20) p.baseX = w + 20;
        if (p.baseX > w + 20) p.baseX = -20;
        if (p.baseY < -20) p.baseY = h + 20;
        if (p.baseY > h + 20) p.baseY = -20;

        // Tính khoảng cách đến chuột
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (mouseActive && dist < ATTRACT_RADIUS) {
          // Lực hút — càng gần càng mạnh
          const force = ATTRACT_FORCE * (1 - dist / ATTRACT_RADIUS) * p.depth;
          p.vx += dx * force;
          p.vy += dy * force;
        } else {
          // Kéo về vị trí base + oscillation nhẹ
          const targetX = p.baseX + Math.sin(t * 2 + p.angle) * 8;
          const targetY = p.baseY + Math.cos(t * 1.5 + p.angle) * 6;
          p.vx += (targetX - p.x) * RETURN_FORCE;
          p.vy += (targetY - p.y) * RETURN_FORCE;
        }

        // Apply velocity
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed + (Math.abs(p.vx) + Math.abs(p.vy)) * 0.01;

        // Alpha tăng khi gần chuột
        let alpha = 0.25 + p.depth * 0.3;
        if (mouseActive && dist < ATTRACT_RADIUS) {
          alpha += (1 - dist / ATTRACT_RADIUS) * 0.35;
        }

        // Hiệu ứng nhấp nhô (bobbing) liên tục
        const bobbingY = Math.sin(t * 10 + p.angle * 4) * 12 * p.depth;

        ctx.save();
        ctx.translate(p.x, p.y + bobbingY);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.min(alpha, 0.85);
        ctx.fillStyle = p.color;

        if (p.shape === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 1) {
          const s = p.size * 1.8;
          ctx.beginPath();
          ctx.roundRect(-s / 2, -p.size / 2, s, p.size, p.size * 0.3);
          ctx.fill();
        } else {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.5, p.size * 0.5);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-p.size * 1.5, 0);
          ctx.lineTo(p.size * 1.5, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

/* ═══════════════════════════════════════════════
   3D Orb — quả cầu phát sáng kiểu Antigravity SDK
   ═══════════════════════════════════════════════ */
const GlowOrb = () => {
  const { ref, visible } = useScrollReveal(0.2);
  return (
    <div ref={ref} className={`relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] mx-auto transition-all duration-[1500ms] ${visible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-blue-600/30 via-purple-600/20 to-transparent blur-[60px] animate-pulse" />
      {/* Ring */}
      <div className="absolute inset-4 rounded-full border border-blue-500/20" style={{ animation: "orbSpin 20s linear infinite" }} />
      <div className="absolute inset-8 rounded-full border border-purple-500/15" style={{ animation: "orbSpin 15s linear infinite reverse" }} />
      {/* Sphere body */}
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] shadow-[inset_0_-20px_60px_rgba(59,130,246,0.15),inset_0_20px_40px_rgba(139,92,246,0.1)]">
        {/* Highlight */}
        <div className="absolute top-[15%] left-[20%] w-[35%] h-[25%] rounded-full bg-gradient-to-br from-white/8 to-transparent blur-sm" />
        {/* Grid lines on sphere */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`h${i}`} className="absolute w-full border-t border-blue-400/30" style={{ top: `${20 + i * 15}%` }} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`v${i}`} className="absolute h-full border-l border-blue-400/30" style={{ left: `${20 + i * 15}%` }} />
          ))}
        </div>
      </div>
      {/* Floating particles around orb */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 48 + Math.random() * 5;
        return (
          <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-blue-400" style={{
            left: `${50 + Math.cos(a) * r}%`, top: `${50 + Math.sin(a) * r}%`,
            animation: `orbDot ${3 + Math.random() * 2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`, opacity: 0.6,
          }} />
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Terminal CLI Mockup
   ═══════════════════════════════════════════════ */
const cliLines = [
  { t: "cmd", v: "autofarm start --all" },
  { t: "br" }, { t: "info", v: "🤖 AutoFarm v3.5 — Khởi động hệ thống..." },
  { t: "ok", v: "✓ Kết nối Telegram Bot @autofarm_bot" },
  { t: "ok", v: "✓ Cookie Threads hợp lệ — session: ok" },
  { t: "ok", v: "✓ Cookie Facebook hợp lệ — c_user: ok" },
  { t: "br" }, { t: "warn", v: "▶ Crawl Threads trending..." },
  { t: "dim", v: "  → Tìm thấy 24 bài viết hot" },
  { t: "dim", v: "  → Đã comment 12/12 bài thành công" },
  { t: "br" }, { t: "warn", v: "▶ Clone Youtube Shorts → FB Reels..." },
  { t: "dim", v: '  → Download: "Mẹo bán hàng Shopee #shorts"' },
  { t: "ok", v: "  → Upload FB Reels thành công ✓" },
  { t: "br" }, { t: "info", v: "📊 Báo cáo: 12 cmt · 3 reels · 6 posts — gửi Telegram ✓" },
];
const cMap: Record<string, string> = { cmd: "text-white", info: "text-blue-400", ok: "text-green-400", warn: "text-yellow-400", dim: "text-zinc-500", br: "" };
const cDelays = [0, 600, 1000, 1600, 2200, 2700, 3200, 3600, 4200, 4800, 5400, 5800, 6400, 7000, 7600, 8600];

const TerminalCLI = () => {
  const [n, setN] = useState(0);
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];
    const go = () => {
      cDelays.forEach((d, i) => ts.push(setTimeout(() => { setN(i + 1); r.current && (r.current.scrollTop = r.current.scrollHeight); }, d)));
      ts.push(setTimeout(() => { setN(0); go(); }, 11000));
    };
    go();
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <div className="rounded-[20px] overflow-hidden border border-zinc-800 bg-[#0d1117] shadow-2xl shadow-black/30">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-zinc-800/60">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" /><span className="w-3 h-3 rounded-full bg-[#ffbd2e]" /><span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-auto text-[11px] text-zinc-600 font-mono">autofarm — zsh</span>
      </div>
      <div ref={r} className="px-5 py-4 font-mono text-[13px] leading-[1.7] h-[340px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {cliLines.slice(0, n).map((l, i) => (
          <div key={i} className={l.t === "br" ? "h-3" : cMap[l.t]}>
            {l.t === "cmd" ? <><span className="text-emerald-400 mr-1">❯</span><span className="text-white">{l.v}</span>{i === n - 1 && <span className="animate-pulse text-sky-400 ml-0.5">▊</span>}</> :
             l.t !== "br" ? <>{l.v}{i === n - 1 && <span className="animate-pulse text-sky-400 ml-0.5">▊</span>}</> : null}
          </div>
        ))}
        {n === 0 && <div><span className="text-emerald-400 mr-1">❯</span><span className="animate-pulse text-sky-400">▊</span></div>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════ */
const iconItems = [
  { icon: Terminal, label: "CLI" }, { icon: Bot, label: "Bot" }, { icon: MessageSquare, label: "Comment" },
  { icon: Zap, label: "Reels" }, { icon: BarChart2, label: "Analytics" }, { icon: Shield, label: "Security" },
];

/* ═══════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans selection:bg-blue-100 relative overflow-x-hidden">
      {/* Global keyframes */}
      <style jsx global>{`
        @keyframes orbSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes orbDot {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.3; }
          100% { transform: translate(3px, -5px) scale(1.5); opacity: 0.8; }
        }
      `}</style>

      <ConfettiCanvas />

      {/* ── Nav ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 max-w-[1280px] mx-auto">
        <div className="font-bold text-[22px] tracking-tight">AutoFarm<span className="text-blue-600">.</span></div>
        <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-zinc-500">
          <a href="#features" className="hover:text-zinc-900 transition-colors">Tính năng</a>
          <a href="#tutorial" className="hover:text-zinc-900 transition-colors">Hướng dẫn</a>
          <a href="#pricing" className="hover:text-zinc-900 transition-colors">Bảng giá</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:block text-[14px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Đăng nhập</Link>
          <Link href="/login" className="bg-zinc-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-black transition-colors flex items-center gap-1.5">
            Bắt đầu <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-20 md:pt-28 pb-10 px-4 max-w-4xl mx-auto text-center">
        <div className={`transition-all duration-[1200ms] ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h1 className="text-[40px] md:text-[60px] lg:text-[72px] font-bold tracking-[-0.03em] text-zinc-900 leading-[1.05] mb-6">
            Tự động hoá Threads<br className="hidden md:block" /> & Reels toàn diện
          </h1>
          <p className="text-zinc-500 text-[16px] md:text-[18px] max-w-xl mx-auto leading-relaxed mb-10">
            Nuôi nick, clone Reels, comment dạo Threads — tất cả chạy tự động 24/7 và báo cáo trực tiếp về Telegram.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto bg-zinc-900 hover:bg-black text-white text-[14px] font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-zinc-900/20">
              Truy cập Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#tutorial" className="w-full sm:w-auto bg-[#eef0f3] hover:bg-[#e4e6ea] text-zinc-800 text-[14px] font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-colors">
              Xem hướng dẫn
            </a>
          </div>
        </div>
      </section>

      {/* ── Terminal ── */}
      <section className="relative z-10 max-w-[960px] mx-auto px-4 pt-14 pb-28">
        <Reveal>
          <div className="rounded-[28px] bg-[#0d1117] p-3 md:p-5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)]">
            <TerminalCLI />
          </div>
        </Reveal>
      </section>

      {/* ── Icon Strip + Intro text ── */}
      <section id="features" className="relative z-10 max-w-[1100px] mx-auto px-4 pb-10">
        <Reveal>
          <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap mb-14">
            {iconItems.map(({ icon: Ic, label }, i) => (
              <div key={label} className="flex flex-col items-center gap-2 group" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                  <Ic className="w-5 h-5 text-zinc-700" />
                </div>
                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-700 transition-colors">{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={150}>
          <p className="text-[28px] md:text-[36px] font-bold tracking-tight text-zinc-900 leading-snug max-w-3xl">
            AutoFarm là hệ thống tự động hoá social media,{" "}
            <span className="text-zinc-400">cho phép bất kỳ ai cũng có thể nuôi nick và kiếm tiền trên Threads & Reels một cách chuyên nghiệp.</span>
          </p>
        </Reveal>
      </section>

      {/* ── Split: Bot Feature ── */}
      <section className="relative z-10 max-w-[1100px] mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div>
              <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-5">AutoFarm Bot</h2>
              <p className="text-zinc-500 text-[15px] leading-relaxed mb-6">
                Bot Telegram điều khiển từ xa. Gửi lệnh, nhận báo cáo doanh thu, kiểm tra trạng thái cookie — tất cả ngay trong Telegram.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 bg-[#eef0f3] hover:bg-[#e4e6ea] text-zinc-800 text-[14px] font-semibold px-6 py-3 rounded-full transition-colors">
                Khám phá tính năng <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="rounded-[24px] bg-white border border-zinc-200 p-6 shadow-xl shadow-zinc-200/50">
              <div className="space-y-3">
                {[
                  { emoji: "🤖", text: "Bot: Đã comment 12 bài Threads thành công" },
                  { emoji: "📹", text: "Bot: Upload 3 Reels FB xong — 2.4k views" },
                  { emoji: "💰", text: "Bot: Doanh thu hôm nay: 340,000 VNĐ" },
                  { emoji: "⚠️", text: "Bot: Cookie FB sắp hết hạn — cần cập nhật" },
                  { emoji: "✅", text: "Bot: Tất cả hệ thống đang chạy bình thường" },
                ].map((m, i) => (
                  <div key={i} className="flex items-start gap-3 bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100">
                    <span className="text-lg flex-shrink-0">{m.emoji}</span>
                    <span className="text-[13px] text-zinc-700 leading-relaxed">{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 3D Orb Section — kiểu Antigravity SDK ── */}
      <section className="relative z-10 py-24 overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Reveal delay={100}>
              <GlowOrb />
            </Reveal>
            <Reveal delay={250}>
              <div>
                <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-5">Hạ tầng Serverless</h2>
                <p className="text-zinc-500 text-[15px] leading-relaxed mb-4">
                  Toàn bộ hệ thống chạy trên GitHub Actions + Cloudflare Workers. Không server, không chi phí vận hành, uptime 99.9%.
                </p>
                <ul className="space-y-3 text-[14px] text-zinc-600">
                  {["GitHub Actions — cron job tự động 24/7", "Cloudflare Workers — proxy API tốc độ cao", "Supabase — database PostgreSQL miễn phí", "Telegram Bot API — điều khiển từ xa"].map((t) => (
                    <li key={t} className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" />{t}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Tutorial ── */}
      <section id="tutorial" className="relative z-10 px-4 py-28 bg-white border-t border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-4">Thiết lập trong 3 phút</h2>
              <p className="text-zinc-500 text-[15px] max-w-md mx-auto">Cài extension, lấy cookie, dán vào Dashboard — xong!</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "1", t: "Cài Extension", d: "Thêm EditThisCookie vào Chrome.", href: "https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol", btn: "Tải EditThisCookie", Ic: Download },
              { n: "2", t: "Đăng nhập", d: "Mở Threads.net / FB, login đúng nick.", href: "https://www.threads.net", btn: "Mở Threads.net", Ic: Link2 },
              { n: "3", t: "Copy Cookie", d: 'Copy giá trị "sessionid" dán vào Dashboard.', href: null, btn: "Hoàn tất", Ic: CheckCircle2 },
            ].map(({ n, t, d, href, btn, Ic }, idx) => (
              <Reveal key={n} delay={idx * 150}>
                <div className="bg-[#f8f9fa] p-8 rounded-[24px] border border-zinc-200 relative pt-14 h-full">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-lg">{n}</div>
                  <h4 className="font-bold text-zinc-900 text-center text-lg mb-2">{t}</h4>
                  <p className="text-[13px] text-zinc-500 mb-6 text-center leading-relaxed">{d}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 text-[13px] font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 py-3 rounded-xl transition-colors">
                      <Ic className="w-4 h-4" /> {btn}
                    </a>
                  ) : (
                    <div className="flex items-center justify-center w-full gap-2 text-[13px] font-semibold text-emerald-700 bg-emerald-50 py-3 rounded-xl">
                      <Ic className="w-4 h-4" /> {btn}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 px-4 py-28 max-w-[1100px] mx-auto">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-4">Gói dịch vụ</h2>
            <p className="text-zinc-500 text-[15px]">Thanh toán tự động qua PayOS. Nâng cấp tức thì.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { name: "Free", price: "0đ", per: "", desc: "Trải nghiệm", color: "zinc", items: ["2 Reels / ngày", "10 Cmt Threads", "2 Threads Post", "1 FB Post"], btn: "Bắt đầu", highlight: false },
            { name: "Lite", price: "59k", per: "/tháng", desc: "Shop nhỏ", color: "emerald", items: ["3 Reels / ngày", "30 Cmt Threads", "3 Threads Post", "3 FB Post"], btn: "Mua LITE", highlight: false },
            { name: "Plus", price: "129k", per: "/tháng", desc: "Chuyên nghiệp", color: "zinc-900", items: ["6 Reels / ngày", "80 Cmt Threads", "6 Threads Post", "5 FB Post", "Auto 24/7"], btn: "Nâng cấp PLUS", highlight: true },
            { name: "Pro", price: "199k", per: "/tháng", desc: "Công nghiệp", color: "amber", items: ["12 Reels / ngày", "160 Cmt Threads", "12 Threads Post", "10 FB Post"], btn: "Mua PRO", highlight: false },
            { name: "ProMax", price: "499k", per: "/vĩnh viễn", desc: "Trọn đời", color: "zinc", items: ["Unlimited Reels", "Unlimited Cmt", "Unlimited Post"], btn: "Mua PROMAX", highlight: false },
          ].map((plan, idx) => (
            <Reveal key={plan.name} delay={idx * 80}>
              <div className={`bg-white border ${plan.highlight ? "border-2 border-zinc-900 scale-[1.04] shadow-2xl shadow-zinc-300/40" : "border-zinc-200 hover:shadow-lg"} rounded-[20px] p-6 relative flex flex-col h-full transition-all`}>
                {plan.highlight && <div className="absolute -top-3 right-5 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Phổ biến</div>}
                <div className={`text-[11px] font-bold mb-3 tracking-wider uppercase ${plan.highlight ? "text-zinc-900" : plan.color === "emerald" ? "text-emerald-600" : plan.color === "amber" ? "text-amber-600" : "text-zinc-400"}`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold text-zinc-900">{plan.price}</span>{plan.per && <span className="text-[11px] text-zinc-400">{plan.per}</span>}</div>
                <p className="text-[12px] text-zinc-400 mb-5 border-b border-zinc-100 pb-4">{plan.desc}</p>
                <ul className="space-y-3 mb-6 text-[13px] text-zinc-600 flex-1">
                  {plan.items.map((item) => (
                    <li key={item} className={`flex items-center gap-2 ${plan.highlight ? "font-medium text-zinc-800" : ""}`}>
                      {item === "Auto 24/7" ? <Zap className="w-4 h-4 text-zinc-900" /> : item.startsWith("Unlimited") ? <Infinity className="w-4 h-4 text-zinc-400" /> : <Check className={`w-4 h-4 ${plan.highlight ? "text-zinc-900" : plan.color === "emerald" ? "text-emerald-500" : plan.color === "amber" ? "text-amber-500" : "text-zinc-300"}`} />}
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={`block w-full py-3 rounded-full text-[13px] font-semibold transition-colors text-center ${plan.highlight ? "bg-zinc-900 text-white hover:bg-black" : plan.color === "emerald" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : plan.color === "amber" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-[#eef0f3] text-zinc-700 hover:bg-[#e4e6ea]"}`}>{plan.btn}</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Dark CTA ── */}
      <section className="relative z-10 px-4 pb-20 max-w-[1100px] mx-auto">
        <Reveal>
          <div className="rounded-[32px] bg-[#0d1117] px-8 md:px-16 py-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-25 pointer-events-none">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="absolute rounded-full bg-blue-500 animate-pulse" style={{
                  width: 2 + Math.random() * 3, height: 2 + Math.random() * 3,
                  left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  animationDelay: `${Math.random() * 3}s`,
                }} />
              ))}
            </div>
            <h3 className="text-[28px] md:text-[36px] font-bold text-white mb-4 relative z-10">Bắt đầu tự động hoá ngay hôm nay</h3>
            <p className="text-zinc-400 text-[15px] mb-8 max-w-md mx-auto relative z-10">Tạo tài khoản miễn phí và trải nghiệm sức mạnh của AutoFarm.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/login" className="bg-white text-zinc-900 text-[14px] font-semibold px-8 py-3.5 rounded-full hover:bg-zinc-100 transition-colors">Đăng ký miễn phí</Link>
              <a href="#pricing" className="bg-white/10 text-white text-[14px] font-semibold px-8 py-3.5 rounded-full hover:bg-white/20 transition-colors border border-white/10">Xem bảng giá</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-zinc-200 py-10 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2"><span className="font-bold text-[15px] text-zinc-900">AutoFarm.</span><span className="text-[12px] text-zinc-400">© 2026</span></div>
          <div className="flex items-center gap-6 text-[12px] text-zinc-400 font-medium">
            <a href="#" className="hover:text-zinc-900 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
