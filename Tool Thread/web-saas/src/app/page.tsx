"use client";

import { ArrowRight, Play, Check, Copy, MessageSquare, Bot, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200 selection:text-black">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-transparent">
        <div className="font-bold text-xl tracking-tight">AutoFarm MMO</div>
        
        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-500">
          <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
          <a href="#automation" className="hover:text-zinc-900 transition-colors">Automation</a>
          <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
          <a href="#support" className="hover:text-zinc-900 transition-colors">Support</a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Login
          </Link>
          <Link href="/login" className="bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-zinc-800 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          System Online 2.0
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black leading-[1.05] mb-6">
          Automate Your Threads <br className="hidden md:block" /> & Reels in 1 Click
        </h1>

        <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed mb-10">
          Architectural automation for the modern creator. Clone content, orchestrate engagement, and control empires from a single Telegram bot. Weightless infrastructure. Hyper-functional power.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login" className="w-full sm:w-auto bg-black text-white text-sm font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95">
            <span>Start Automating</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="w-full sm:w-auto bg-white border border-zinc-200 text-zinc-900 text-sm font-semibold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm">
            <Play className="w-4 h-4 text-zinc-400" />
            <span>View Demo</span>
          </button>
        </div>
      </main>

      {/* Core Infrastructure */}
      <section id="features" className="px-4 py-24 max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-black">Core Infrastructure</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="md:col-span-2 bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12 flex flex-col justify-between overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="mb-12">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600 mb-6">
                <Copy className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Auto Clone Reels</h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                Seamlessly mirror content across dimensions. Our engine detects, duplicates, and deploys high-performing reels with zero latency.
              </p>
            </div>
            {/* Minimal Mockup */}
            <div className="w-full h-40 bg-zinc-100/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
               <div className="w-24 h-32 bg-white rounded-xl shadow-sm border border-zinc-100 transform -rotate-12 translate-x-8"></div>
               <div className="w-24 h-32 bg-zinc-50 rounded-xl shadow-md border border-zinc-200 z-10"></div>
               <div className="w-24 h-32 bg-white rounded-xl shadow-sm border border-zinc-100 transform rotate-12 -translate-x-8"></div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="mb-12">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600 mb-6">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Auto Comment Threads</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Deploy intelligent, context-aware engagement. Simulate authentic discourse across massive thread networks.
              </p>
            </div>
            {/* Skeleton Mockup */}
            <div className="space-y-3">
              <div className="w-full h-6 bg-zinc-50 rounded-full"></div>
              <div className="w-5/6 h-6 bg-zinc-50 rounded-full"></div>
              <div className="w-4/6 h-6 bg-zinc-50 rounded-full"></div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="mb-12">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600 mb-6">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Telegram Control</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Command your empire from chat. Start tasks, monitor analytics, and adjust parameters directly via our secure Telegram bot interface.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="md:col-span-2 bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12 flex flex-col justify-between overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="mb-8">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600 mb-6">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Omniscient Analytics</h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                Real-time tracking of every action. Understand your growth trajectory with minimal noise and maximum clarity.
              </p>
            </div>
            {/* Minimal Bar Chart Mockup */}
            <div className="h-32 flex items-end gap-2 mt-4 px-2">
              <div className="w-full bg-zinc-200 rounded-t-sm h-[20%]"></div>
              <div className="w-full bg-zinc-300 rounded-t-sm h-[35%]"></div>
              <div className="w-full bg-zinc-400 rounded-t-sm h-[25%]"></div>
              <div className="w-full bg-zinc-500 rounded-t-sm h-[55%]"></div>
              <div className="w-full bg-zinc-600 rounded-t-sm h-[75%]"></div>
              <div className="w-full bg-zinc-800 rounded-t-sm h-[85%]"></div>
              <div className="w-full bg-black rounded-t-sm h-[100%]"></div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-32 max-w-6xl mx-auto border-t border-zinc-50">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-3 font-mono">Bảng giá</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-black mb-4">Chọn gói phù hợp</h2>
          <p className="text-zinc-500 text-sm">Từ miễn phí đến không giới hạn. Nâng cấp bất kỳ lúc nào.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">

          {/* FREE */}
          <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Free</div>
            <div className="text-3xl font-bold text-black mb-1">0đ</div>
            <p className="text-[11px] text-zinc-400 mb-6">Thử nghiệm miễn phí</p>
            <ul className="space-y-2.5 mb-8 text-[11px] text-zinc-600">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-zinc-300" />1 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-zinc-300" />10 Comment / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-zinc-300" />1 link Affiliate</li>
              <li className="flex items-center gap-2 text-zinc-300 line-through">Chạy tự động</li>
            </ul>
            <Link href="/register" className="block w-full py-2.5 rounded-full border border-zinc-200 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors text-center">
              Bắt đầu
            </Link>
          </div>

          {/* LITE */}
          <div className="bg-white border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-3">Lite</div>
            <div className="text-3xl font-bold text-black mb-1">59k</div>
            <p className="text-[11px] text-zinc-400 mb-6">/ tháng</p>
            <ul className="space-y-2.5 mb-8 text-[11px] text-zinc-600">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" />2 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" />30 Comment / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" />3 link Affiliate</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" />Thông báo Telegram</li>
              <li className="flex items-center gap-2 text-zinc-300 line-through">Chạy tự động</li>
            </ul>
            <Link href="/register" className="block w-full py-2.5 rounded-full border border-emerald-200 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-center">
              Chọn Lite
            </Link>
          </div>

          {/* PLUS */}
          <div className="bg-white border border-blue-200 rounded-[2rem] p-6 shadow-[0_20px_60px_rgb(0,0,0,0.06)] relative scale-[1.03] z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
              Phổ biến
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-blue-600 mb-3">Plus</div>
            <div className="text-3xl font-bold text-black mb-1">179k</div>
            <p className="text-[11px] text-zinc-400 mb-6">/ tháng</p>
            <ul className="space-y-2.5 mb-8 text-[11px] text-zinc-600">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-blue-500" />4 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-blue-500" />80 Comment / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-blue-500" />10 link Affiliate</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-blue-500" />✅ Chạy tự động</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-blue-500" />Thông báo Telegram</li>
            </ul>
            <Link href="/register" className="block w-full py-2.5 rounded-full bg-black text-white text-[11px] font-bold hover:bg-zinc-800 transition-colors text-center shadow-md">
              Chọn Plus
            </Link>
          </div>

          {/* PRO */}
          <div className="bg-white border border-amber-100 rounded-[2rem] p-6 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-3">Pro</div>
            <div className="text-3xl font-bold text-black mb-1">399k</div>
            <p className="text-[11px] text-zinc-400 mb-6">/ tháng</p>
            <ul className="space-y-2.5 mb-8 text-[11px] text-zinc-600">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" />6 Reels / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" />150 Comment / ngày</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" />20 link Affiliate</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" />✅ Chạy tự động</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-amber-400" />Hỗ trợ ưu tiên</li>
            </ul>
            <Link href="/register" className="block w-full py-2.5 rounded-full border border-amber-200 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors text-center">
              Chọn Pro
            </Link>
          </div>

          {/* PROMAX */}
          <div className="bg-gradient-to-br from-violet-600 to-pink-500 rounded-[2rem] p-6 shadow-lg">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-3">ProMax</div>
            <div className="text-3xl font-bold text-white mb-1">699k</div>
            <p className="text-[11px] text-white/60 mb-6">/ tháng</p>
            <ul className="space-y-2.5 mb-8 text-[11px] text-white/90">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-white" />Reels không giới hạn</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-white" />Comment không giới hạn</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-white" />Link không giới hạn</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-white" />✅ Chạy tự động</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-white" />Hỗ trợ VIP 1-1</li>
            </ul>
            <Link href="/register" className="block w-full py-2.5 rounded-full bg-white text-violet-700 text-[11px] font-bold hover:bg-violet-50 transition-colors text-center shadow-md">
              Chọn ProMax
            </Link>
          </div>

        </div>

        <p className="text-center text-zinc-400 text-xs mt-10">
          Thanh toán qua <strong>PayOS</strong> (ATM, VISA, MoMo, ZaloPay). Hủy bất kỳ lúc nào.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 border-t border-zinc-100 pt-16 pb-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-sm text-black">AutoFarm MMO</span>
            <span className="text-[10px] text-zinc-400">© 2026 AutoFarm MMO. Architectural Automation.</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] text-zinc-400 font-medium">
            <a href="#" className="hover:text-zinc-700 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-700 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-700 transition-colors">API Docs</a>
            <a href="#" className="hover:text-zinc-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
