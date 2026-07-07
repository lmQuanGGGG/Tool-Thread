import { useState, useEffect } from "react";
import { 
  Check, ArrowRight, Play, Layers, MessageSquare, Bot, BarChart2, 
  HelpCircle, ChevronDown, CheckCircle2, X, PlusCircle, Globe, 
  Sparkles, Zap, Smartphone, ShieldCheck, RefreshCw, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThreeBackground } from "./components/ThreeBackground";
import { DemoConsole } from "./components/DemoConsole";

// System Pricing Interfaces
interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  popular: boolean;
  features: string[];
}

export default function App() {
  // Modal states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Onboarding Wizard states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [platforms, setPlatforms] = useState({ threads: true, reels: true, tiktok: false });
  const [niche, setNiche] = useState("Kiếm tiền Online");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [proxyType, setProxyType] = useState("vietnam");
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [simulatingActivation, setSimulatingActivation] = useState(false);

  // FAQ Accordion states
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
    3: false,
  });

  // Smooth scroll helper
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenOnboarding = (planId: string | null = null) => {
    setSelectedPlan(planId);
    setOnboardingStep(1);
    setIsOnboardingCompleted(false);
    setShowOnboarding(true);
  };

  const handleNextStep = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
    } else {
      // Simulate Bot Integration and Node deployment
      setSimulatingActivation(true);
      setTimeout(() => {
        setSimulatingActivation(false);
        setIsOnboardingCompleted(true);
      }, 2500);
    }
  };

  const handlePrevStep = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(prev => prev - 1);
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const pricingPlans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      price: "$49",
      period: "/tháng",
      desc: "Lựa chọn tối ưu để khởi động chiến dịch MMO quy mô nhỏ.",
      popular: false,
      features: [
        "Đăng tối đa 10 Auto-Clones/ngày",
        "AI Seeding bình luận Threads cơ bản",
        "Hỗ trợ Proxy định danh mặc định",
        "Điều khiển qua Telegram Bot 24/7",
        "Hỗ trợ tiêu chuẩn qua Telegram"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: "$149",
      period: "/tháng",
      desc: "Cấu hình siêu cấp dành cho MMO Creator chuyên nghiệp cần gia tăng quy mô lớn.",
      popular: true,
      features: [
        "Không giới hạn số lượng Auto-Clones",
        "Bộ xử lý AI Comments tối ưu theo ngữ cảnh bài viết",
        "Tự động lách thuật toán MD5 cao cấp",
        "Tích hợp Proxy SOCKS5 riêng biệt cực nhanh",
        "Ưu tiên hỗ trợ kỹ thuật 1-1",
        "Quyền truy cập sớm các module cập nhật mới"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "",
      desc: "Hạ tầng chuyên dụng cho các Studio MMO, Agency quản lý hàng trăm tài khoản.",
      popular: false,
      features: [
        "Dedicated Server (VPS riêng biệt, tối ưu băng thông)",
        "Tích hợp API tùy chỉnh cho hệ thống nội bộ",
        "Cam kết độ ổn định (SLA) 99.9%",
        "Proxy độc quyền IPv4/IPv6 không trùng lặp",
        "Chuyên viên kỹ thuật trực tuyến hỗ trợ liên tục"
      ]
    }
  ];

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 flex flex-col relative font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* 3D Falling Dollars & Coins Canvas Background (Z-0) */}
      <ThreeBackground />

      {/* FIXED GLASSMORPHIC TOP NAVIGATION (Z-40) */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-4 py-4 md:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-md flex items-center justify-between px-6 py-3.5 pointer-events-auto transition-all">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg md:text-xl tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
              AutoFarm MMO
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <button onClick={() => scrollToId("features")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Tính Năng</button>
            <button onClick={() => scrollToId("playground")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Bản Thử Nghiệm</button>
            <button onClick={() => scrollToId("pricing")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Bảng Giá</button>
            <button onClick={() => scrollToId("faqs")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Giải Đáp</button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOpenOnboarding()}
              className="hidden sm:block text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-4 py-2 transition-colors"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => handleOpenOnboarding()}
              className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs md:text-sm px-5 py-2.5 rounded-full shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Bắt Đầu Ngay
            </button>
          </div>
        </div>
      </nav>

      {/* CORE LAYOUT OVERLAY CONTAINER (Z-10) */}
      <main className="flex-grow pt-28 md:pt-36 relative z-10">
        
        {/* HERO SECTION */}
        <section className="px-4 max-w-5xl mx-auto text-center mb-24 md:mb-32 relative">
          
          {/* Animated online node status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            <span>SYSTEM ONLINE 2.0</span>
          </div>

          {/* Captivating primary title */}
          <h1 className="font-display font-bold text-4xl sm:text-6xl md:text-7xl tracking-tighter text-zinc-900 dark:text-white leading-[1.1] mb-8 max-w-4xl mx-auto">
            Automate Your Threads <br className="hidden sm:block"/>&amp; Reels in <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">1 Click</span>
          </h1>

          {/* Subtitle with deep product value */}
          <p className="font-sans text-sm sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
            Hạ tầng tự động hóa tối tân dành cho nhà sáng tạo nội dung MMO Việt Nam. Sao chép nội dung triệu view, giả lập seeding bình luận và mở rộng đế chế đa kênh thông qua một Telegram bot duy nhất. An toàn, hiệu quả vượt bậc.
          </p>

          {/* Primary Call to Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => handleOpenOnboarding()}
              className="w-full sm:w-auto bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-sm px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <span>Bắt Đầu Tự Động Hóa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToId("playground")}
              className="w-full sm:w-auto bg-white/70 hover:bg-white dark:bg-zinc-900/70 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-sm px-8 py-4 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-md flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
            >
              <Play className="w-4 h-4 text-blue-500" />
              <span>Chạy Thử Bản Demo</span>
            </button>
          </div>
        </section>

        {/* CORE INFRASTRUCTURE (BENTO GRID) */}
        <section className="px-4 max-w-7xl mx-auto mb-28 md:mb-40" id="features">
          <div className="text-center md:text-left mb-12 max-w-2xl">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-2 font-mono">Tính năng cốt lõi</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 dark:text-white">
              Hạ Tầng Tối Tân Nhất
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Auto Clone Reels (Double Wide on MD) */}
            <div className="col-span-1 md:col-span-2 rounded-3xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 shadow-md backdrop-blur-md p-8 md:p-10 flex flex-col justify-between overflow-hidden relative group hover:shadow-lg transition-all duration-300">
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl md:text-2xl text-zinc-900 dark:text-white">Auto Clone Reels</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Sao chép và lách thuật toán kiểm duyệt hình ảnh của các nền tảng tự động. Hệ thống tự động thay đổi giá trị băm (MD5 hash), lật khung hình và phủ màu thông minh giúp tăng 300% hiệu suất cày view vệ tinh.
                </p>
              </div>

              {/* Decorative stacked visual elements resembling phone interfaces inside Bento card */}
              <div className="mt-8 h-40 flex items-center justify-center relative opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="absolute w-36 h-48 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-md rotate-[-8deg] -translate-x-12 translate-y-4 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="absolute w-36 h-48 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-xl z-20 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">LIVE REEL</span>
                    <span className="text-[8px] font-mono text-zinc-400">9:41 AM</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[65%]"></div>
                  </div>
                </div>
                <div className="absolute w-36 h-48 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-md rotate-[8deg] translate-x-12 translate-y-4 flex items-center justify-center">
                  <Star className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
            </div>

            {/* Bento Card 2: Auto Comment Threads (Single Wide on MD) */}
            <div className="col-span-1 rounded-3xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 shadow-md backdrop-blur-md p-8 md:p-10 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">Auto Comment Threads</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Thiết lập bình luận tự động theo chủ đề qua công nghệ AI. Tạo tương tác seeding cực kỳ tự nhiên, kích thích thuật toán Threads lan tỏa bài viết nhanh gấp 4 lần.
                </p>
              </div>

              {/* Animated skeleton comments popping inside Bento card */}
              <div className="mt-8 space-y-2">
                <div className="bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-2xl rounded-tl-none border border-zinc-200/40 dark:border-zinc-700/40 text-[10px] space-y-1">
                  <span className="font-bold text-blue-500">@vietmmo_pro</span>
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-4/5 animate-pulse"></div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-2xl rounded-tl-none border border-zinc-200/40 dark:border-zinc-700/40 text-[10px] space-y-1 w-[90%]">
                  <span className="font-bold text-blue-500">@tung_affiliate</span>
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-2/3 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Telegram Control (Single Wide on MD) */}
            <div className="col-span-1 rounded-3xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 shadow-md backdrop-blur-md p-8 md:p-10 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">Telegram Control</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Tất cả thao tác cày MMO nằm trọn trong chiếc điện thoại của bạn. Điều khiển hàng trăm kênh vệ tinh, kiểm tra trạng thái proxy và thống kê thông qua mã chat an toàn.
                </p>
              </div>

              {/* Visual simulated bot token */}
              <div className="mt-8 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 font-mono text-[9px] text-zinc-400 space-y-1.5 shadow-md">
                <p className="text-amber-400"># TELEGRAM BOT CONNECTED</p>
                <p>TOKEN: 749320:AAF_GvYxQ...</p>
                <p className="text-emerald-500">✓ Webhook Operational</p>
              </div>
            </div>

            {/* Bento Card 4: Omniscient Analytics (Double Wide on MD) */}
            <div className="col-span-1 md:col-span-2 rounded-3xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 shadow-md backdrop-blur-md p-8 md:p-10 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl md:text-2xl text-zinc-900 dark:text-white">Omniscient Analytics</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Thống kê doanh thu, số lượt xem tiếp cận theo thời gian thực. Giám sát sự phát triển của hệ thống kênh vệ tinh để tối ưu hóa chiến dịch Affiliate hiệu quả nhất.
                </p>
              </div>

              {/* Bar chart mockup indicating continuous traffic growth */}
              <div className="mt-8 h-24 flex items-end gap-2.5 px-4">
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-t-lg h-[15%]"></div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-t-lg h-[35%]"></div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-t-lg h-[25%]"></div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-t-lg h-[55%]"></div>
                <div className="w-full bg-blue-500/60 rounded-t-lg h-[75%]"></div>
                <div className="w-full bg-blue-500/80 rounded-t-lg h-[85%]"></div>
                <div className="w-full bg-blue-600 rounded-t-lg h-[100%] flex items-center justify-center relative">
                  <span className="absolute -top-6 text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono">154K</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* INTERACTIVE DEMO CONSOLE SIMULATOR */}
        <section className="px-4 py-20 bg-zinc-950/30 dark:bg-black/30 border-y border-zinc-200/30 dark:border-zinc-800/30 backdrop-blur-sm mb-28 md:mb-40" id="playground">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            
            <div className="text-center max-w-3xl mb-12 space-y-3">
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-widest block font-mono">Trực quan &amp; Độc Đáo</span>
              <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 dark:text-white">
                Trải Nghiệm Hệ Thống Tự Động
              </h2>
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400">
                Nhấp chuột chọn các tính năng, tương tác với Telegram Bot ảo hoặc thử dán một đường link video cần clone bên dưới để xem hệ thống vận hành trong tích tắc!
              </p>
            </div>

            {/* Interactive Console Component */}
            <DemoConsole />

          </div>
        </section>

        {/* PRICING PLANS */}
        <section className="px-4 max-w-7xl mx-auto mb-28 md:mb-40" id="pricing">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Lựa Chọn Định Quy Mô</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 dark:text-white">
              Quy Mô Minh Bạch
            </h2>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Không phí ẩn. Lựa chọn cấu hình phù hợp với khả năng khai thác MMO của bạn ngay hôm nay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-3xl bg-white/60 dark:bg-zinc-900/40 border p-8 backdrop-blur-md flex flex-col justify-between relative group hover:scale-[1.02] hover:shadow-lg transition-all duration-300 ${
                  plan.popular 
                    ? "border-blue-500/80 ring-2 ring-blue-500/20 shadow-xl" 
                    : "border-zinc-200/50 dark:border-zinc-800/50"
                }`}
                style={plan.popular ? { boxShadow: "0 20px 40px rgba(59, 130, 246, 0.08)" } : {}}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                    Khuyên Dùng
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">{plan.name}</span>
                    <div className="flex items-baseline gap-1.5 text-zinc-900 dark:text-white">
                      <span className="text-4xl md:text-5xl font-display font-bold">{plan.price}</span>
                      <span className="text-xs text-zinc-500 font-medium">{plan.period}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed min-h-12">{plan.desc}</p>
                  </div>

                  <div className="h-[1px] bg-zinc-200/60 dark:bg-zinc-800/60 w-full" />

                  {/* Feature Checklist */}
                  <ul className="space-y-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handleOpenOnboarding(plan.id)}
                    className={`w-full py-3 px-6 rounded-full font-semibold text-xs transition-all duration-200 hover:scale-105 active:scale-95 ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                        : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                    }`}
                  >
                    {plan.id === "enterprise" ? "Liên hệ ngay" : `Chọn gói ${plan.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="px-4 max-w-4xl mx-auto mb-28 md:mb-40" id="faqs">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Giải đáp thắc mắc</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight text-zinc-900 dark:text-white">
              Giải Đáp Hệ Thống
            </h2>
          </div>

          <div className="space-y-4 bg-white/40 dark:bg-zinc-900/10 p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md">
            {[
              {
                q: "AutoFarm MMO vận hành như thế nào?",
                a: "Hệ thống liên kết tài khoản Threads và Reels của bạn qua giao diện API an toàn của chúng tôi. Khi được thiết lập, bạn có thể ra lệnh cày MMO hoàn toàn thông qua Telegram Bot: tự động tải, biến đổi md5 lách kiểm duyệt video và kích hoạt AI bình luận seeding tương tác cực kì thông minh."
              },
              {
                q: "Có bị quét khóa tài khoản khi tự động hóa không?",
                a: "Không. AutoFarm MMO tích hợp hạ tầng định tuyến Proxy độc quyền bảo vệ danh tính, sử dụng các dải địa chỉ IPv4/IPv6 hoàn toàn khác biệt trên mỗi luồng chạy. Ngoài ra, AI Comments giả lập ngẫu nhiên thời gian trễ gõ phím để đảm bảo an toàn tuyệt đối."
              },
              {
                q: "Tôi có thể sử dụng proxy riêng của mình không?",
                a: "Hoàn toàn được. Ở gói Pro và Enterprise, hệ thống hỗ trợ bạn dán trực tiếp thông tin Proxy SOCKS5 riêng biệt vào bảng quản trị điều khiển để tối ưu hóa an toàn IP theo nhu cầu địa lý của bạn."
              },
              {
                q: "Chính sách dùng thử và hoàn tiền ra sao?",
                a: "Bạn có thể sử dụng bản demo mô phỏng miễn phí của chúng tôi bất cứ lúc nào. Khi đăng ký gói dịch vụ chính thức, chúng tôi cung cấp chính sách hỗ trợ hoàn tiền 100% trong vòng 7 ngày đầu nếu hệ thống xảy ra lỗi kỹ thuật không thể khắc phục."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 last:border-0 last:pb-0"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm md:text-base py-2.5 text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${faqOpen[idx] ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {faqOpen[idx] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed px-6 pt-1.5"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white/40 dark:bg-zinc-950/40 border-t border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto py-16 px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <span className="font-display font-bold text-lg text-zinc-900 dark:text-white">AutoFarm MMO</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center md:text-left">
              © 2026 AutoFarm MMO. Hệ thống tối ưu hóa &amp; tự động hóa cày MMO số 1 Việt Nam.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <a href="#" className="hover:text-blue-500 transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Tài liệu API</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Liên hệ hỗ trợ</a>
          </div>
        </div>
      </footer>

      {/* PREMIUM INTERACTIVE ONBOARDING WIZARD MODAL (Z-50) */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnboarding(false)}
              className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-zinc-900 text-white rounded-3xl border border-zinc-800 w-full max-w-xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] font-sans"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowOnboarding(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress Stepper Header */}
              <div className="px-6 pt-8 pb-4 border-b border-zinc-800/50 bg-zinc-950/30">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-600 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                    Cấu Hình
                  </span>
                  {selectedPlan && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-zinc-700/50">
                      Gói {selectedPlan}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white mt-2">Bắt Đầu Thiết Lập Hệ Thống</h3>

                {/* Progress Visual Dots */}
                {!isOnboardingCompleted && (
                  <div className="flex items-center gap-1.5 mt-4">
                    {[1, 2, 3].map((step) => (
                      <div 
                        key={step} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          step === onboardingStep 
                            ? "bg-blue-500 w-8" 
                            : step < onboardingStep 
                            ? "bg-emerald-500 w-4" 
                            : "bg-zinc-800 w-4"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Step Forms */}
              <div className="p-6 overflow-y-auto flex-grow space-y-5 text-xs">
                
                {simulatingActivation ? (
                  // Active Simulation loader
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-white">Đang khởi tạo Node MMO của bạn...</p>
                      <p className="text-zinc-400 text-[11px] max-w-sm">
                        Đang định tuyến cổng Proxy SOCKS5, tạo API webhook liên kết và kích hoạt bộ thu phát Telegram Bot an toàn. Vui lòng chờ...
                      </p>
                    </div>
                  </div>
                ) : isOnboardingCompleted ? (
                  // Grand success page
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        Hệ Thống Đã Sẵn Sàng!
                      </h4>
                      <p className="text-zinc-400 text-[11px] max-w-sm leading-relaxed mx-auto">
                        Tài khoản liên kết của bạn đã được thiết lập thành công trên cụm server AutoFarm MMO độc quyền qua SOCKS5 Proxy an toàn.
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 w-full text-left font-mono text-[10.5px] space-y-1.5">
                      <p className="text-emerald-400 font-bold">✓ CONFIGURATION COMPLETED</p>
                      <p>• Node Server ID: nodes-af-vn24</p>
                      <p>• Connected handle: @{telegramUsername || "vietmmo_guest"}</p>
                      <p>• Target Niche: {niche}</p>
                      <p>• Proxy Location: {proxyType.toUpperCase()}</p>
                    </div>

                    <div className="w-full">
                      <button
                        onClick={() => setShowOnboarding(false)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-md transition-all active:scale-95"
                      >
                        Vào Bảng Điều Khiển Ngay
                      </button>
                    </div>
                  </div>
                ) : (
                  // Wizard normal steps
                  <>
                    {onboardingStep === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          Bước 1: Lựa chọn các nền tảng mạng xã hội bạn muốn tự động hóa đồng bộ cùng chủ đề nội dung MMO của bạn.
                        </p>

                        <div className="space-y-2">
                          <label className="block text-[10px] text-zinc-500 font-bold uppercase">Nền tảng tích hợp:</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setPlatforms(p => ({ ...p, threads: !p.threads }))}
                              className={`p-3 rounded-xl border font-bold text-center transition-all ${
                                platforms.threads 
                                  ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
                              }`}
                            >
                              Threads
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlatforms(p => ({ ...p, reels: !p.reels }))}
                              className={`p-3 rounded-xl border font-bold text-center transition-all ${
                                platforms.reels 
                                  ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
                              }`}
                            >
                              Reels (Instagram)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlatforms(p => ({ ...p, tiktok: !p.tiktok }))}
                              className={`p-3 rounded-xl border font-bold text-center transition-all ${
                                platforms.tiktok 
                                  ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
                              }`}
                            >
                              Tiktok Video
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] text-zinc-500 font-bold uppercase">Chủ đề khai thác (Niche):</label>
                          <select
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                          >
                            <option value="Kiếm tiền Online">Kiếm tiền Online &amp; Affiliate Marketing</option>
                            <option value="Crypto & Trading">Crypto &amp; Trade Coin / NFT Airdrops</option>
                            <option value="Thời trang & Mỹ phẩm">Thời trang &amp; Mỹ phẩm làm đẹp</option>
                            <option value="Du lịch & Ẩm thực">Du lịch &amp; Khám phá ẩm thực</option>
                            <option value="Phong cách sống">Phong cách sống &amp; Tâm sự truyền động lực</option>
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {onboardingStep === 2 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          Bước 2: Cung cấp Telegram Username để hệ thống tạo token bảo mật, cho phép bạn điều khiển các lệnh cày MMO trực tiếp từ xa.
                        </p>

                        <div className="space-y-2">
                          <label className="block text-[10px] text-zinc-500 font-bold uppercase">Telegram Handle của bạn:</label>
                          <div className="flex gap-2">
                            <span className="bg-zinc-950 border border-zinc-800 border-r-0 rounded-l-xl px-3 py-2.5 font-bold text-zinc-500 flex items-center justify-center font-mono">
                              @
                            </span>
                            <input
                              type="text"
                              value={telegramUsername}
                              onChange={(e) => setTelegramUsername(e.target.value)}
                              placeholder="vietmmo_admin"
                              className="flex-grow bg-zinc-950 border border-zinc-800 rounded-r-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 italic mt-1">
                            Nhập chính xác để bot kích hoạt mã xác thực liên kết đến thiết bị di động của bạn.
                          </p>
                        </div>

                        <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 flex gap-3">
                          <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="font-bold text-white text-[11px]">Bảo Mật Tuyệt Đối</h5>
                            <p className="text-[10px] text-zinc-500 leading-relaxed">
                              Chúng tôi KHÔNG bao giờ yêu cầu mật khẩu Telegram hay thông tin cá nhân. Liên kết hoạt động thông qua một chiều Webhook an toàn.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {onboardingStep === 3 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          Bước 3: Tối ưu mạng lưới Proxy định tuyến để chống quét khóa tài khoản. Hệ thống phân chia IP riêng biệt cho từng luồng hoạt động.
                        </p>

                        <div className="space-y-2">
                          <label className="block text-[10px] text-zinc-500 font-bold uppercase">Vị trí địa lý Proxy:</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setProxyType("vietnam")}
                              className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2.5 transition-all ${
                                proxyType === "vietnam" 
                                  ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
                              }`}
                            >
                              <Globe className="w-4 h-4 text-emerald-400" />
                              <div className="text-left">
                                <p className="text-[11px] font-bold">Việt Nam (Hà Nội/HCM)</p>
                                <p className="text-[9px] font-medium text-zinc-500">Latency trung bình: ~45ms</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setProxyType("usa")}
                              className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2.5 transition-all ${
                                proxyType === "usa" 
                                  ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
                              }`}
                            >
                              <Globe className="w-4 h-4 text-sky-400" />
                              <div className="text-left">
                                <p className="text-[11px] font-bold">Hoa Kỳ (California)</p>
                                <p className="text-[9px] font-medium text-zinc-500">Latency trung bình: ~195ms</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl flex gap-3 text-zinc-400">
                          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[10.5px] leading-relaxed">
                            Cấu hình Pro sẽ được tự động tích hợp Proxy SOCKS5 dân cư chuyên dụng xoay vòng IP sau mỗi 30 phút để nâng tầm an toàn tối đa.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Step Controls */}
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={onboardingStep === 1}
                        className="bg-transparent text-zinc-400 hover:text-white text-xs font-semibold px-4 py-2 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Quay lại
                      </button>
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>{onboardingStep === 3 ? "Kích Hoạt Node" : "Tiếp tục"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}

              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
