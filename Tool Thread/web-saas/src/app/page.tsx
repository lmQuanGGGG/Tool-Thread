"use client";

import { ArrowRight, Check, Download, Link2, CheckCircle2, Zap, Shield, Infinity, Bot, MessageSquare, BarChart2, Terminal, Activity, Crown } from "lucide-react";
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
              { n: "1", t: "Cài Extension", d: "Thêm EditThisCookie vào Chrome.", links: [{ href: "https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol", btn: "Tải EditThisCookie", Ic: Download }] },
              { n: "2", t: "Đăng nhập", d: "Mở Threads.net / FB, login đúng nick.", links: [{ href: "https://www.threads.net", btn: "Mở Threads", Ic: Link2 }, { href: "https://www.facebook.com", btn: "Mở Facebook", Ic: Link2 }] },
              { n: "3", t: "Copy Cookie", d: 'Copy giá trị "sessionid" dán vào Dashboard.', links: [{ href: null, btn: "Hoàn tất", Ic: CheckCircle2 }] },
            ].map(({ n, t, d, links }, idx) => (
              <Reveal key={n} delay={idx * 150}>
                <div className="bg-[#f8f9fa] p-8 rounded-[24px] border border-zinc-200 relative pt-14 h-full flex flex-col">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-lg">{n}</div>
                  <h4 className="font-bold text-zinc-900 text-center text-lg mb-2">{t}</h4>
                  <p className="text-[13px] text-zinc-500 mb-6 text-center leading-relaxed flex-grow">{d}</p>
                  <div className="flex flex-col gap-2 mt-auto w-full">
                    {links.map((lnk, lidx) => lnk.href ? (
                      <a key={lidx} href={lnk.href} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 text-[13px] font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 py-3 rounded-xl transition-colors">
                        <lnk.Ic className="w-4 h-4" /> {lnk.btn}
                      </a>
                    ) : (
                      <div key={lidx} className="flex items-center justify-center w-full gap-2 text-[13px] font-semibold text-emerald-700 bg-emerald-50 py-3 rounded-xl">
                        <lnk.Ic className="w-4 h-4" /> {lnk.btn}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
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
