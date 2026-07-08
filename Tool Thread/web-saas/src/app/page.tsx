"use client";

import { ArrowRight, Play, Check, Copy, MessageSquare, Bot, BarChart2, Download, Link2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200 selection:text-black">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-transparent">
        <div className="font-bold text-xl tracking-tight">Automation Hub</div>
        
        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-500">
          <a href="#features" className="hover:text-zinc-900 transition-colors">Tính năng</a>
          <a href="#tutorial" className="hover:text-zinc-900 transition-colors">Hướng dẫn</a>
          <a href="#pricing" className="hover:text-zinc-900 transition-colors">Bảng giá</a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Đăng nhập
          </Link>
          <Link href="/login" className="bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-zinc-800 transition-colors">
            Bắt đầu ngay
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Hệ thống đang hoạt động - V3.5
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black leading-[1.05] mb-6">
          Tự động hoá Threads <br className="hidden md:block" /> & Reels chỉ với 1 Click
        </h1>

        <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed mb-10">
          Giải pháp nuôi tài khoản và tự động tương tác dành cho nhà sáng tạo và người bán hàng. Tự động lấy video YouTube Shorts đăng lên Reels, tự động comment dạo Threads kéo traffic — tất cả quản lý qua Telegram.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login" className="w-full sm:w-auto bg-black text-white text-sm font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95">
            <span>Truy cập Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#tutorial" className="w-full sm:w-auto bg-white border border-zinc-200 text-zinc-900 text-sm font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm">
            <Play className="w-4 h-4 text-zinc-400" />
            <span>Xem hướng dẫn</span>
          </a>
        </div>
      </main>

      {/* Hướng dẫn cài đặt */}
      <section id="tutorial" className="px-4 py-20 bg-zinc-50/50 border-y border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-black mb-4">Cách thiết lập hệ thống</h2>
            <p className="text-zinc-500 text-sm">Chỉ cần 3 bước đơn giản để lấy Cookie bằng EditThisCookie và bắt đầu tự động hóa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm relative flex flex-col">
              <div className="absolute -top-5 left-8 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
              <div className="flex justify-end mb-2">
                <img src="https://lh3.googleusercontent.com/B701FkQ_HjQy-N_u_7hJ6v-r327oB2aH-p2V_K7Qx4Yh1_Qk_32w5J0_z7H_1Z5X6k1rZ_R1_q5_5z5w_E9-Q2M=s120" alt="EditThisCookie" className="w-12 h-12 rounded-xl shadow-sm border border-zinc-100" />
              </div>
              <h4 className="font-bold text-zinc-900 text-lg mb-3">Cài đặt Extension</h4>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed flex-1">
                Tải và cài đặt tiện ích <strong>EditThisCookie (V3)</strong> hoặc J2TEAM Security trên trình duyệt Chrome hoặc Cốc Cốc của bạn.
              </p>
              <a href="https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 py-3 rounded-xl transition-colors mt-auto">
                <Download className="w-4 h-4" />
                Cài EditThisCookie
              </a>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm relative">
              <div className="absolute -top-5 left-8 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
              <h4 className="font-bold text-zinc-900 text-lg mb-3 mt-4">Đăng nhập nền tảng</h4>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                Truy cập vào Threads.net hoặc Facebook.com và đảm bảo bạn đã đăng nhập vào tài khoản muốn cho Bot chạy tự động.
              </p>
              <a href="https://www.threads.net" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full gap-2 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 py-3 rounded-xl transition-colors">
                <Link2 className="w-4 h-4" />
                Mở Threads.net
              </a>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm relative">
              <div className="absolute -top-5 left-8 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
              <h4 className="font-bold text-zinc-900 text-lg mb-3 mt-4">Copy Session ID</h4>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                Click vào icon bánh quy trên thanh trình duyệt, tìm dòng <strong>sessionid</strong> (hoặc c_user/xs bên FB), copy đoạn mã ở ô "Giá trị" rồi dán vào trang Cài đặt Bot.
              </p>
              <div className="inline-flex items-center justify-center w-full gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 py-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                Hoàn tất
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-32 max-w-7xl mx-auto border-t border-zinc-50">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-3 font-mono">Bảng giá</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-black mb-4">Chọn gói vận hành</h2>
          <p className="text-zinc-500 text-sm">Hệ thống thanh toán tự động qua PayOS. Nâng cấp ngay tức thì.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* FREE */}
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 bg-zinc-100 w-fit px-2.5 py-1 rounded-full">Free</div>
            <div className="text-3xl font-black text-black mb-1">0đ</div>
            <p className="text-[11px] font-medium text-zinc-400 mb-6 border-b border-zinc-100 pb-4">Dùng thử nhanh</p>
            <ul className="space-y-3 mb-8 text-[12px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-300" />2 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-300" />10 Cmt Threads / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-300" />2 Threads Post / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-300" />1 FB Post / ngày</li>
              <li className="flex items-center gap-2 text-zinc-300 line-through">Không có thông báo Tele</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-xl border border-zinc-200 text-[12px] font-bold text-zinc-600 hover:bg-zinc-50 transition-colors text-center">Bắt đầu</Link>
          </div>

          {/* LITE */}
          <div className="bg-white border border-emerald-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-3 bg-emerald-50 w-fit px-2.5 py-1 rounded-full">Lite</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-black text-black">59k</div>
              <div className="text-[10px] text-zinc-400 font-medium">/tháng</div>
            </div>
            <p className="text-[11px] font-medium text-zinc-400 mb-6 border-b border-zinc-100 pb-4">Cho shop nhỏ</p>
            <ul className="space-y-3 mb-8 text-[12px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" />3 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" />30 Cmt Threads / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" />3 Threads Post / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" />3 FB Post / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" />Bot gửi thông báo</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 text-[12px] font-bold hover:bg-emerald-100 transition-colors text-center">Mua gói LITE</Link>
          </div>

          {/* PLUS */}
          <div className="bg-white border-2 border-blue-500 rounded-[2rem] p-6 shadow-xl relative scale-105 z-10 flex flex-col">
            <div className="absolute -top-3 right-6 bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Phổ biến
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-3 bg-blue-50 w-fit px-2.5 py-1 rounded-full">Plus</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-black text-black">129k</div>
              <div className="text-[10px] text-zinc-400 font-medium">/tháng</div>
            </div>
            <p className="text-[11px] font-medium text-zinc-400 mb-6 border-b border-zinc-100 pb-4">Bán hàng ổn định</p>
            <ul className="space-y-3 mb-8 text-[12px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2 font-medium text-black"><Check className="w-3.5 h-3.5 text-blue-500" />6 Reels / ngày</li>
              <li className="flex items-center gap-2 font-medium text-black"><Check className="w-3.5 h-3.5 text-blue-500" />80 Cmt Threads / ngày</li>
              <li className="flex items-center gap-2 font-medium text-black"><Check className="w-3.5 h-3.5 text-blue-500" />6 Threads Post / ngày</li>
              <li className="flex items-center gap-2 font-medium text-black"><Check className="w-3.5 h-3.5 text-blue-500" />5 FB Post / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-500" />✅ Tự động chạy hàng ngày</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-xl bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors text-center">Mua gói PLUS</Link>
          </div>

          {/* PRO */}
          <div className="bg-white border border-amber-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3 bg-amber-50 w-fit px-2.5 py-1 rounded-full">Pro</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-black text-black">199k</div>
              <div className="text-[10px] text-zinc-400 font-medium">/tháng</div>
            </div>
            <p className="text-[11px] font-medium text-zinc-400 mb-6 border-b border-zinc-100 pb-4">Tối ưu vận hành</p>
            <ul className="space-y-3 mb-8 text-[12px] text-zinc-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" />12 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" />160 Cmt Threads / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" />12 Threads Post / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" />10 FB Post / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" />✅ Tự động chạy hàng ngày</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-xl bg-amber-50 text-amber-700 text-[12px] font-bold hover:bg-amber-100 transition-colors text-center">Mua gói PRO</Link>
          </div>

          {/* PROMAX */}
          <div className="bg-zinc-900 border border-black rounded-[2rem] p-6 shadow-lg flex flex-col text-white">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-3 bg-white w-fit px-2.5 py-1 rounded-full">ProMax</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-3xl font-black">499k</div>
              <div className="text-[10px] text-zinc-400 font-medium">/vĩnh viễn</div>
            </div>
            <p className="text-[11px] font-medium text-zinc-400 mb-6 border-b border-zinc-800 pb-4">Team scale lớn</p>
            <ul className="space-y-3 mb-8 text-[12px] text-zinc-300 flex-1">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" />Không giới hạn Reels</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" />Không giới hạn Cmt</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" />Không giới hạn Post</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" />Chỉ chạy thủ công (chống spam)</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" />Ưu tiên Support</li>
            </ul>
            <Link href="/login" className="block w-full py-3 rounded-xl bg-white text-black text-[12px] font-bold hover:bg-zinc-200 transition-colors text-center">Mua gói PROMAX</Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 border-t border-zinc-100 pt-16 pb-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-sm text-black">Automation Hub</span>
            <span className="text-[10px] text-zinc-400">© 2026. Designed for creators.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
