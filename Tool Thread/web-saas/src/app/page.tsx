"use client";

import { ArrowRight, Play, Check, Download, Link2, CheckCircle2, Zap, Shield, Infinity, Bot } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const FloatingParticles = () => {
  const [particles, setParticles] = useState<{ id: number; top: string; left: string; size: string; color: string; duration: string; delay: string }[]>([]);

  useEffect(() => {
    const colors = ['bg-blue-500', 'bg-red-400', 'bg-purple-500', 'bg-indigo-400', 'bg-sky-400'];
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 4 + 2}px`,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: `${Math.random() * 10 + 5}s`,
      delay: `${Math.random() * 5}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.color} mix-blend-multiply`}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `float ${p.duration} ease-in-out infinite alternate ${p.delay}`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      
      {/* Background Effect */}
      <FloatingParticles />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,white_100%)] pointer-events-none opacity-80 z-0"></div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="font-bold text-xl tracking-tight text-zinc-900">AutoFarm<span className="text-blue-600">.</span></div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
          <a href="#tutorial" className="hover:text-zinc-900 transition-colors">Hướng dẫn</a>
          <a href="#pricing" className="hover:text-zinc-900 transition-colors">Bảng giá</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Tính năng</a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Đăng nhập
          </Link>
          <Link href="/login" className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-black text-white text-sm font-medium transition-colors">
            Bắt đầu ngay
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-24 pb-24 px-4 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          <div className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 mb-8 bg-blue-50/50 border border-blue-100/50 px-4 py-1.5 rounded-full">
            Hệ thống AutoFarm V3.5
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[76px] font-bold tracking-tight text-zinc-900 leading-[1.05] mb-6">
            Tự động hoá Threads <br className="hidden md:block" /> & Reels toàn diện
          </h1>

          <p className="text-zinc-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Hệ thống nuôi tài khoản AI tối ưu. Tự động lấy video Shorts đăng lên Reels, tự động comment dạo Threads kéo traffic — tất cả quản lý qua Telegram.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto bg-zinc-900 hover:bg-black text-white text-sm font-medium px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-colors">
              <span>Truy cập Dashboard</span>
            </Link>
            <a href="#tutorial" className="w-full sm:w-auto bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-sm font-medium px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-colors">
              <span>Xem hướng dẫn</span>
            </a>
          </div>
        </div>
      </main>

      {/* Features Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-32">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
               <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-5 h-5 text-zinc-900" />
               </div>
               <h3 className="text-lg font-bold text-zinc-900 mb-2">Clone Reels Thần Tốc</h3>
               <p className="text-sm text-zinc-500 leading-relaxed">Tìm kiếm, tải và re-up Youtube Shorts lên FB Reels/Instagram với độ trễ bằng 0. Lách bản quyền thông minh.</p>
            </div>
            <div className="text-center p-6">
               <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-5 h-5 text-zinc-900" />
               </div>
               <h3 className="text-lg font-bold text-zinc-900 mb-2">AI Threads Comment</h3>
               <p className="text-sm text-zinc-500 leading-relaxed">Tự động scan các bài post hot trên Threads và thả comment mồi nhử bằng AI kéo traffic khổng lồ.</p>
            </div>
            <div className="text-center p-6">
               <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-5 h-5 text-zinc-900" />
               </div>
               <h3 className="text-lg font-bold text-zinc-900 mb-2">Bảo Mật Telegram</h3>
               <p className="text-sm text-zinc-500 leading-relaxed">Không cần treo máy. Mọi lệnh điều khiển và báo cáo đều được gửi trực tiếp về Telegram cá nhân an toàn.</p>
            </div>
         </div>
      </section>

      {/* Tutorial */}
      <section id="tutorial" className="relative z-10 px-4 py-32 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">Cách thiết lập siêu đơn giản</h2>
            <p className="text-zinc-500 text-base max-w-xl mx-auto">Chỉ mất 3 phút để cài đặt tiện ích lấy Cookie và kích hoạt cỗ máy của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm relative pt-12">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center font-bold shadow-sm">1</div>
              <h4 className="font-bold text-zinc-900 text-center text-lg mb-3">Cài đặt Extension</h4>
              <p className="text-sm text-zinc-500 mb-8 text-center leading-relaxed h-16">
                Thêm tiện ích <strong>EditThisCookie</strong> vào Chrome.
              </p>
              <a href="https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol" target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 py-3.5 rounded-xl transition-colors">
                <Download className="w-4 h-4" /> Tải EditThisCookie
              </a>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm relative pt-12">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center font-bold shadow-sm">2</div>
              <h4 className="font-bold text-zinc-900 text-center text-lg mb-3">Đăng nhập</h4>
              <p className="text-sm text-zinc-500 mb-8 text-center leading-relaxed h-16">
                Mở Threads.net hoặc FB và đảm bảo đã đăng nhập đúng nick.
              </p>
              <a href="https://www.threads.net" target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 py-3.5 rounded-xl transition-colors">
                <Link2 className="w-4 h-4" /> Mở Threads.net
              </a>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm relative pt-12">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center font-bold shadow-sm">3</div>
              <h4 className="font-bold text-zinc-900 text-center text-lg mb-3">Copy Cookie</h4>
              <p className="text-sm text-zinc-500 mb-8 text-center leading-relaxed h-16">
                Copy giá trị của dòng <strong>sessionid</strong> và dán vào Dashboard.
              </p>
              <div className="flex items-center justify-center w-full gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 py-3.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" /> Hoàn tất
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 px-4 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">Gói dịch vụ</h2>
          <p className="text-zinc-500 text-base">Thanh toán tự động qua PayOS. Nâng cấp bất cứ lúc nào.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* FREE */}
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 hover:shadow-lg transition-all flex flex-col">
            <div className="text-[11px] font-bold text-zinc-500 mb-4 tracking-wider uppercase">Free</div>
            <div className="text-3xl font-bold text-zinc-900 mb-1">0đ</div>
            <p className="text-[12px] text-zinc-500 mb-6 border-b border-zinc-100 pb-4">Trải nghiệm</p>
            <ul className="space-y-4 mb-8 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-300" />2 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-300" />10 Cmt Threads</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-300" />2 Threads Post</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-300" />1 FB Post</li>
            </ul>
            <Link href="/login" className="block w-full py-3.5 rounded-xl bg-zinc-50 text-zinc-700 hover:bg-zinc-100 text-sm font-semibold transition-colors text-center">Bắt đầu ngay</Link>
          </div>

          {/* LITE */}
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 hover:shadow-lg transition-all flex flex-col">
            <div className="text-[11px] font-bold text-emerald-600 mb-4 tracking-wider uppercase">Lite</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-bold text-zinc-900">59k</div>
              <div className="text-[11px] text-zinc-500">/tháng</div>
            </div>
            <p className="text-[12px] text-zinc-500 mb-6 border-b border-zinc-100 pb-4">Cho shop nhỏ</p>
            <ul className="space-y-4 mb-8 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" />3 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" />30 Cmt Threads</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" />3 Threads Post</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" />3 FB Post</li>
            </ul>
            <Link href="/login" className="block w-full py-3.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold transition-colors text-center">Mua gói LITE</Link>
          </div>

          {/* PLUS */}
          <div className="bg-white border-2 border-zinc-900 rounded-[2rem] p-6 relative scale-105 z-10 flex flex-col shadow-2xl shadow-zinc-200/50">
            <div className="absolute -top-3 right-6 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Phổ biến nhất
            </div>
            <div className="text-[11px] font-bold text-zinc-900 mb-4 tracking-wider uppercase">Plus</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-bold text-zinc-900">129k</div>
              <div className="text-[11px] text-zinc-500">/tháng</div>
            </div>
            <p className="text-[12px] text-zinc-500 mb-6 border-b border-zinc-100 pb-4">Chuyên nghiệp</p>
            <ul className="space-y-4 mb-8 text-[13px] text-zinc-800 flex-1 font-medium">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-900" />6 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-900" />80 Cmt Threads</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-900" />6 Threads Post</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-zinc-900" />5 FB Post</li>
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-zinc-900" />Auto 24/7</li>
            </ul>
            <Link href="/login" className="block w-full py-3.5 rounded-xl bg-zinc-900 text-white hover:bg-black text-sm font-semibold transition-colors text-center">Nâng cấp PLUS</Link>
          </div>

          {/* PRO */}
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 hover:shadow-lg transition-all flex flex-col">
            <div className="text-[11px] font-bold text-amber-600 mb-4 tracking-wider uppercase">Pro</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-bold text-zinc-900">199k</div>
              <div className="text-[11px] text-zinc-500">/tháng</div>
            </div>
            <p className="text-[12px] text-zinc-500 mb-6 border-b border-zinc-100 pb-4">Công nghiệp</p>
            <ul className="space-y-4 mb-8 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-500" />12 Reels / ngày</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-500" />160 Cmt Threads</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-500" />12 Threads Post</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-500" />10 FB Post</li>
            </ul>
            <Link href="/login" className="block w-full py-3.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-semibold transition-colors text-center">Mua gói PRO</Link>
          </div>

          {/* PROMAX */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-6 flex flex-col">
            <div className="text-[11px] font-bold text-zinc-900 mb-4 tracking-wider uppercase">ProMax</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-bold text-zinc-900">499k</div>
              <div className="text-[11px] text-zinc-500">/vĩnh viễn</div>
            </div>
            <p className="text-[12px] text-zinc-500 mb-6 border-b border-zinc-200 pb-4">Trọn đời</p>
            <ul className="space-y-4 mb-8 text-[13px] text-zinc-600 flex-1">
              <li className="flex items-center gap-3"><Infinity className="w-4 h-4 text-zinc-400" />Không giới hạn Reels</li>
              <li className="flex items-center gap-3"><Infinity className="w-4 h-4 text-zinc-400" />Không giới hạn Cmt</li>
              <li className="flex items-center gap-3"><Infinity className="w-4 h-4 text-zinc-400" />Không giới hạn Post</li>
              <li className="flex items-center gap-3 text-xs text-zinc-400 italic">(Chạy thủ công)</li>
            </ul>
            <Link href="/login" className="block w-full py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100 text-sm font-semibold transition-colors text-center">Mua PROMAX</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 pt-12 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900">AutoFarm.</span>
            <span className="text-xs text-zinc-500">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium">
            <a href="#" className="hover:text-zinc-500 hover:text-zinc-900 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-zinc-500 hover:text-zinc-900 transition-colors">Bảo mật</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
