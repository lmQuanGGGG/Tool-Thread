"use client";

import { ArrowRight, Play, Check, Download, Link2, CheckCircle2, Sparkles, Zap, Shield, Infinity, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-blue-500/30 selection:text-white overflow-hidden relative">
      
      {/* Animated Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[150px] animate-pulse mix-blend-screen pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[80%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="font-bold text-xl tracking-tight text-white">AutoFarm<span className="text-blue-500">.</span></div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400 bg-white/5 px-8 py-3 rounded-full border border-white/10 backdrop-blur-md">
          <a href="#tutorial" className="hover:text-white transition-colors">Hướng dẫn</a>
          <a href="#pricing" className="hover:text-white transition-colors">Bảng giá</a>
          <a href="#" className="hover:text-white transition-colors">Tính năng</a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Đăng nhập
          </Link>
          <Link href="/login" className="group relative px-6 py-2.5 rounded-full overflow-hidden bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-300">
            <div className="absolute inset-0 w-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-[400ms] ease-out group-hover:w-full"></div>
            <span className="relative text-sm font-semibold text-white flex items-center gap-2">
              Bắt đầu ngay <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-24 px-4 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Hệ thống AutoFarm V3.5
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 leading-[1.1] mb-8 pb-2">
            Tự động hoá Threads <br className="hidden md:block" /> & Reels toàn diện
          </h1>

          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-12">
            Hệ thống nuôi tài khoản AI tối thượng. Tự động sao chép Youtube Shorts sang Reels, thả comment dạo Threads kéo traffic không giới hạn. Quản lý toàn quyền qua Telegram.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/login" className="group relative w-full sm:w-auto bg-white text-black text-sm font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              <span>Truy cập Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#tutorial" className="w-full sm:w-auto bg-white/5 border border-white/10 text-white text-sm font-bold px-8 py-4 rounded-full flex items-center justify-center gap-3 hover:bg-white/10 transition-all backdrop-blur-md">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
              <span>Xem hướng dẫn</span>
            </a>
          </div>
        </div>
      </main>

      {/* 3D Glass Cards Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-32">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-blue-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-3">Clone Reels Thần Tốc</h3>
               <p className="text-sm text-zinc-400 leading-relaxed">Thuật toán tự động tìm kiếm, tải và re-up Youtube Shorts lên FB Reels/Instagram với độ trễ bằng 0. Lách bản quyền thông minh.</p>
            </div>
            <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
               <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-6 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-purple-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-3">AI Threads Comment</h3>
               <p className="text-sm text-zinc-400 leading-relaxed">Tự động scan các bài post hot trên Threads và thả comment mồi nhử bằng AI. Tạo luồng traffic khổng lồ về link Affiliate của bạn.</p>
            </div>
            <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-emerald-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-3">Bảo Mật Telegram</h3>
               <p className="text-sm text-zinc-400 leading-relaxed">Không cần treo máy. Mọi lệnh điều khiển, báo cáo doanh thu, cảnh báo lỗi đều được gửi trực tiếp về Telegram cá nhân an toàn tuyệt đối.</p>
            </div>
         </div>
      </section>

      {/* Hướng dẫn cài đặt - Glassmorphism */}
      <section id="tutorial" className="relative z-10 px-4 py-24 border-y border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Cách thiết lập siêu đơn giản</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Chỉ mất đúng 3 phút để cài đặt tiện ích lấy Cookie và kích hoạt cỗ máy kiếm tiền tự động của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent -translate-y-1/2 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 bg-[#0A0A0A] p-8 rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:border-blue-500/50 transition-colors group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center shadow-xl group-hover:border-blue-500 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all">
                 <span className="text-xl font-bold text-white">1</span>
              </div>
              <h4 className="font-bold text-white text-xl mb-4 mt-6 text-center">Cài đặt Extension</h4>
              <p className="text-sm text-zinc-400 mb-8 text-center leading-relaxed h-16">
                Thêm tiện ích <strong>EditThisCookie</strong> vào trình duyệt Chrome để trích xuất phiên đăng nhập.
              </p>
              <a href="https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol" target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 py-3.5 rounded-xl transition-colors">
                <Download className="w-4 h-4" /> Tải EditThisCookie
              </a>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-[#0A0A0A] p-8 rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:border-purple-500/50 transition-colors group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center shadow-xl group-hover:border-purple-500 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all">
                 <span className="text-xl font-bold text-white">2</span>
              </div>
              <h4 className="font-bold text-white text-xl mb-4 mt-6 text-center">Đăng nhập nền tảng</h4>
              <p className="text-sm text-zinc-400 mb-8 text-center leading-relaxed h-16">
                Mở web Threads hoặc Facebook và đảm bảo bạn đang đăng nhập vào đúng tài khoản cần nuôi.
              </p>
              <a href="https://www.threads.net" target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 py-3.5 rounded-xl transition-colors">
                <Link2 className="w-4 h-4" /> Mở Threads.net
              </a>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-[#0A0A0A] p-8 rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:border-emerald-500/50 transition-colors group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center shadow-xl group-hover:border-emerald-500 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all">
                 <span className="text-xl font-bold text-white">3</span>
              </div>
              <h4 className="font-bold text-white text-xl mb-4 mt-6 text-center">Copy Session ID</h4>
              <p className="text-sm text-zinc-400 mb-8 text-center leading-relaxed h-16">
                Click icon cookie trên Chrome, copy "Giá trị" của dòng <strong>sessionid</strong> và dán vào Dashboard.
              </p>
              <div className="flex items-center justify-center w-full gap-2 text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-3.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" /> Hoàn tất tích hợp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 px-4 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Đầu tư sinh lời tự động</h2>
          <p className="text-zinc-400 text-lg">Hệ thống mở khóa 24/7. Thanh toán tự động qua PayOS. Nâng cấp bất cứ lúc nào.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* FREE */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col hover:border-white/20 transition-all">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 bg-white/5 border border-white/10 w-fit px-3 py-1.5 rounded-full">Free</div>
            <div className="text-4xl font-black text-white mb-2">0đ</div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8 border-b border-white/10 pb-6">Trải nghiệm cơ bản</p>
            <ul className="space-y-4 mb-8 text-sm text-zinc-400 flex-1">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-500" />2 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-500" />10 Cmt Threads / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-500" />2 Threads Post / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-500" />1 FB Post / ngày</li>
            </ul>
            <Link href="/login" className="block w-full py-4 rounded-xl border border-white/10 text-sm font-bold text-white hover:bg-white/5 transition-colors text-center">Bắt đầu ngay</Link>
          </div>

          {/* LITE */}
          <div className="bg-[#0A0A0A] border border-emerald-500/30 rounded-[2rem] p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)] flex flex-col hover:border-emerald-500/50 transition-all">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-4 bg-emerald-500/10 border border-emerald-500/20 w-fit px-3 py-1.5 rounded-full">Lite</div>
            <div className="flex items-baseline gap-1 mb-2">
              <div className="text-4xl font-black text-white">59k</div>
              <div className="text-xs text-zinc-500 font-medium">/tháng</div>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8 border-b border-white/10 pb-6">Cho shop nhỏ</p>
            <ul className="space-y-4 mb-8 text-sm text-zinc-300 flex-1">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" />3 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" />30 Cmt Threads / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" />3 Threads Post / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" />3 FB Post / ngày</li>
              <li className="flex items-center gap-3 font-medium text-emerald-400"><Bot className="w-4 h-4" />Tele Bot Alert</li>
            </ul>
            <Link href="/login" className="block w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-colors text-center">Mua gói LITE</Link>
          </div>

          {/* PLUS */}
          <div className="bg-gradient-to-b from-blue-900/40 to-[#0A0A0A] border border-blue-500 rounded-[2rem] p-6 shadow-[0_0_40px_rgba(59,130,246,0.2)] relative scale-105 z-10 flex flex-col">
            <div className="absolute -top-4 right-6 bg-blue-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              Phổ biến nhất
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-4 bg-blue-500/20 border border-blue-500/30 w-fit px-3 py-1.5 rounded-full">Plus</div>
            <div className="flex items-baseline gap-1 mb-2">
              <div className="text-4xl font-black text-white">129k</div>
              <div className="text-xs text-blue-300/60 font-medium">/tháng</div>
            </div>
            <p className="text-[12px] font-medium text-blue-200/50 mb-8 border-b border-blue-500/20 pb-6">Nuôi acc chuyên nghiệp</p>
            <ul className="space-y-4 mb-8 text-sm text-white flex-1">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" />6 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" />80 Cmt Threads / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" />6 Threads Post / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" />5 FB Post / ngày</li>
              <li className="flex items-center gap-3 font-bold text-blue-400 bg-blue-500/10 -mx-2 px-2 py-1 rounded-lg"><Zap className="w-4 h-4" />Auto 24/7</li>
            </ul>
            <Link href="/login" className="block w-full py-4 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all text-center">Nâng cấp PLUS</Link>
          </div>

          {/* PRO */}
          <div className="bg-[#0A0A0A] border border-amber-500/30 rounded-[2rem] p-6 shadow-[0_0_30px_rgba(245,158,11,0.05)] flex flex-col hover:border-amber-500/50 transition-all">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-4 bg-amber-500/10 border border-amber-500/20 w-fit px-3 py-1.5 rounded-full">Pro</div>
            <div className="flex items-baseline gap-1 mb-2">
              <div className="text-4xl font-black text-white">199k</div>
              <div className="text-xs text-zinc-500 font-medium">/tháng</div>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8 border-b border-white/10 pb-6">Bán hàng công nghiệp</p>
            <ul className="space-y-4 mb-8 text-sm text-zinc-300 flex-1">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" />12 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" />160 Cmt Threads / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" />12 Threads Post / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" />10 FB Post / ngày</li>
              <li className="flex items-center gap-3 font-medium text-amber-400"><Zap className="w-4 h-4" />Auto 24/7</li>
            </ul>
            <Link href="/login" className="block w-full py-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-colors text-center">Mua gói PRO</Link>
          </div>

          {/* PROMAX */}
          <div className="bg-gradient-to-br from-purple-900/20 to-[#0A0A0A] border border-purple-500/50 rounded-[2rem] p-6 shadow-xl flex flex-col hover:border-purple-500 transition-all group">
            <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-4 bg-purple-500/10 border border-purple-500/20 w-fit px-3 py-1.5 rounded-full">ProMax</div>
            <div className="flex items-baseline gap-1 mb-2">
              <div className="text-4xl font-black text-white">499k</div>
              <div className="text-xs text-purple-400/60 font-medium">/vĩnh viễn</div>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8 border-b border-purple-500/20 pb-6">Sở hữu trọn đời</p>
            <ul className="space-y-4 mb-8 text-sm text-zinc-200 flex-1">
              <li className="flex items-center gap-3"><Infinity className="w-4 h-4 text-purple-400" />Không giới hạn Reels</li>
              <li className="flex items-center gap-3"><Infinity className="w-4 h-4 text-purple-400" />Không giới hạn Cmt</li>
              <li className="flex items-center gap-3"><Infinity className="w-4 h-4 text-purple-400" />Không giới hạn Post</li>
              <li className="flex items-center gap-3 text-purple-300 italic text-xs"><Bot className="w-4 h-4" />(Chỉ kích hoạt thủ công)</li>
            </ul>
            <Link href="/login" className="block w-full py-4 rounded-xl bg-purple-600/20 border border-purple-500/50 text-purple-300 text-sm font-bold group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 text-center">Mua PROMAX</Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/10 pt-16 pb-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-sm text-white">AutoFarm.</span>
            </div>
            <span className="text-xs text-zinc-600">© 2026. The Future of Creator Automation.</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-zinc-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Telegram Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
