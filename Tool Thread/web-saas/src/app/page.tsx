"use client";

import { ArrowRight, Check, Download, Link2, CheckCircle2, Zap, Shield, Infinity, Bot, MessageSquare, BarChart2, Terminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════
   Spiral Confetti — xoắn ốc hạt đa sắc kiểu Antigravity
   ═══════════════════════════════════════════════ */
const SpiralConfetti = () => {
  const particles = useMemo(() => {
    const colors = ["#4285F4", "#EA4335", "#FBBC04", "#34A853", "#7B61FF", "#FF6D93", "#00BCD4", "#FF9800"];
    const dots: { id: number; x: number; y: number; size: number; color: string; delay: number; dur: number }[] = [];
    const totalDots = 120;
    const cx = 50, cy = 42;

    for (let i = 0; i < totalDots; i++) {
      const angle = (i / totalDots) * Math.PI * 6;
      const radius = 3 + (i / totalDots) * 38;
      const jitterX = (Math.random() - 0.5) * 8;
      const jitterY = (Math.random() - 0.5) * 8;
      dots.push({
        id: i,
        x: cx + Math.cos(angle) * radius + jitterX,
        y: cy + Math.sin(angle) * radius * 0.6 + jitterY,
        size: Math.random() * 4.5 + 1.5,
        color: colors[i % colors.length],
        delay: Math.random() * 3,
        dur: 4 + Math.random() * 4,
      });
    }
    return dots;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.55,
            animation: `spiralFloat ${p.dur}s ease-in-out infinite alternate`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes spiralFloat {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50%  { transform: translate(6px, -8px) scale(1.2); opacity: 0.7; }
          100% { transform: translate(-4px, 5px) scale(0.9); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Terminal CLI Mockup — animated bot output
   ═══════════════════════════════════════════════ */
const lines = [
  { t: "cmd", v: "autofarm start --all" },
  { t: "br" },
  { t: "info", v: "🤖 AutoFarm v3.5 — Khởi động hệ thống..." },
  { t: "ok", v: "✓ Kết nối Telegram Bot @autofarm_bot" },
  { t: "ok", v: "✓ Cookie Threads hợp lệ — session: ok" },
  { t: "ok", v: "✓ Cookie Facebook hợp lệ — c_user: ok" },
  { t: "br" },
  { t: "warn", v: "▶ Crawl Threads trending..." },
  { t: "dim", v: "  → Tìm thấy 24 bài viết hot" },
  { t: "dim", v: "  → Đã comment 12/12 bài thành công" },
  { t: "br" },
  { t: "warn", v: "▶ Clone Youtube Shorts → FB Reels..." },
  { t: "dim", v: '  → Download: "Mẹo bán hàng Shopee #shorts"' },
  { t: "ok", v: "  → Upload FB Reels thành công ✓" },
  { t: "br" },
  { t: "info", v: "📊 Báo cáo: 12 cmt · 3 reels · 6 posts — gửi Telegram ✓" },
];

const colorMap: Record<string, string> = {
  cmd: "text-white", info: "text-blue-400", ok: "text-green-400",
  warn: "text-yellow-400", dim: "text-zinc-500", br: "",
};

const TerminalCLI = () => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const delays = [0, 600, 1000, 1600, 2200, 2700, 3200, 3600, 4200, 4800, 5400, 5800, 6400, 7000, 7600, 8000, 8600];
    const timers: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      delays.forEach((d, idx) => {
        timers.push(setTimeout(() => {
          setCount(idx + 1);
          ref.current && (ref.current.scrollTop = ref.current.scrollHeight);
        }, d));
      });
      timers.push(setTimeout(() => { setCount(0); run(); }, 11000));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-[20px] overflow-hidden border border-zinc-800 bg-[#0d1117] shadow-2xl shadow-black/30">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-zinc-800/60">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-auto text-[11px] text-zinc-600 font-mono">autofarm — zsh — 80×24</span>
      </div>
      <div ref={ref} className="px-5 py-4 font-mono text-[13px] leading-[1.7] h-[340px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {lines.slice(0, count).map((l, i) => (
          <div key={i} className={l.t === "br" ? "h-3" : colorMap[l.t]}>
            {l.t === "cmd" ? (
              <><span className="text-emerald-400 mr-1">❯</span><span className="text-white">{l.v}</span>{i === count - 1 && <span className="animate-pulse text-sky-400 ml-0.5">▊</span>}</>
            ) : l.t !== "br" ? (
              <>{l.v}{i === count - 1 && <span className="animate-pulse text-sky-400 ml-0.5">▊</span>}</>
            ) : null}
          </div>
        ))}
        {count === 0 && <div><span className="text-emerald-400 mr-1">❯</span><span className="animate-pulse text-sky-400">▊</span></div>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Feature Icon Row — floating icons kiểu Antigravity
   ═══════════════════════════════════════════════ */
const iconItems = [
  { icon: Terminal, label: "CLI" },
  { icon: Bot, label: "Bot" },
  { icon: MessageSquare, label: "Comment" },
  { icon: Zap, label: "Reels" },
  { icon: BarChart2, label: "Analytics" },
  { icon: Shield, label: "Security" },
];

/* ═══════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans selection:bg-blue-100 relative overflow-x-hidden">
      <SpiralConfetti />

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

      {/* ── Product Showcase — Terminal in dark card ── */}
      <section className="relative z-10 max-w-[960px] mx-auto px-4 pt-14 pb-28">
        <div className={`transition-all duration-[1200ms] delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}>
          <div className="rounded-[28px] bg-[#0d1117] p-3 md:p-5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)]">
            <TerminalCLI />
          </div>
        </div>
      </section>

      {/* ── Floating Icon Strip ── */}
      <section id="features" className="relative z-10 max-w-[1100px] mx-auto px-4 pb-10">
        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap mb-14">
          {iconItems.map(({ icon: Ic, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                <Ic className="w-5 h-5 text-zinc-700" />
              </div>
              <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-700 transition-colors">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[28px] md:text-[36px] font-bold tracking-tight text-zinc-900 leading-snug max-w-3xl">
          AutoFarm là hệ thống tự động hoá social media,{" "}
          <span className="text-zinc-400">cho phép bất kỳ ai cũng có thể nuôi nick và kiếm tiền trên Threads & Reels một cách chuyên nghiệp.</span>
        </p>
      </section>

      {/* ── Split: CLI Feature ── */}
      <section className="relative z-10 max-w-[1100px] mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-5">AutoFarm Bot</h2>
            <p className="text-zinc-500 text-[15px] leading-relaxed mb-6">
              Bot Telegram điều khiển từ xa. Gửi lệnh, nhận báo cáo doanh thu, kiểm tra trạng thái cookie — tất cả ngay trong Telegram mà không cần mở trình duyệt.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-[#eef0f3] hover:bg-[#e4e6ea] text-zinc-800 text-[14px] font-semibold px-6 py-3 rounded-full transition-colors">
              Khám phá tính năng <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
        </div>
      </section>

      {/* ── Tutorial ── */}
      <section id="tutorial" className="relative z-10 px-4 py-28 bg-white border-t border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-4">Thiết lập trong 3 phút</h2>
            <p className="text-zinc-500 text-[15px] max-w-md mx-auto">Cài extension, lấy cookie, dán vào Dashboard — xong!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "1", t: "Cài Extension", d: "Thêm EditThisCookie vào Chrome.", href: "https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol", btn: "Tải EditThisCookie", Ic: Download },
              { n: "2", t: "Đăng nhập", d: "Mở Threads.net hoặc FB, login đúng nick.", href: "https://www.threads.net", btn: "Mở Threads.net", Ic: Link2 },
              { n: "3", t: "Copy Cookie", d: 'Copy giá trị "sessionid" dán vào Dashboard.', href: null, btn: "Hoàn tất", Ic: CheckCircle2 },
            ].map(({ n, t, d, href, btn, Ic }) => (
              <div key={n} className="bg-[#f8f9fa] p-8 rounded-[24px] border border-zinc-200 relative pt-14">
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
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing — 2 CTA cards kiểu Antigravity ── */}
      <section id="pricing" className="relative z-10 px-4 py-28 max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-zinc-900 mb-4">Gói dịch vụ</h2>
          <p className="text-zinc-500 text-[15px]">Thanh toán tự động qua PayOS. Nâng cấp tức thì.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* FREE */}
          <div className="bg-white border border-zinc-200 rounded-[20px] p-6 hover:shadow-lg transition-all flex flex-col">
            <div className="text-[11px] font-bold text-zinc-400 mb-3 tracking-wider uppercase">Free</div>
            <div className="text-3xl font-bold text-zinc-900 mb-1">0đ</div>
            <p className="text-[12px] text-zinc-400 mb-5 border-b border-zinc-100 pb-4">Trải nghiệm</p>
            <ul className="space-y-3 mb-6 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-300" />2 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-300" />10 Cmt Threads</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-300" />2 Threads Post</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-300" />1 FB Post</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-full bg-[#eef0f3] text-zinc-700 hover:bg-[#e4e6ea] text-[13px] font-semibold transition-colors text-center">Bắt đầu</Link>
          </div>
          {/* LITE */}
          <div className="bg-white border border-zinc-200 rounded-[20px] p-6 hover:shadow-lg transition-all flex flex-col">
            <div className="text-[11px] font-bold text-emerald-600 mb-3 tracking-wider uppercase">Lite</div>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold text-zinc-900">59k</span><span className="text-[11px] text-zinc-400">/tháng</span></div>
            <p className="text-[12px] text-zinc-400 mb-5 border-b border-zinc-100 pb-4">Shop nhỏ</p>
            <ul className="space-y-3 mb-6 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />3 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />30 Cmt Threads</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />3 Threads Post</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />3 FB Post</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[13px] font-semibold transition-colors text-center">Mua LITE</Link>
          </div>
          {/* PLUS */}
          <div className="bg-white border-2 border-zinc-900 rounded-[20px] p-6 relative scale-[1.04] z-10 flex flex-col shadow-2xl shadow-zinc-300/40">
            <div className="absolute -top-3 right-5 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Phổ biến</div>
            <div className="text-[11px] font-bold text-zinc-900 mb-3 tracking-wider uppercase">Plus</div>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold text-zinc-900">129k</span><span className="text-[11px] text-zinc-400">/tháng</span></div>
            <p className="text-[12px] text-zinc-400 mb-5 border-b border-zinc-100 pb-4">Chuyên nghiệp</p>
            <ul className="space-y-3 mb-6 text-[13px] text-zinc-800 flex-1 font-medium">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-900" />6 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-900" />80 Cmt Threads</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-900" />6 Threads Post</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-900" />5 FB Post</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-zinc-900" />Auto 24/7</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-full bg-zinc-900 text-white hover:bg-black text-[13px] font-semibold transition-colors text-center">Nâng cấp PLUS</Link>
          </div>
          {/* PRO */}
          <div className="bg-white border border-zinc-200 rounded-[20px] p-6 hover:shadow-lg transition-all flex flex-col">
            <div className="text-[11px] font-bold text-amber-600 mb-3 tracking-wider uppercase">Pro</div>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold text-zinc-900">199k</span><span className="text-[11px] text-zinc-400">/tháng</span></div>
            <p className="text-[12px] text-zinc-400 mb-5 border-b border-zinc-100 pb-4">Công nghiệp</p>
            <ul className="space-y-3 mb-6 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" />12 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" />160 Cmt Threads</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" />12 Threads Post</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" />10 FB Post</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 text-[13px] font-semibold transition-colors text-center">Mua PRO</Link>
          </div>
          {/* PROMAX */}
          <div className="bg-[#f2f3f5] border border-zinc-200 rounded-[20px] p-6 flex flex-col">
            <div className="text-[11px] font-bold text-zinc-900 mb-3 tracking-wider uppercase">ProMax</div>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold text-zinc-900">499k</span><span className="text-[11px] text-zinc-400">/vĩnh viễn</span></div>
            <p className="text-[12px] text-zinc-400 mb-5 border-b border-zinc-200 pb-4">Trọn đời</p>
            <ul className="space-y-3 mb-6 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2"><Infinity className="w-4 h-4 text-zinc-400" />Unlimited Reels</li>
              <li className="flex items-center gap-2"><Infinity className="w-4 h-4 text-zinc-400" />Unlimited Cmt</li>
              <li className="flex items-center gap-2"><Infinity className="w-4 h-4 text-zinc-400" />Unlimited Post</li>
              <li className="flex items-center gap-2 text-xs text-zinc-400 italic">(Chạy thủ công)</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-full bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100 text-[13px] font-semibold transition-colors text-center">Mua PROMAX</Link>
          </div>
        </div>
      </section>

      {/* ── CTA Footer — dark card kiểu Antigravity ── */}
      <section className="relative z-10 px-4 pb-20 max-w-[1100px] mx-auto">
        <div className="rounded-[32px] bg-[#0d1117] px-8 md:px-16 py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="absolute rounded-full bg-blue-500" style={{
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `spiralFloat ${5 + Math.random() * 5}s ease-in-out infinite alternate`,
                animationDelay: `${Math.random() * 3}s`,
              }} />
            ))}
          </div>
          <h3 className="text-[28px] md:text-[36px] font-bold text-white mb-4 relative z-10">Bắt đầu tự động hoá ngay hôm nay</h3>
          <p className="text-zinc-400 text-[15px] mb-8 max-w-md mx-auto relative z-10">Tạo tài khoản miễn phí và trải nghiệm sức mạnh của AutoFarm.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link href="/login" className="bg-white text-zinc-900 text-[14px] font-semibold px-8 py-3.5 rounded-full hover:bg-zinc-100 transition-colors">
              Đăng ký miễn phí
            </Link>
            <a href="#pricing" className="bg-white/10 text-white text-[14px] font-semibold px-8 py-3.5 rounded-full hover:bg-white/20 transition-colors border border-white/10">
              Xem bảng giá
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-zinc-200 py-10 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[15px] text-zinc-900">AutoFarm.</span>
            <span className="text-[12px] text-zinc-400">© 2026</span>
          </div>
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
