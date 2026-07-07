import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Send, Bot, User, Shield, Terminal, Zap, RefreshCw, BarChart2, 
  Layers, MessageSquare, Play, CheckCircle, AlertTriangle, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LogMessage {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  type?: "text" | "stats" | "progress" | "action";
  progressValue?: number;
  statsData?: { label: string; value: string; health: string }[];
}

export function DemoConsole() {
  const [activeTab, setActiveTab] = useState<"telegram" | "dashboard">("telegram");
  
  // Telegram Bot Simulator States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      text: "👋 Chào mừng bạn đến với **AutoFarm MMO Bot**! Hệ thống tối ưu hóa và tự động hóa Threads & Reels số 1 Việt Nam.\n\nGõ lệnh `/help` hoặc bấm các nút điều khiển bên dưới để bắt đầu kiến tạo đế chế MMO của bạn!",
      timestamp: "09:41",
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Administrative Dashboard States
  const [reelUrl, setReelUrl] = useState("https://www.instagram.com/reel/Cx189VhyzP9/");
  const [cloningLogs, setCloningLogs] = useState<LogMessage[]>([
    { id: "1", timestamp: "09:40:12", level: "info", message: "Hệ thống AutoFarm khởi động thành công. Sẵn sàng nhận lệnh." },
    { id: "2", timestamp: "09:40:15", level: "success", message: "Đã liên kết 12 tài khoản Threads và 8 tài khoản Reels qua API bảo mật." },
    { id: "3", timestamp: "09:40:18", level: "info", message: "Độ trễ Proxy SOCKS5 trung bình: 142ms. Trạng thái: Rất khỏe (99.8%)" }
  ]);
  const [cloneProgress, setCloneProgress] = useState<number | null>(null);
  const [cloneStage, setCloneStage] = useState("");
  const [commentTopic, setCommentTopic] = useState("MMO & Kiếm tiền Online");
  const [simulatedComments, setSimulatedComments] = useState<{ user: string; text: string; time: string }[]>([]);
  const [isCommenting, setIsCommenting] = useState(false);

  // Auto Scroll Telegram Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // Append a log to administrative panel
  const addLog = (message: string, level: "info" | "success" | "warn" | "error" = "info") => {
    const time = new Date().toTimeString().split(" ")[0];
    setCloningLogs((prev) => [
      ...prev,
      { id: Math.random().toString(), timestamp: time, level, message }
    ]);
  };

  // Telegram bot interactive command responder
  const handleBotCommand = (command: string) => {
    const time = new Date().toTimeString().split(" ")[0].substring(0, 5);
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: command,
      timestamp: time,
    };
    
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply: ChatMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: "",
        timestamp: time,
      };

      const cmdNorm = command.toLowerCase().trim();

      if (cmdNorm.startsWith("/help") || cmdNorm === "help" || cmdNorm === "hướng dẫn") {
        reply.text = `📚 **HƯỚNG DẪN SỬ DỤNG AUTOFARM MMO BOT**\n\n` +
          `• \`/status\` - Kiểm tra trạng thái hệ thống và sức khỏe proxy.\n` +
          `• \`/clone_reels\` - Tự động tải, lách bản quyền & đăng Reels hàng loạt.\n` +
          `• \`/comment_threads\` - Kích hoạt kịch bản AI tự động bình luận seeding Threads.\n` +
          `• \`/analytics\` - Xem thống kê lượt xem, tương tác ngày hôm nay.\n\n` +
          `Bấm các nút tiện ích nhanh bên dưới để thao tác nhanh hơn!`;
      } else if (cmdNorm.startsWith("/status") || cmdNorm === "status" || cmdNorm === "trạng thái") {
        reply.text = `⚡ **BÁO CÁO TRẠNG THÁI HỆ THỐNG**\n\n` +
          `• **Bot status**: Hoạt động bình thường (Online)\n` +
          `• **Tài khoản liên kết**: 12 Threads, 8 Instagram Reels\n` +
          `• **Proxy SOCKS5 IP**: 12/12 Đang hoạt động (Health 100%)\n` +
          `• **Thời gian hoạt động liên tục**: 14 ngày 6 giờ\n\n` +
          `_Mọi luồng dữ liệu đều đang chạy ẩn và an toàn tuyệt đối._`;
        reply.type = "stats";
        reply.statsData = [
          { label: "Threads Node", value: "Đang Chạy", health: "98%" },
          { label: "Video Render Core", value: "Hoạt Động", health: "100%" },
          { label: "Proxy Gateways", value: "12 SOCKS5", health: "99.8%" }
        ];
        addLog("Telegram Bot yêu cầu báo cáo trạng thái hệ thống.", "info");
      } else if (cmdNorm.startsWith("/analytics") || cmdNorm === "analytics" || cmdNorm === "thống kê") {
        reply.text = `📊 **SỐ LIỆU ĐẾ CHẾ MMO CỦA BẠN (HÔM NAY)**\n\n` +
          `• **Tổng số Reels đã đăng**: 42 reels (+12 so với hôm qua)\n` +
          `• **Tổng số Threads bình luận**: 382 comments\n` +
          `• **Tổng số lượt xem tiếp cận**: 154,200 views 🔥\n` +
          `• **Followers mới thu thập**: +1,420 followers\n` +
          `• **Ước tính doanh thu liên kết (Affiliate)**: $148.50`;
        addLog("Báo cáo số liệu tương tác được xuất qua Telegram API.", "success");
      } else if (cmdNorm.startsWith("/clone_reels") || cmdNorm === "clone reels" || cmdNorm === "tự động clone") {
        reply.text = `🎬 **KÍCH HOẠT QUÁ TRÌNH CLONE REELS HÀNG LOẠT**\n\n` +
          `Vui lòng chuyển qua tab **"Bảng Điều Khiển Auto"** bên cạnh để dán đường link Reels nguồn cần sao chép và chỉnh sửa video tự động bằng thuật toán AI!`;
        addLog("Bắt đầu cấu hình tiến trình clone Reels từ Telegram.", "warn");
      } else if (cmdNorm.startsWith("/comment_threads") || cmdNorm === "comment threads" || cmdNorm === "seeding threads") {
        reply.text = `💬 **KỊCH BẢN AI SEEDING THREADS**\n\n` +
          `Đã kích hoạt. Bạn có thể thiết lập chủ đề seeding thông minh (Crypto, Affiliate, Tâm sự...) ngay tại tab **"Bảng Điều Khiển Auto"** bên cạnh để xem AI tự tạo bình luận và giả lập người dùng thật tương tác!`;
      } else {
        reply.text = `🤖 Xin lỗi, tôi không hiểu lệnh này. Vui lòng gõ \`/help\` để xem danh sách lệnh được hỗ trợ, hoặc click nút tiện ích nhanh bên dưới nhé!`;
      }

      setChatMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  const handleSendTelegram = (e: FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const msg = inputVal;
    setInputVal("");
    handleBotCommand(msg);
  };

  // Trigger automated simulation of cloning a video
  const handleStartCloneSimulation = () => {
    if (!reelUrl.trim()) return;
    if (cloneProgress !== null) return;

    setCloneProgress(0);
    setCloneStage("Đang phân tích Reels nguồn & trích xuất mã ID...");
    addLog(`Yêu cầu sao chép video Reels: ${reelUrl}`, "info");

    const stages = [
      { p: 15, msg: "Đang tải xuống tệp tin Reels gốc chất lượng 1080p...", log: "Bắt đầu tải video thô bằng Node.js downloader...", level: "info" as const },
      { p: 35, msg: "Đang phân tích và xử lý âm thanh tự động (Lách bản quyền)...", log: "Đã trích xuất audio. Thay đổi tần số pitch thêm +0.1% để tránh AI quét quét.", level: "info" as const },
      { p: 60, msg: "Đang áp dụng bộ lọc hình ảnh AI (Thay đổi md5, lật khung hình)...", log: "Đã xóa siêu dữ liệu gốc (Metadata), thay đổi trị số MD5 hash, áp dụng bộ lọc mịn hạt 3D.", level: "success" as const },
      { p: 85, msg: "Đang viết Caption & Tag bằng mô hình Gemini AI thông minh...", log: "Mô hình tạo caption Việt hóa: 'Bí kíp cày MMO 1 click cho người lười... 🔥 #kiemonline #affiliate #threads'", level: "info" as const },
      { p: 100, msg: "Hoàn tất! Video đã được đăng thành công lên 8 kênh Reels vệ tinh.", log: "Đã xuất bản thành công trên 8 tài khoản vệ tinh qua SOCKS5 Proxy khác biệt.", level: "success" as const }
    ];

    stages.forEach((s, idx) => {
      setTimeout(() => {
        setCloneProgress(s.p);
        setCloneStage(s.msg);
        addLog(s.log, s.level);
        
        if (idx === stages.length - 1) {
          setTimeout(() => {
            setCloneProgress(null);
            setCloneStage("");
          }, 4000);
        }
      }, (idx + 1) * 2000);
    });
  };

  // Simulated Thread Comment Seed Generator
  const handleGenerateCommentsSim = () => {
    if (isCommenting) return;
    setIsCommenting(true);
    setSimulatedComments([]);
    addLog(`Đang gửi yêu cầu seeding kịch bản AI: Chủ đề "${commentTopic}"`, "info");

    const userNames = ["vietmmo_pro", "thanhtung.aff", "nguyen_anh_99", "mmo_master", "tuyet_mai_marketing"];
    const commentsList: Record<string, string[]> = {
      "MMO & Kiếm tiền Online": [
        "Cách này xịn thật, mình test thử tối qua ra ngay 3 đơn tiếp thị liên kết đầu tiên rồi, cảm ơn ad!",
        "Dùng tool AutoFarm MMO này có bị quét tài khoản không mọi người? Muốn đầu tư gói Pro quá.",
        "Bot xịn đét, treo VPS chạy 24/7 clone reels lách viễn vông mà view vẫn lên đều đều, quá phê.",
        "Chia sẻ thêm về cấu hình proxy đi ad ơi, mua socks5 của bên nào ngon nhất thế?",
        "Cảm ơn bài viết bổ ích! Vừa setup xong hệ thống 10 nick, hi vọng bão view."
      ],
      "Crypto & Trade Coin": [
        "Đúng lúc đang cần tìm tool cày thread airdrop, cái này tự động bình luận theo danh sách bài viết đúng không ad?",
        "Seeding chủ đề tiền điện tử rất tự nhiên, AI viết bình luận phân tích kỹ thuật như thật luôn ấy.",
        "Kèo airdrop vừa rồi ăn đậm nhờ clone chéo acc Threads bằng tool này, bớt được bao nhiêu công sức.",
        "Đã dùng thử và cực kỳ khuyến nghị ae làm airdrop/retroactive nên sắm ngay gói Pro.",
        "Có hỗ trợ tự động đổi ví trong bình luận khi cày airdrop không ad?"
      ],
      "Tâm sự & Phong cách sống": [
        "Bình luận rất lịch sự và sâu sắc, không có cảm giác là bot hay AI spam tí nào luôn.",
        "Cảm ơn chia sẻ giá trị của bạn, mình đã lưu lại bài viết rồi nhé.",
        "Lối tư duy tối giản này hay quá, giúp mình có thêm động lực dọn dẹp lại cuộc sống.",
        "Một bài viết rất chạm, chúc bạn một ngày làm việc tràn đầy năng lượng tích cực!",
        "Đúng điều mình đang suy nghĩ bấy lâu nay, cảm ơn tác giả."
      ]
    };

    const targetList = commentsList[commentTopic] || commentsList["MMO & Kiếm tiền Online"];
    
    targetList.forEach((text, idx) => {
      setTimeout(() => {
        const newComm = {
          user: userNames[idx],
          text,
          time: new Date().toLocaleTimeString().substring(0, 5)
        };
        setSimulatedComments((prev) => [...prev, newComm]);
        addLog(`[AI Comment Engine] Đã đăng thành công bình luận từ nick @${newComm.user}: "${text.substring(0, 30)}..."`, "success");
        
        if (idx === targetList.length - 1) {
          setIsCommenting(false);
        }
      }, (idx + 1) * 1500);
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-zinc-900/90 dark:bg-zinc-950/95 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[640px] relative z-10 font-sans">
      
      {/* Console Top Header */}
      <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-green-500/80 inline-block"></span>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-mono text-xs font-semibold tracking-wider text-zinc-300">AUTOFARM SIMULATOR v2.4</span>
          </div>
        </div>

        {/* Console Navigation tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab("telegram")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "telegram" 
                ? "bg-zinc-800 text-white shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Telegram Bot Sim</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "dashboard" 
                ? "bg-zinc-800 text-white shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Bảng Điều Khiển Auto</span>
          </button>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Active Simulation View */}
        <div className="flex-grow flex flex-col h-full overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800">
          
          <AnimatePresence mode="wait">
            {activeTab === "telegram" ? (
              // Tab 1: TELEGRAM BOT SIMULATOR
              <motion.div 
                key="telegram"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-grow flex flex-col h-full bg-zinc-900/40 relative"
              >
                {/* Chat header info */}
                <div className="px-5 py-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                      AF
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        AutoFarm MMO Bot
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-ping"></span>
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-medium">bot tự động hóa MMO số 1 VN</p>
                    </div>
                  </div>
                  <div className="text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 px-2.5 py-1 rounded-full font-semibold">
                    ● Hệ Thống Đang Chạy
                  </div>
                </div>

                {/* Chat History */}
                <div className="flex-grow overflow-y-auto p-5 space-y-4 text-xs font-sans">
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      {msg.sender === "bot" ? (
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                          <Bot className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-700 text-white flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                          msg.sender === "user" 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "bg-zinc-800/80 text-zinc-200 rounded-tl-none border border-zinc-700/50"
                        }`}>
                          {/* Parse bold headers nicely if any */}
                          {msg.text.split("**").map((text, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{text}</strong> : text)}

                          {/* Render custom stat list */}
                          {msg.type === "stats" && msg.statsData && (
                            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-zinc-700/60 pt-2.5">
                              {msg.statsData.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                                  <span className="text-zinc-400 font-medium">{s.label}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-zinc-200 font-semibold">{s.value}</span>
                                    <span className="text-emerald-400 text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/30">{s.health}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className={`text-[9px] text-zinc-500 font-medium ${msg.sender === "user" ? "text-right" : ""}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Bot typing state indicator */}
                  {isTyping && (
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-200"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-300"></span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendTelegram} className="p-4 bg-zinc-950/40 border-t border-zinc-800 flex gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Nhập tin nhắn hoặc lệnh /status, /analytics..."
                    className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Fast Quick Buttons Panel */}
                <div className="px-4 pb-4 pt-1 bg-zinc-950/40 grid grid-cols-3 gap-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => handleBotCommand("/status")}
                    className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 py-1.5 px-2 rounded-lg text-[10px] font-semibold border border-zinc-800 transition-all text-center flex items-center justify-center gap-1"
                  >
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>/status</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBotCommand("/analytics")}
                    className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 py-1.5 px-2 rounded-lg text-[10px] font-semibold border border-zinc-800 transition-all text-center flex items-center justify-center gap-1"
                  >
                    <BarChart2 className="w-3 h-3 text-sky-400" />
                    <span>/analytics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBotCommand("/help")}
                    className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 py-1.5 px-2 rounded-lg text-[10px] font-semibold border border-zinc-800 transition-all text-center flex items-center justify-center gap-1"
                  >
                    <Bot className="w-3 h-3 text-amber-400" />
                    <span>/help</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              // Tab 2: AUTOFARM CONTROL PANEL
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-grow flex flex-col h-full bg-zinc-900/10 p-5 space-y-6 overflow-y-auto"
              >
                {/* Panel Module 1: Auto Clone Reels Simulator */}
                <div className="bg-zinc-900/60 p-4.5 rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Reels Cloning Engine
                      </h4>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Bypass MD5 algorithms v2.0</span>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Dán URL video Instagram Reels/Tiktok bất kỳ. Thuật toán AI sẽ tự động tải, lách bản quyền hình ảnh &amp; âm thanh rồi đồng bộ hóa lên các kênh MMO của bạn.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reelUrl}
                      onChange={(e) => setReelUrl(e.target.value)}
                      placeholder="Instagram Reels / Tiktok Video URL..."
                      disabled={cloneProgress !== null}
                      className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleStartCloneSimulation}
                      disabled={cloneProgress !== null}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                    >
                      {cloneProgress !== null ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>{cloneProgress !== null ? "Đang xử lý..." : "Clone ngay"}</span>
                    </button>
                  </div>

                  {/* Cloning Status Progress bar */}
                  {cloneProgress !== null && (
                    <div className="space-y-2 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/60">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-300 font-medium animate-pulse">{cloneStage}</span>
                        <span className="text-emerald-400 font-bold font-mono">{cloneProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${cloneProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel Module 2: Thread Comment Seeding Simulator */}
                <div className="bg-zinc-900/60 p-4.5 rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        Threads AI Commenter
                      </h4>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Simulate Authentic Discourse</span>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Giả lập hàng trăm bình luận ngữ cảnh thông minh để kích hoạt thuật toán tương tác Threads, kéo traffic về link Affiliate/Airdrop.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow">
                      <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">Chọn Chủ đề Seeding:</label>
                      <select 
                        value={commentTopic}
                        onChange={(e) => setCommentTopic(e.target.value)}
                        disabled={isCommenting}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                      >
                        <option value="MMO & Kiếm tiền Online">MMO & Kiếm tiền Online</option>
                        <option value="Crypto & Trade Coin">Crypto & Trade Coin</option>
                        <option value="Tâm sự & Phong cách sống">Tâm sự & Phong cách sống</option>
                      </select>
                    </div>

                    <div className="flex items-end shrink-0">
                      <button
                        type="button"
                        onClick={handleGenerateCommentsSim}
                        disabled={isCommenting}
                        className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isCommenting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-yellow-300" />
                        )}
                        <span>Kích Hoạt AI Seeding</span>
                      </button>
                    </div>
                  </div>

                  {/* Display Simulated Generated Comments */}
                  {simulatedComments.length > 0 && (
                    <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60 space-y-2.5 max-h-36 overflow-y-auto">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Bình luận vừa tạo trực tiếp trên Threads:</div>
                      {simulatedComments.map((c, idx) => (
                        <div key={idx} className="flex gap-2 text-[11px] border-b border-zinc-900 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-sky-400 font-bold font-mono">@{c.user}:</span>
                          <span className="text-zinc-300 flex-grow">{c.text}</span>
                          <span className="text-zinc-600 font-mono text-[9px]">{c.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Side: SYSTEM REALTIME LOGGER (Terminal style) */}
        <div className="w-full md:w-80 bg-zinc-950/80 p-5 flex flex-col h-64 md:h-full overflow-hidden text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400 border-b border-zinc-900 pb-3 mb-4 font-semibold uppercase tracking-wider text-[10px]">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Console Live Logs</span>
          </div>

          {/* Log Stream */}
          <div className="flex-grow overflow-y-auto space-y-3.5 scrollbar-thin text-[10.5px]">
            {cloningLogs.map((log) => (
              <div key={log.id} className="flex gap-2 items-start leading-relaxed">
                <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                <span className={`shrink-0 uppercase font-bold text-[9px] px-1 py-0.2 rounded ${
                  log.level === "success" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" :
                  log.level === "warn" ? "bg-amber-950 text-amber-400 border border-amber-900/30" :
                  log.level === "error" ? "bg-red-950 text-red-400 border border-red-900/30" :
                  "bg-zinc-900 text-zinc-400"
                }`}>
                  {log.level}
                </span>
                <span className="text-zinc-300 whitespace-pre-wrap">{log.message}</span>
              </div>
            ))}
          </div>

          {/* Quick Clear Console Logs */}
          <div className="pt-3 border-t border-zinc-900/60 mt-2 flex justify-between items-center text-[10px] text-zinc-500">
            <span>Server: localhost:3000</span>
            <button
              onClick={() => setCloningLogs([
                { id: "init-clr", timestamp: "Now", level: "info", message: "Nhật ký hệ thống đã được dọn sạch." }
              ])}
              className="hover:text-zinc-300 transition-colors font-semibold"
            >
              Clear Logs
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
