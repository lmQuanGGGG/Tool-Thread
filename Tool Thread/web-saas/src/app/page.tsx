"use client";

import { ArrowRight, Check, Download, Link2, CheckCircle2, Zap, Shield, Infinity, Bot, MessageSquare, BarChart2, Terminal, Activity, Crown, Cloud, GitBranch, Database, Clapperboard, CircleDollarSign, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef, useMemo, useCallback, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

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

function useScrollScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Tính toán progress để đạt 1.0 (bung to hết cỡ) SỚM HƠN (ngay khi terminal tới giữa màn hình)
      // progress = 0 khi ở đáy màn hình, progress = 1 khi rect.top <= windowHeight * 0.35
      const progress = 1 - (rect.top - windowHeight * 0.35) / (windowHeight * 0.6);
      const clamped = Math.min(Math.max(progress, 0), 1);
      setScale(0.7 + clamped * 0.35);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial scale
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { ref, scale };
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

const ScrollScaleWrapper = ({ children }: { children: ReactNode }) => {
  const { ref, scale } = useScrollScale();
  return (
    <div ref={ref} style={{ transform: `scale(${scale})`, transformOrigin: "top center" }} className="will-change-transform">
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
  heartX: number; heartY: number;
};

const ATTRACT_RADIUS = 800; // px — bán kính ảnh hưởng siêu lớn để tạo hiệu ứng vũ trụ
const ATTRACT_FORCE = 0.04; // lực hút
const RETURN_FORCE = 0.05; // lực kéo về vị trí gốc (tăng mạnh để tụ hình trái tim nhanh hơn)
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

    const count = Math.min(250, Math.floor(w * h / 4500)); // Tăng số lượng hạt để giống dải ngân hà
    const pts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const depth = 0.3 + Math.random() * 0.7;
      
      // Sinh toạ độ hình trái tim rải rác
      const t_heart = Math.random() * Math.PI * 2;
      // Scale trái tim to ra và rải rác nhờ random
      const rScale = (0.3 + Math.random() * 0.7) * 20; 
      const hx = rScale * 16 * Math.pow(Math.sin(t_heart), 3);
      const hy = -rScale * (13 * Math.cos(t_heart) - 5 * Math.cos(2 * t_heart) - 2 * Math.cos(3 * t_heart) - Math.cos(4 * t_heart));

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
        heartX: hx,
        heartY: hy,
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

        // Kéo về vị trí base + oscillation bồng bềnh (luôn luôn chạy để giữ sự nhẹ nhàng)
        const targetX = p.baseX + Math.sin(t * 2 + p.angle) * 15;
        const targetY = p.baseY + Math.cos(t * 1.5 + p.angle) * 15;
        p.vx += (targetX - p.x) * RETURN_FORCE;
        p.vy += (targetY - p.y) * RETURN_FORCE;

        if (mouseActive && dist < ATTRACT_RADIUS) {
          // Lực "di cư" và tạo hình trái tim
          // Giảm tốc độ nhịp đập xuống một chút (t * 12 thay vì 15)
          const beatPhase = Math.sin(t * 12);
          // Thêm hiệu ứng nhịp đập (Heartbeat) phập phồng mạnh mẽ bằng hàm sin lũy thừa
          const beatScale = 1 + Math.pow(beatPhase, 6) * 0.4;

          const targetMouseX = mx + p.heartX * beatScale;
          const targetMouseY = my + p.heartY * beatScale;
          const pullDx = targetMouseX - p.baseX;
          const pullDy = targetMouseY - p.baseY;

          // Tăng tốc độ đuổi theo chuột cực mạnh
          const pullSpeed = 0.15 * p.speed;
          p.baseX += pullDx * pullSpeed;
          p.baseY += pullDy * pullSpeed;

          // Hiệu ứng "thổn thức": Khi nhịp đập đạt đỉnh, bắn một vài hạt văng ra ngoài như tia lửa
          if (beatPhase > 0.95 && Math.random() < 0.05) {
            p.vx += p.heartX * 0.05;
            p.vy += p.heartY * 0.05;
          }
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

        // Nhịp đập của sứa (Pulse) - bơi từng nhịp
        const pulse = Math.pow(Math.sin(t * 8 + p.angle * 2), 4);
        
        // Sứa đẩy nước bơi lên/tiến tới
        const bobbingY = Math.sin(t * 5 + p.angle) * 8 * p.depth;
        
        // Thay vì bóp méo hình, cho hạt "nở" nhẹ theo nhịp
        const scale = 1 + pulse * 0.15;

        ctx.save();
        ctx.translate(p.x, p.y + bobbingY - pulse * 5); // Đẩy nhẹ lên khi vỗ
        ctx.rotate(p.rotation);
        ctx.scale(scale, scale);
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
   Serverless Illustration
   ═══════════════════════════════════════════════ */
const ServerlessIllustration = () => {
  const { ref, visible } = useScrollReveal(0.2);
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!visible) return;

    // Rotate the rings
    gsap.to(".ring-1", { rotation: 360, duration: 25, repeat: -1, ease: "none", transformOrigin: "center center" });
    gsap.to(".ring-2", { rotation: -360, duration: 35, repeat: -1, ease: "none", transformOrigin: "center center" });
    
    // Pulse the center
    gsap.to(".center-hub", { scale: 1.05, duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // Counter-rotate the nodes so they stay upright
    gsap.to(".node-icon-1", { rotation: -360, duration: 25, repeat: -1, ease: "none", transformOrigin: "center center" });
    gsap.to(".node-icon-2", { rotation: 360, duration: 35, repeat: -1, ease: "none", transformOrigin: "center center" });

    // Floating effect for the whole container (3D Tilt-like)
    const handleMouseMove = (e: MouseEvent) => {
      if (!container.current) return;
      const rect = container.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      gsap.to(".tilt-wrapper", {
        rotationY: x * 25,
        rotationX: -y * 25,
        ease: "power2.out",
        duration: 0.6
      });
    };

    const handleMouseLeave = () => {
      gsap.to(".tilt-wrapper", { rotationY: 0, rotationX: 0, ease: "power2.out", duration: 0.8 });
    };

    const el = container.current;
    el?.addEventListener("mousemove", handleMouseMove);
    el?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el?.removeEventListener("mousemove", handleMouseMove);
      el?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: container, dependencies: [visible] });

  return (
    <div 
      ref={ref} 
      className={`relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] mx-auto flex items-center justify-center transition-all duration-[1500ms] ${visible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
      style={{ perspective: "1000px" }}
    >
      {/* Background glowing gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-indigo-100/60 rounded-full blur-3xl opacity-60 pointer-events-none" />
      
      <div ref={container} className="absolute inset-0 w-full h-full cursor-pointer z-10">
        <div className="tilt-wrapper relative w-full h-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
          
          {/* Ring 1 (Outer) */}
          <div className="ring-1 absolute w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-full border border-blue-200/60 border-dashed flex items-center justify-center">
            {/* GitHub Actions */}
            <div className="absolute -top-6 w-12 h-12 bg-white rounded-2xl shadow-lg border border-zinc-100 flex items-center justify-center node-icon-1">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </div>
            {/* Telegram Bot */}
            <div className="absolute -bottom-6 w-12 h-12 bg-white rounded-2xl shadow-lg border border-zinc-100 flex items-center justify-center node-icon-1">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-[#2AABEE]"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </div>
          </div>

          {/* Ring 2 (Inner) */}
          <div className="ring-2 absolute w-[160px] h-[160px] md:w-[200px] md:h-[200px] rounded-full border border-indigo-200/80 border-dotted flex items-center justify-center">
            {/* Supabase (PostgreSQL) */}
            <div className="absolute -left-5 w-10 h-10 bg-white rounded-xl shadow-lg border border-zinc-100 flex items-center justify-center node-icon-2">
              <Database className="w-5 h-5 text-[#3ECF8E]" />
            </div>
            {/* Cloudflare (Workers) */}
            <div className="absolute -right-5 w-10 h-10 bg-white rounded-xl shadow-lg border border-zinc-100 flex items-center justify-center node-icon-2">
              <Cloud className="w-5 h-5 text-[#F38020]" />
            </div>
          </div>

          {/* Central Hub (AutoFarm Core) */}
          <div className="center-hub relative z-10 w-24 h-24 bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-100 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/10 rounded-3xl animate-pulse" />
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-inner relative z-10">
              <Bot className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Terminal CLI Mockup
   ═══════════════════════════════════════════════ */
const cliLines = [
  { t: "cmd", v: "pm2 start ecosystem.config.js" },
  { t: "br" }, { t: "info", v: "[PM2] Spawning PM2 daemon with pm2_home=/root/.pm2" },
  { t: "ok", v: "[PM2] PM2 Successfully daemonized" },
  { t: "ok", v: "✓ [Telegram] Bot @autofarm_bot connected & listening." },
  { t: "br" }, { t: "warn", v: "▶ [Cron Dispatcher] Fetching pending tasks from Supabase..." },
  { t: "dim", v: "  → Found 3 active profiles for comment farming" },
  { t: "dim", v: "  → Found 1 profile for FB Reels upload" },
  { t: "br" }, { t: "info", v: "▶ [Puppeteer] Launching headless browser..." },
  { t: "dim", v: "  → Injected Threads cookies (session: OK)" },
  { t: "warn", v: "  → Scraping latest trending posts..." },
  { t: "ok", v: "  → Successfully commented on 12 posts (delay: 3s)" },
  { t: "br" }, { t: "info", v: "▶ [Shopee Scraper] Downloading product video..." },
  { t: "dim", v: '  → Downloaded: "Review áo thun form rộng.mp4"' },
  { t: "ok", v: "  → Upload FB Reels thành công ✓" },
  { t: "br" }, { t: "info", v: "📊 [System] Cycle completed. Sleeping for 15 mins..." },
];
const cMap: Record<string, string> = { cmd: "text-white", info: "text-blue-400", ok: "text-green-400", warn: "text-yellow-400", dim: "text-zinc-500", br: "" };
// Tăng tốc độ gõ log lên gấp đôi (delay ngắn hơn) và đủ 20 phần tử
const cDelays = [0, 200, 400, 600, 800, 1000, 1300, 1500, 1700, 1900, 2200, 2400, 2800, 3200, 3400, 3800, 4200, 4600, 4800, 5200];

const TerminalCLI = () => {
  const [n, setN] = useState(0);
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];
    const go = () => {
      cDelays.forEach((d, i) => ts.push(setTimeout(() => { setN(i + 1); r.current && (r.current.scrollTop = r.current.scrollHeight); }, d)));
      ts.push(setTimeout(() => { setN(0); go(); }, 7500));
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
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
      <section className="relative z-10 max-w-[1024px] mx-auto px-4 pt-14 pb-28">
        <ScrollScaleWrapper>
          <div className="rounded-[28px] bg-[#0d1117] p-3 md:p-5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)]">
            <TerminalCLI />
          </div>
        </ScrollScaleWrapper>
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
                Bot Telegram theo dõi hệ thống. Nhận thông báo tự động về tiến trình AutoFarm, cảnh báo trạng thái cookie — tất cả ngay trong Telegram.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 bg-[#eef0f3] hover:bg-[#e4e6ea] text-zinc-800 text-[14px] font-semibold px-6 py-3 rounded-full transition-colors">
                Khám phá tính năng <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="rounded-[24px] bg-[#0e1621] border border-zinc-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative h-[420px]">
              {/* Pattern Background overlay */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%231f2937' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
              ></div>

              {/* Fake Header */}
              <div className="bg-[#17212b]/95 backdrop-blur-md px-5 py-3 border-b border-[#232e3c] flex items-center gap-3 z-10 sticky top-0 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] border border-blue-400/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-[14.5px] text-zinc-100 leading-tight">AutoFarm Bot</div>
                  <div className="text-[12.5px] text-blue-400 font-medium">bot</div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="p-4 space-y-3.5 z-10 overflow-y-auto flex-1 custom-scrollbar">
                {[
                  { 
                    time: "17:22", 
                    title: "Báo cáo Threads Comment Bot (Nick 1)",
                    color: "text-[#4ade80]",
                    content: <>Tiến trình vừa chạy xong!<br/>- Đã rải thính tại: Trang chủ (For You)<br/>- Tổng số bài viết đã cmt: 5 bài</>
                  },
                  { 
                    time: "20:19", 
                    title: "Báo cáo Threads Comment Bot (Nick 1)",
                    color: "text-[#4ade80]",
                    content: <>Tiến trình vừa chạy xong!<br/>- Đã rải thính tại: Trang chủ (For You)<br/>- Tổng số bài viết đã cmt: 4 bài</>
                  },
                  { 
                    time: "23:01", 
                    title: "Báo cáo Threads Comment Bot (Nick 1)",
                    color: "text-[#4ade80]",
                    content: <>Tiến trình vừa chạy xong!<br/>- Đã rải thính tại: Trang chủ (For You)<br/>- Tổng số bài viết đã cmt: 10 bài</>
                  },
                ].map((m, i) => (
                  <div key={i} className="flex flex-col items-start animate-fade-in" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}>
                    <div className="bg-[#182533] text-zinc-200 rounded-2xl rounded-bl-sm p-3 shadow-sm relative max-w-[92%] border border-white/[0.02]">
                      <div className={`flex items-center gap-1.5 ${m.color} font-medium text-[13px] mb-1.5`}>
                        <CheckCircle2 className="w-[14px] h-[14px] flex-shrink-0" fill="currentColor" className="w-[14px] h-[14px] text-white" />
                        <span className="truncate">{m.title}</span>
                      </div>
                      <div className="text-[13px] leading-[1.6] mb-1">
                        {m.content}
                      </div>
                      <div className="text-[10px] text-[#6b7b8c] text-right mt-1 font-medium">{m.time}</div>
                    </div>
                  </div>
                ))}

                {/* User Message (from screenshot) */}
                <div className="flex flex-col items-end animate-fade-in" style={{ animationDelay: `600ms`, animationFillMode: 'both' }}>
                  <div className="bg-[#2b5278] text-white rounded-2xl rounded-br-sm px-3.5 py-2 shadow-sm relative max-w-[90%] border border-white/[0.02]">
                    <div className="text-[13.5px] leading-relaxed">
                      /menu <span className="text-[10px] text-[#86a8c4] ml-2 font-medium">21:53 <Check className="w-3 h-3 inline text-[#5eb5f7] -ml-0.5"/></span>
                    </div>
                  </div>
                </div>

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
              <ServerlessIllustration />
            </Reveal>
            <Reveal delay={250}>
              <div>
                <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-5">Hạ tầng Serverless</h2>
                <p className="text-zinc-500 text-[15px] leading-relaxed mb-4">
                  Toàn bộ hệ thống chạy trên GitHub Actions + Cloudflare Workers. Không server, không chi phí vận hành, uptime 99.9%.
                </p>
                <ul className="space-y-3 text-[14px] text-zinc-600">
                  {["GitHub Actions — cron job tự động 24/7", "Cloudflare Workers — proxy API tốc độ cao", "Supabase — database PostgreSQL miễn phí", "Telegram Bot API — nhận thông báo tự động"].map((t) => (
                    <li key={t} className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" />{t}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Tutorial ── */}
      <section id="tutorial" className="relative z-10 px-4 py-28 bg-white border-t border-zinc-100 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            {/* Left Col: Steps */}
            <div className="flex flex-col justify-center">
              <Reveal>
                <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-4">Thiết lập trong 3 phút</h2>
                <p className="text-zinc-500 text-[16px] mb-10 leading-relaxed">Cài extension, lấy cookie và dán vào Dashboard — tất cả chỉ trong vài thao tác đơn giản.</p>
              </Reveal>

              <div className="space-y-8 relative">
                {/* Vertical connecting line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-zinc-200 z-0 hidden sm:block"></div>

                {[
                  { n: "1", t: "Cài Extension", d: "Thêm EditThisCookie vào trình duyệt Chrome của bạn.", links: [{ href: "https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol", btn: "Tải EditThisCookie", Ic: Download }] },
                  { n: "2", t: "Đăng nhập", d: "Mở trang chủ Threads hoặc Facebook và login vào tài khoản cần dùng.", links: [{ href: "https://www.threads.net", btn: "Mở Threads", Ic: Link2 }, { href: "https://www.facebook.com", btn: "Mở Facebook", Ic: Link2 }] },
                  { n: "3", t: "Copy Cookie", d: 'Mở extension, copy giá trị của biến "sessionid" và dán vào Dashboard.', links: [{ href: null, btn: "Hoàn tất", Ic: CheckCircle2 }] },
                ].map(({ n, t, d, links }, idx) => (
                  <Reveal key={n} delay={idx * 150}>
                    <div className="flex gap-5 items-start relative z-10">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[13px] shadow-[0_0_0_8px_white]">{n}</div>
                      <div className="flex-grow pt-1">
                        <h4 className="font-bold text-zinc-900 text-[17px] mb-1.5">{t}</h4>
                        <p className="text-[14.5px] text-zinc-500 mb-4 leading-relaxed">{d}</p>
                        <div className="flex flex-wrap gap-2.5">
                          {links.map((lnk, lidx) => lnk.href ? (
                            <a key={lidx} href={lnk.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl transition-all hover:border-zinc-300 hover:shadow-sm">
                              <lnk.Ic className="w-4 h-4" /> {lnk.btn}
                            </a>
                          ) : (
                            <div key={lidx} className="inline-flex items-center gap-2 text-[13px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                              <lnk.Ic className="w-4 h-4" /> {lnk.btn}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Right Col: Video Player */}
            <Reveal delay={300} className="w-full">
              <div className="rounded-[24px] overflow-hidden bg-zinc-950 aspect-[16/10] relative shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-zinc-200/60 group w-full mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500 z-10"></div>
                <video 
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls 
                  className="w-full h-full object-cover opacity-95 hover:opacity-100 transition-opacity duration-300"
                  poster="/0709-poster.jpg"
                  src="/api/telegram-file/BAACAgUAAxkDAAIJ22pOtdluZkk4ebgo8xpZh0zV6EmPAAJhHQAC_iZ4Vm50r2EWYBfxPAQ"
                >
                  Trình duyệt của bạn không hỗ trợ thẻ video.
                </video>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 px-4 py-28 max-w-[1200px] mx-auto">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-4">Chọn gói vận hành</h2>
            <p className="text-zinc-500 text-[15px]">Nâng cấp bất cứ lúc nào · Thanh toán qua PayOS</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              tag: "Dùng thử", tagColor: "text-blue-500 bg-blue-50/50",
              name: "Free", price: "0đ / tháng", 
              desc: "Trải nghiệm sức mạnh của AutoFarm mà không cần thanh toán.",
              btn1: "Dùng miễn phí", btn1Class: "bg-[#161618] text-white hover:bg-black",
              featuresTitle: "Gói bao gồm:",
              features: [
                "2 Reels, 1 FB Post, 2 Threads", "10 Cmt Threads", "1 Crawl Data", "Chia 2 khung giờ chạy"
              ]
            },
            { 
              tag: "Shop nhỏ", tagColor: "text-blue-500 bg-blue-50/50",
              name: "Lite", price: "59.000đ / tháng", 
              desc: "Gói cơ bản phù hợp cho cá nhân kinh doanh online nhỏ lẻ.",
              btn1: "Đăng ký Lite", btn1Class: "bg-[#161618] text-white hover:bg-black",
              featuresTitle: "Gói bao gồm:",
              features: [
                "3 Reels, 3 FB, 3 Threads", "30 Cmt Threads", "2 Crawl Data", "Chia 3 khung giờ chạy"
              ]
            },
            { 
              tag: "Phổ biến", tagColor: "text-blue-500 bg-blue-50/50",
              name: "Plus", price: "129.000đ / tháng", 
              desc: "Dành cho các shop cần duy trì nội dung tương tác đều đặn hàng ngày.",
              btn1: "Đăng ký Plus", btn1Class: "bg-[#161618] text-white hover:bg-black",
              featuresTitle: "Gói bao gồm:",
              features: [
                "6 Reels, 5 FB, 6 Threads", "80 Cmt Threads", "3 Crawl Data", "Auto max 50% comment"
              ]
            },
            { 
              tag: "Khuyên dùng", tagColor: "text-blue-500 bg-blue-50/50",
              name: "Pro", price: "199.000đ / tháng", 
              desc: "Tối ưu hóa khả năng tiếp cận với giới hạn cao nhất của nền tảng.",
              btn1: "Đăng ký Pro", btn1Class: "bg-[#161618] text-white hover:bg-black",
              featuresTitle: "Gói bao gồm:",
              features: [
                "12 Reels, 10 FB, 12 Threads", "160 Cmt Threads", "4 Crawl Data", "Chạy auto 24/7 liên tục", "Tối đa 10 luồng auto chạy song song"
              ]
            }
          ].map((plan, idx) => (
            <Reveal key={plan.name} delay={idx * 80}>
              <div className="bg-[#f8f9fa] rounded-[32px] p-8 flex flex-col h-full">
                <div className="mb-5">
                  <span className={`inline-block px-3 py-1.5 rounded-md text-[11px] font-semibold ${plan.tagColor}`}>
                    {plan.tag}
                  </span>
                </div>
                
                <h3 className="text-[22px] font-medium text-zinc-900 mb-2">{plan.name}</h3>
                <div className="text-[14px] text-zinc-600 mb-8">{plan.price}</div>
                
                <p className="text-[14px] text-zinc-700 leading-relaxed mb-8 min-h-[65px]">
                  {plan.desc}
                </p>

                <div className="flex flex-col gap-3 mb-8">
                  <Link href="/login" className={`block w-full py-3.5 rounded-full text-[14px] font-medium text-center transition-colors ${plan.btn1Class}`}>
                    {plan.btn1}
                  </Link>
                </div>

                <div className="h-px bg-zinc-200/70 w-full mb-6"></div>

                <div className="text-[13px] font-medium text-zinc-900 mb-5">{plan.featuresTitle}</div>

                <ul className="space-y-4 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-[13px] text-zinc-600">
                      <Check className="w-[18px] h-[18px] text-zinc-800 flex-shrink-0" strokeWidth={1.5} />
                      <span className="leading-snug pt-[1px]">{f}</span>
                    </li>
                  ))}
                </ul>
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
                <div key={i} suppressHydrationWarning className="absolute rounded-full bg-blue-500 animate-pulse" style={{
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
