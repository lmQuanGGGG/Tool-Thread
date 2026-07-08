"use client";

import { useEffect, useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { supabase } from "../utils/supabase";

type TierKey = "free" | "lite" | "plus" | "pro";

const TIERS = [
  {
    key: "free" as TierKey,
    tag: "Dùng thử", tagColor: "text-blue-500 bg-blue-50/50",
    name: "Free", priceStr: "0đ / tháng", price: 0,
    desc: "Trải nghiệm sức mạnh của AutoFarm mà không cần thanh toán.",
    btn1Class: "bg-[#161618] text-white hover:bg-black",
    perks: ["2 Reels, 1 FB Post, 2 Threads", "10 Cmt Threads", "1 Crawl Data", "Chia 2 khung giờ chạy"],
  },
  {
    key: "lite" as TierKey,
    tag: "Shop nhỏ", tagColor: "text-blue-500 bg-blue-50/50",
    name: "Lite", priceStr: "59.000đ / tháng", price: 59000,
    desc: "Gói cơ bản phù hợp cho cá nhân kinh doanh online nhỏ lẻ.",
    btn1Class: "bg-[#161618] text-white hover:bg-black",
    perks: ["3 Reels, 3 FB, 3 Threads", "30 Cmt Threads", "2 Crawl Data", "Chia 3 khung giờ chạy"],
  },
  {
    key: "plus" as TierKey,
    tag: "Phổ biến", tagColor: "text-blue-500 bg-blue-50/50",
    name: "Plus", priceStr: "129.000đ / tháng", price: 129000,
    desc: "Dành cho các shop cần duy trì nội dung tương tác đều đặn hàng ngày.",
    btn1Class: "bg-[#161618] text-white hover:bg-black",
    perks: ["6 Reels, 5 FB, 6 Threads", "80 Cmt Threads", "3 Crawl Data", "Auto max 50% comment"],
  },
  {
    key: "pro" as TierKey,
    tag: "Khuyên dùng", tagColor: "text-blue-500 bg-blue-50/50",
    name: "Pro", priceStr: "199.000đ / tháng", price: 199000,
    desc: "Tối ưu hóa khả năng tiếp cận với giới hạn cao nhất của nền tảng.",
    btn1Class: "bg-[#161618] text-white hover:bg-black",
    perks: ["12 Reels, 10 FB, 12 Threads", "160 Cmt Threads", "4 Crawl Data", "Chạy auto 24/7 liên tục", "Tối đa 10 luồng auto chạy song song"],
  },
];

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PricingModal({ open, onClose }: PricingModalProps) {
  const [currentTier, setCurrentTier] = useState<TierKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase.from("profiles").select("tier").eq("id", user.id).maybeSingle()
        .then(({ data }) => {
          setCurrentTier((data?.tier as TierKey) || "free");
          setLoading(false);
        });
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.4)]"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 px-8 pt-8 pb-6 backdrop-blur-sm border-b border-zinc-100">
          <div>
            <h2 className="text-[32px] font-bold tracking-tight text-zinc-900">Chọn gói vận hành</h2>
            <p className="text-[15px] text-zinc-500 mt-1">Nâng cấp bất cứ lúc nào · Thanh toán qua PayOS</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#f8f9fa] hover:bg-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-zinc-600" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {TIERS.map((tier) => {
              const isCurrent = currentTier === tier.key;

              return (
                <div
                  key={tier.key}
                  className={`bg-[#f8f9fa] rounded-[32px] p-8 flex flex-col h-full relative transition-all ${isCurrent ? "ring-2 ring-zinc-900 shadow-md" : ""}`}
                >
                  <div className="mb-5">
                    <span className={`inline-block px-3 py-1.5 rounded-md text-[11px] font-semibold ${tier.tagColor}`}>
                      {tier.tag}
                    </span>
                  </div>
                  
                  <h3 className="text-[22px] font-medium text-zinc-900 mb-2">{tier.name}</h3>
                  <div className="text-[14px] text-zinc-600 mb-8">{tier.priceStr}</div>
                  
                  <p className="text-[14px] text-zinc-700 leading-relaxed mb-8 min-h-[65px]">
                    {tier.desc}
                  </p>

                  <div className="flex flex-col gap-3 mb-8">
                    {isCurrent ? (
                      <div className="block w-full py-3.5 rounded-full text-[14px] font-medium text-center bg-zinc-200 text-zinc-500">
                        Gói hiện tại
                      </div>
                    ) : loading ? (
                      <div className="flex items-center justify-center w-full py-3.5 rounded-full bg-[#161618] text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (tier.price === 0) return;
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) { alert("Bạn cần đăng nhập để nâng cấp!"); return; }
                            const res = await fetch("/api/payos/create-payment", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
                              body: JSON.stringify({ tier: tier.key, price_vnd: tier.price }),
                            });
                            const data = await res.json();
                            if (data.checkoutUrl) {
                              window.location.href = data.checkoutUrl;
                            } else {
                              alert(data.error || "Lỗi tạo thanh toán");
                            }
                          } catch {
                            alert("Lỗi kết nối");
                          }
                        }}
                        className={`block w-full py-3.5 rounded-full text-[14px] font-medium text-center transition-colors ${tier.btn1Class}`}
                      >
                        {tier.price === 0 ? "Dùng miễn phí" : `Đăng ký ${tier.name}`}
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-zinc-200/70 w-full mb-6"></div>

                  <div className="text-[13px] font-medium text-zinc-900 mb-5">Gói bao gồm:</div>

                  <ul className="space-y-4 flex-1">
                    {tier.perks.map(f => (
                      <li key={f} className="flex items-start gap-3 text-[13px] text-zinc-600">
                        <Check className="w-[18px] h-[18px] text-zinc-800 flex-shrink-0" strokeWidth={1.5} />
                        <span className="leading-snug pt-[1px]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
