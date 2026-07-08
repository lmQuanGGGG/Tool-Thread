"use client";

import { useState } from "react";
import { Upload, Terminal, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/utils/supabase";

interface ThreadsCrawlerProps {
  userId: string;
  tier: string;
  credits: number;
  onCrawlSuccess: () => void;
  pushLog: (level: "ERROR" | "INFO" | "WARN" | "SUCCESS", msg: string, tab: "global" | "fb" | "threads" | "both") => void;
  setCredits: (val: number | ((prev: number) => number)) => void;
}

export default function ThreadsCrawler({ userId, tier, credits, onCrawlSuccess, pushLog, setCredits }: ThreadsCrawlerProps) {
  const [cloudTargetUrl, setCloudTargetUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const canUseCrawl = ["plus", "pro", "promax"].includes(tier);

  const inputClass = "w-full bg-white border border-gray-200/80 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-gray-400";
  const cardClass = "bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.03)]";

  async function handleJsonFile(file: File) {
    if (!userId) return;
    if (!file.name.endsWith(".json")) { pushLog("ERROR", "Chỉ chấp nhận file .json", "global"); return; }

    setProcessing(true);
    pushLog("INFO", `Đang đọc file JSON: ${file.name}`, "global");

    try {
      const text = await file.text();
      let posts = JSON.parse(text);
      
      const TIER_LIMITS: Record<string, number> = { free: 5, lite: 12, plus: 25, pro: 59, promax: 129 };
      const maxPosts = TIER_LIMITS[tier] || 5;
      
      if (posts.length > maxPosts) {
        pushLog("WARN", `Gói ${tier.toUpperCase()} tối đa ${maxPosts} bài. Đã tự động cắt bớt ${posts.length - maxPosts} bài thừa.`, "global");
        posts = posts.slice(0, maxPosts);
      } else {
        pushLog("INFO", `Xử lý ${posts.length} bài viết từ file JSON`, "global");
      }

      let saved = 0;
      let creditUsed = 0;

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const hasMedia = post.content?.media && post.content.media.length > 0;
        const creditCost = hasMedia ? 2 : 1;

        if (credits - creditUsed < creditCost) {
          pushLog("WARN", `Hết credit! Cần ${creditCost}, còn ${credits - creditUsed}`, "global");
          break;
        }

        const { error } = await supabase.from("crawl_data").upsert({
          user_id: userId,
          post_id: post.post_id,
          source_url: post.post_url,
          text_content: post.content?.text || "",
          image_urls: post.content?.media?.map((m: any) => m.url) || [],
          image_file_ids: [],
          posted: false,
        }, { onConflict: "user_id,post_id" } as any);

        if (!error) {
          saved++;
          creditUsed += creditCost;
        }
      }

      if (creditUsed > 0) {
        await fetch("/api/credits/deduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: creditUsed, type: "crawl", description: `Crawl ${saved} bài từ ${file.name}` }),
        });
        setCredits((prev: number) => prev - creditUsed);
      }

      pushLog("SUCCESS", `Hoàn tất! Đã lưu ${saved} bài. Tiêu ${creditUsed} credits. Vui lòng sang tab Threads để kiểm tra.`, "global");
      onCrawlSuccess();
    } catch (err: any) {
      pushLog("ERROR", `Lỗi xử lý JSON: ${err.message}`, "global");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={`${cardClass} p-6 anim-fade-up anim-d1`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-gray-900">Threads Auto Crawler</h3>
        {!canUseCrawl && (
          <span className="px-2 py-1 rounded-md bg-amber-50 text-[10px] font-mono text-amber-600 border border-amber-100">Yêu cầu Plus+</span>
        )}
      </div>
      
      {/* Cloud Scraper Zone */}
      <div className="mb-5">
        <p className="text-[12px] text-gray-500 mb-2">1. Cloud Scraper: Tự động mượn Server lấy bài (Không cần treo máy).</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Link Profile (VD: https://www.threads.net/@zuck)" 
            value={cloudTargetUrl}
            onChange={e => setCloudTargetUrl(e.target.value)}
            disabled={!canUseCrawl}
            className={`${inputClass} flex-1`}
          />
          <button 
            onClick={async () => {
              if (!cloudTargetUrl) return;
              pushLog("INFO", `Đang gửi lệnh Cloud Scraper cho: ${cloudTargetUrl}`, "global");
              try {
                const { data: userData } = await supabase.auth.getUser();
                const res = await fetch("/api/trigger-bot", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: userData.user?.email || "admin@autofarm.com", botType: "threads_scraper", target_url: cloudTargetUrl })
                });
                if (res.ok) pushLog("SUCCESS", "Đã gửi lệnh thành công! Hệ thống sẽ cào ngầm.", "global");
                else pushLog("ERROR", "Lỗi kích hoạt Bot Cloud!", "global");
              } catch (e) {
                pushLog("ERROR", "Lỗi kết nối API!", "global");
              }
            }}
            disabled={!canUseCrawl || !cloudTargetUrl}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm
              ${canUseCrawl && cloudTargetUrl ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            Bắt Đầu Cào
          </button>
        </div>
      </div>

      {/* Manual Dropzone */}
      <div>
        <p className="text-[12px] text-gray-500 mb-2">2. Hoặc upload file JSON thủ công (dành cho Script lấy tay).</p>
        <div 
          onDragOver={e => { e.preventDefault(); if(canUseCrawl) setIsDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
          onDrop={e => {
            e.preventDefault();
            setIsDragging(false);
            if (canUseCrawl && e.dataTransfer.files[0]) handleJsonFile(e.dataTransfer.files[0]);
          }}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${!canUseCrawl ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : isDragging ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
        >
          {processing ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-2">
              <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
              <p className="text-sm font-medium text-sky-600 font-mono">Đang xử lý dữ liệu...</p>
            </div>
          ) : (
            <>
              <input type="file" accept=".json" onChange={e => { if(canUseCrawl && e.target.files?.[0]) handleJsonFile(e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={!canUseCrawl} />
              <Upload className={`w-6 h-6 mx-auto mb-2 ${isDragging ? 'text-sky-500' : 'text-gray-400'}`} />
              <p className="text-[12px] font-semibold text-gray-700">Kéo thả file JSON vào đây</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
