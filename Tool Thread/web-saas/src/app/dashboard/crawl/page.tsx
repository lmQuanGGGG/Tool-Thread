"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload, Copy, CheckCheck, ChevronRight, Loader2,
  FileJson, Image as ImageIcon, Trash2, Send, BookOpen,
  Terminal, AlertCircle, CreditCard
} from "lucide-react";
import { supabase } from "@/utils/supabase";

const CRAWL_SCRIPT = `(function () {
    console.clear();
    console.log("%c🚀 THREADS CRAWLER - ACTIVATED", "color: #00ff00; font-size: 20px; font-weight: bold;");
    window.rawThreadsData = [];
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        if (url.includes('graphql')) {
            const clone = response.clone();
            clone.text().then(text => {
                text.split('\\n').forEach(chunk => {
                    try {
                        const json = JSON.parse(chunk);
                        const str = JSON.stringify(json);
                        if (str.includes('thread_items') || str.includes('text_post_app_info')) {
                            window.rawThreadsData.push(json);
                        }
                    } catch (e) {}
                });
            }).catch(() => {});
        }
        return response;
    };

    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    XHR.open = function (method, url) {
        this._reqUrl = url;
        return open.apply(this, arguments);
    };
    XHR.send = function () {
        this.addEventListener('load', function () {
            if (this._reqUrl && this._reqUrl.includes('graphql')) {
                try {
                    this.responseText.split('\\n').forEach(chunk => {
                        try {
                            const json = JSON.parse(chunk);
                            const str = JSON.stringify(json);
                            if (str.includes('thread_items') || str.includes('text_post_app_info')) {
                                window.rawThreadsData.push(json);
                            }
                        } catch (e) {}
                    });
                } catch (e) {}
            }
        });
        return send.apply(this, arguments);
    };

    window.isScraping = false;
    
    window.autoScrape = async function (maxScrolls = 30) {
        window.isScraping = true;
        console.log(\`🤖 Bắt đầu auto-scroll (tối đa \${maxScrolls} nhịp). Sẽ tự dừng khi đủ 25 bài...\`);
        for (let i = 0; i < maxScrolls; i++) {
            if (!window.isScraping) {
                console.log("🛑 Đã nhận lệnh dừng khẩn cấp!");
                break;
            }
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 2000));
            
            // Đếm số bài viết duy nhất hiện tại
            let tempIds = [];
            function countUnique(n) {
                if (Array.isArray(n)) { n.forEach(countUnique); return; }
                if (n && typeof n === 'object') {
                    if (n.post && n.post.user) tempIds.push(n.post.id || n.post.pk);
                    Object.values(n).forEach(countUnique);
                }
            }
            countUnique(window.rawThreadsData);
            const uniqueCount = new Set(tempIds).size;
            
            console.log(\`Đã cuộn \${i + 1}/\${maxScrolls} ... Tìm thấy \${uniqueCount}/25 bài\`);
            
            if (uniqueCount >= 25) {
                console.log("%c🎯 Đã đạt ngưỡng 25 bài! Đang tự động lưu file...", "color: #fbc531");
                break;
            }
        }
        window.isScraping = false;
        window.downloadCleanData();
    };

    window.stopScrape = function() {
        window.isScraping = false;
        console.log("🛑 Đang dừng cuộn và xuất dữ liệu...");
    };

    window.downloadCleanData = function () {
        if (!window.rawThreadsData.length) { console.warn("Chưa có data!"); return; }
        const cleanData = [];
        function extractFullData(node) {
            if (Array.isArray(node)) { node.forEach(extractFullData); return; }
            if (node && typeof node === 'object') {
                if (node.post && node.post.user) {
                    const post = node.post, mediaList = [];
                    const extractMedia = m => {
                        if (m.image_versions2?.candidates?.length) mediaList.push({ type: 'image', url: m.image_versions2.candidates[0].url });
                        if (m.video_versions?.length) mediaList.push({ type: 'video', url: m.video_versions[0].url });
                    };
                    post.carousel_media ? post.carousel_media.forEach(extractMedia) : extractMedia(post);
                    cleanData.push({ post_id: post.id || post.pk, timestamp: post.taken_at, post_url: post.code ? \`https://www.threads.net/@\${post.user.username}/post/\${post.code}\` : null, author: { username: post.user.username, full_name: post.user.full_name }, content: { text: post.caption?.text || "", media: mediaList }, stats: { likes: post.like_count || 0, replies: post.text_post_app_info?.direct_reply_count || 0 } });
                }
                Object.values(node).forEach(extractFullData);
            }
        }
        extractFullData(window.rawThreadsData);
        // Lấy đúng 25 bài duy nhất
        const unique = Array.from(new Map(cleanData.map(i => [i.post_id, i])).values()).slice(0, 25);
        
        const blob = new Blob([JSON.stringify(unique, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = \`threads_data_\${Date.now()}.json\`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        console.log(\`✅ Đã xuất \${unique.length} bài thành công!\`);
    };
    console.log("✅ Hook xong! Gõ: autoScrape() để bắt đầu.");
})();`;

const STEPS = [
  { icon: "1", title: "Mở Threads trên Chrome", desc: "Vào trang profile cần crawl. Đăng nhập bằng tài khoản bình thường." },
  { icon: "2", title: "Mở DevTools Console", desc: "Nhấn F12 (Windows) hoặc Cmd+Option+J (Mac) → chọn tab Console. (Lưu ý: Nếu trình duyệt cảnh báo, hãy gõ 'allow pasting' rồi Enter để cho phép dán code)." },
  { icon: "3", title: "Paste script & chạy", desc: "Copy script bên dưới → paste vào Console → Enter. Rồi gõ: autoScrape() và Enter." },
  { icon: "4", title: "Đợi cuộn tự động", desc: "Bot sẽ tự cuộn và tìm bài. Khi đủ 25 bài, file JSON sẽ tự tải về máy." },
  { icon: "5", title: "Upload file JSON lên đây", desc: "Kéo thả file JSON vừa tải về vào vùng bên dưới để hệ thống xử lý." },
];

interface CrawlPost {
  post_id: string;
  timestamp: number;
  post_url: string | null;
  author: { username: string; full_name: string };
  content: { text: string; media: { type: string; url: string }[] };
  stats: { likes: number; replies: number };
}

interface ProcessedPost {
  id: string;
  post_id: string;
  text_content: string;
  image_file_ids: string[];
  image_urls: string[];
  posted: boolean;
  created_at: string;
}

export default function CrawlPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tier, setTier] = useState<string>("free");
  const [credits, setCredits] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processLog, setProcessLog] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<ProcessedPost[]>([]);
  const [activeTab, setActiveTab] = useState<"guide" | "data">("guide");
  const fileRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      
      // Tạm thời Hardcode tài khoản thành ProMax cho sếp test
      setTier("promax"); 
      setCredits(10000);

      loadSavedPosts(data.user.id);
    });
  }, []);

  async function loadSavedPosts(uid: string) {
    const { data } = await supabase.from("crawl_data")
      .select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
    if (data) setSavedPosts(data);
  }

  function addLog(msg: string) {
    setProcessLog(prev => [...prev, `[${new Date().toLocaleTimeString("vi-VN")}] ${msg}`]);
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 100);
  }

  function copyScript() {
    navigator.clipboard.writeText(CRAWL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleJsonFile(file: File) {
    if (!userId) return;
    if (!file.name.endsWith(".json")) { addLog("❌ Chỉ chấp nhận file .json"); return; }

    setProcessing(true);
    setActiveTab("data");
    addLog(`📂 Đang đọc file: ${file.name}`);

    try {
      const text = await file.text();
      const posts: CrawlPost[] = JSON.parse(text);
      addLog(`✅ Đọc được ${posts.length} bài viết từ file`);

      let saved = 0;
      let creditUsed = 0;

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        addLog(`⏳ Xử lý bài ${i + 1}/${posts.length} (ID: ${post.post_id})`);

        const hasMedia = post.content.media && post.content.media.length > 0;
        const creditCost = hasMedia ? 2 : 1;

        // Kiểm tra credit
        if (credits - creditUsed < creditCost) {
          addLog(`🚫 Hết credit! Cần ${creditCost} credit, còn ${credits - creditUsed}`);
          break;
        }

        // Lưu vào Supabase (ảnh sẽ được upload Telegram qua server action)
        const { error } = await supabase.from("crawl_data").upsert({
          user_id: userId,
          post_id: post.post_id,
          source_url: post.post_url,
          text_content: post.content.text,
          image_urls: post.content.media?.map(m => m.url) || [],
          image_file_ids: [], // Sẽ được điền khi GitHub Actions xử lý upload Telegram
          posted: false,
        }, { onConflict: "user_id,post_id" } as any);

        if (!error) {
          saved++;
          creditUsed += creditCost;
          addLog(`✅ Đã lưu bài: ${post.author?.username} — "${post.content.text?.substring(0, 40)}..."`);
        }
      }

      // Trừ credit qua API
      if (creditUsed > 0) {
        await fetch("/api/credits/deduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: creditUsed, type: "crawl", description: `Crawl ${saved} bài từ ${file.name}` }),
        });
        setCredits(prev => prev - creditUsed);
      }

      addLog(`🎉 Hoàn tất! Đã lưu ${saved} bài. Tiêu ${creditUsed} credits.`);
      await loadSavedPosts(userId);
    } catch (err: any) {
      addLog(`❌ Lỗi: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleJsonFile(file);
  }

  const canUseCrawl = ["plus", "pro", "promax"].includes(tier);

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-5">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white font-mono">Crawl Data</h1>
            <p className="text-zinc-500 text-sm font-mono mt-1">Thu thập bài viết Threads → lưu vào kho để đăng tự động</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm text-white font-bold">{credits.toLocaleString()}</span>
              <span className="text-zinc-500 text-xs font-mono">credits</span>
            </div>
            {!canUseCrawl && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-mono">Cần gói Plus+</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-1 w-fit">
          {(["guide", "data"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-mono text-sm font-medium transition-all
                ${activeTab === tab ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              {tab === "guide" ? <BookOpen className="w-4 h-4" /> : <FileJson className="w-4 h-4" />}
              {tab === "guide" ? "Hướng dẫn & Script" : `Kho data (${savedPosts.length})`}
            </button>
          ))}
        </div>

        {activeTab === "guide" && (
          <div className="grid grid-cols-2 gap-5">
            {/* Left: Steps */}
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest">Các bước thực hiện</p>
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-sm font-bold text-zinc-300">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{step.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Cloud Scraper + Manual Upload */}
            <div className="space-y-4">
              
              {/* Cloud Scraper Zone */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-5 h-5 text-purple-400" />
                  <h3 className="font-mono text-sm text-white font-bold">Auto Cloud Scraper (Mới)</h3>
                </div>
                <p className="text-zinc-500 text-xs font-mono mb-4">
                  Nhập link Profile Threads. Hệ thống sẽ tự động mượn Server Cloud để cào bài cho bạn. (Không cần mở máy)
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="VD: https://www.threads.net/@zuck" 
                    id="cloudTargetUrl"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white font-mono placeholder:text-zinc-700 outline-none focus:border-purple-500/50"
                  />
                  <button 
                    onClick={async () => {
                      const url = (document.getElementById('cloudTargetUrl') as HTMLInputElement).value;
                      if (!url || !url.includes('threads.net')) {
                        addLog("❌ Link không hợp lệ!");
                        return;
                      }
                      addLog(`🚀 Đang gửi lệnh Cloud Scraper cho: ${url}`);
                      try {
                        const res = await fetch("/api/trigger-bot", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: "admin@autofarm.com", botType: "threads_scraper", target_url: url })
                        });
                        if (res.ok) addLog("✅ Đã gửi lệnh thành công! Đợi 1-2 phút hệ thống sẽ tự lưu Data.");
                        else addLog("❌ Lỗi kích hoạt Bot Cloud!");
                      } catch (e) {
                        addLog("❌ Lỗi kết nối API!");
                      }
                    }}
                    disabled={!canUseCrawl}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all
                      ${canUseCrawl ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30" : "bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed"}`}
                  >
                    Bắt Đầu Cào
                  </button>
                </div>
              </div>

              {/* Script box */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm text-zinc-300">crawl_threads.js (Manual)</span>
                  </div>
                  <button onClick={copyScript} disabled={!canUseCrawl}
                    className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all
                      ${canUseCrawl
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed"}`}>
                    {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Đã copy!" : "Copy Script"}
                  </button>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto">
                  {canUseCrawl ? (
                    <pre className="text-[10px] font-mono text-emerald-300/70 whitespace-pre-wrap leading-relaxed">
                      {CRAWL_SCRIPT.substring(0, 400)}...
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm font-mono">Nâng cấp lên gói Plus để nhận script</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => canUseCrawl && fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                  ${isDragging ? "border-emerald-500/60 bg-emerald-500/5" : "border-zinc-700 hover:border-zinc-600"}
                  ${!canUseCrawl ? "opacity-40 cursor-not-allowed" : ""}`}>
                {processing ? (
                  <Loader2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                )}
                <p className="text-white text-sm font-mono font-semibold">
                  {processing ? "Đang xử lý..." : "Kéo thả file JSON vào đây"}
                </p>
                <p className="text-zinc-600 text-xs font-mono mt-1">
                  hoặc click để chọn file • 1 credit/bài text • 2 credits/bài có ảnh
                </p>
                <input ref={fileRef} type="file" accept=".json" className="hidden"
                  onChange={e => e.target.files?.[0] && handleJsonFile(e.target.files[0])} />
              </div>

              {/* Process log */}
              {processLog.length > 0 && (
                <div ref={logRef} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-h-40 overflow-y-auto">
                  {processLog.map((log, i) => (
                    <p key={i} className="font-mono text-[11px] text-zinc-400 leading-relaxed">{log}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-3">
            {savedPosts.length === 0 ? (
              <div className="text-center py-20 text-zinc-600 font-mono">
                <FileJson className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có data nào. Upload file JSON để bắt đầu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {savedPosts.map(post => (
                  <div key={post.id}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-start gap-4 hover:border-zinc-700 transition-all">
                    {/* Media thumbnail */}
                    {post.image_urls?.length > 0 ? (
                      <div className="w-16 h-16 shrink-0 rounded-xl bg-zinc-800 overflow-hidden border border-zinc-700">
                        <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover"
                          onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <FileJson className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 text-sm leading-relaxed line-clamp-2">
                        {post.text_content || "(Bài không có text)"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-zinc-600 font-mono">
                          <ImageIcon className="w-3 h-3" />
                          {post.image_urls?.length || 0} ảnh
                          {post.image_file_ids?.length > 0 && (
                            <span className="text-emerald-500/60"> • {post.image_file_ids.length} đã upload Tele</span>
                          )}
                        </span>
                        <span className="text-xs text-zinc-700 font-mono">
                          {new Date(post.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    {/* Status + action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase
                        ${post.posted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
                        {post.posted ? "Đã đăng" : "Chưa đăng"}
                      </span>
                      {!post.posted && (
                        <button className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-mono px-3 py-1.5 rounded-lg transition-all">
                          <Send className="w-3 h-3" />
                          Đăng bài
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
