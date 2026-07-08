"use client";

import { useEffect, useState, type ElementType } from "react";
import { X, Activity, Check, Crown, Loader2, Rocket, Zap } from "lucide-react";
import { supabase } from "../utils/supabase";

type TierKey = "free" | "lite" | "plus" | "pro" | "promax";

const TIERS = [
  {
    key: "free" as TierKey,
    name: "Free",
    price: 0,
    icon: Activity,
    tone: "zinc",
    quota: { reels: "2", fbPost: "1", threads: "10", crawl: "1", links: "2" },
    perks: ["Auto Cmt Threads (10/10)", "Auto hết 2 Reels, 1 FB, 10 Threads", "Chia 2 khung giờ chạy", "Phù hợp test nhanh"],
  },
  {
    key: "lite" as TierKey,
    name: "Lite",
    price: 59000,
    icon: Zap,
    tone: "emerald",
    quota: { reels: "3", fbPost: "3", threads: "30", crawl: "2", links: "4" },
    perks: ["Auto Cmt Threads (20/30)", "Auto hết 3 Reels, 3 FB, 30 Threads", "Chia 3 khung giờ chạy", "Dành cho shop nhỏ"],
  },
  {
    key: "plus" as TierKey,
    name: "Plus",
    price: 129000,
    icon: Zap,
    tone: "blue",
    badge: "Phổ biến",
    quota: { reels: "6", fbPost: "5", threads: "80", crawl: "3", links: "10" },
    perks: ["Auto Cmt Threads (80 cmt)", "Auto 6 Reels, 5 FB Posts", "Auto Cào Shopee (3 Lượt)", "Đủ dùng bán hàng đều"],
  },
  {
    key: "pro" as TierKey,
    name: "Pro",
    price: 199000,
    icon: Crown,
    tone: "amber",
    badge: "Đề xuất",
    quota: { reels: "12", fbPost: "10", threads: "160", crawl: "4", links: "20" },
    perks: ["Auto Cmt Threads (160 cmt)", "Auto 12 Reels, 10 FB Posts", "Auto Cào Shopee (4 Lượt)", "Tối ưu cho vận hành thật"],
  },
  {
    key: "promax" as TierKey,
    name: "ProMax",
    price: 499000,
    icon: Rocket,
    tone: "violet",
    badge: "Max",
    quota: { reels: "∞", fbPost: "∞", threads: "∞", crawl: "∞", links: "∞" },
    perks: ["Không giới hạn", "Cào bài, up bài thủ công", "Ưu tiên VIP Support", "Dành cho team scale"],
  },
];

const TONE_CLASS: Record<string, { soft: string; icon: string; border: string; button: string; highlight: string }> = {
  zinc:    { soft: "bg-zinc-50 text-zinc-600",      icon: "bg-zinc-100 text-zinc-600",    border: "border-zinc-200",   button: "bg-zinc-900 text-white hover:bg-zinc-800",      highlight: "bg-zinc-50" },
  emerald: { soft: "bg-emerald-50 text-emerald-700", icon: "bg-emerald-50 text-emerald-600", border: "border-emerald-200", button: "bg-emerald-600 text-white hover:bg-emerald-700", highlight: "bg-emerald-50" },
  blue:    { soft: "bg-blue-50 text-blue-700",       icon: "bg-blue-50 text-blue-600",    border: "border-blue-200",   button: "bg-blue-600 text-white hover:bg-blue-700",      highlight: "bg-blue-50" },
  amber:   { soft: "bg-amber-50 text-amber-700",     icon: "bg-amber-50 text-amber-600",  border: "border-amber-200",  button: "bg-amber-500 text-white hover:bg-amber-600",    highlight: "bg-amber-50" },
  violet:  { soft: "bg-violet-50 text-violet-700",   icon: "bg-violet-50 text-violet-600", border: "border-violet-300", button: "bg-violet-600 text-white hover:bg-violet-700",  highlight: "bg-violet-50" },
};

function formatPrice(price: number) {
  return price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")}đ`;
}

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

  // Đóng modal khi ấn Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const visibleTiers = TIERS.filter(t => t.key !== "promax" || currentTier === "promax");

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal container */}
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#F7F7F8] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.4)]"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#F7F7F8]/90 px-6 pt-6 pb-4 backdrop-blur-sm border-b border-zinc-200/60">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Chọn gói vận hành</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Nâng cấp bất cứ lúc nào · Thanh toán qua PayOS</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        {/* Cards */}
        <div className="p-6">
          <div className={`grid grid-cols-1 gap-4 ${visibleTiers.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
            {visibleTiers.map((tier) => {
              const Icon = tier.icon;
              const tone = TONE_CLASS[tier.tone];
              const isCurrent = currentTier === tier.key;

              return (
                <div
                  key={tier.key}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_18px_50px_-38px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-36px_rgba(15,23,42,0.55)] ${isCurrent ? "border-zinc-900 ring-2 ring-zinc-900/10" : tone.border}`}
                >
                  {(tier as any).badge && (
                    <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone.soft}`}>
                      {(tier as any).badge}
                    </div>
                  )}

                  <div className={`border-b border-zinc-100 p-4 ${tone.highlight}`}>
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-950">{tier.name}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black tracking-tight text-zinc-950">{formatPrice(tier.price)}</span>
                      {tier.price > 0 && <span className="text-xs font-medium text-zinc-400">{tier.key === "promax" ? "/vĩnh viễn" : "/tháng"}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3">
                    {[
                      ["Reels", tier.quota.reels],
                      ["FB Post", tier.quota.fbPost],
                      ["Threads Cmt", tier.quota.threads],
                      ["Cào Shopee", tier.quota.crawl],
                      ["Affiliate Link", tier.quota.links],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-1.5">
                        <div className="text-[11px] font-medium text-zinc-500">{label}</div>
                        <div className="text-[13px] font-bold text-zinc-950">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 space-y-2 px-4 pb-3">
                    {tier.perks.map((perk) => (
                      <div key={perk} className="flex items-center gap-2 text-[12px] text-zinc-600">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span className="truncate">{perk}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-zinc-100 p-3">
                    {isCurrent ? (
                      <div className="flex h-10 items-center justify-center rounded-xl bg-zinc-900 text-[12px] font-bold text-white">
                        Gói hiện tại
                      </div>
                    ) : loading ? (
                      <div className="flex h-10 items-center justify-center rounded-xl border border-zinc-100">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
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
                        className={`btn-shimmer h-10 w-full rounded-xl text-[12px] font-bold transition-colors ${tone.button}`}
                      >
                        {tier.price === 0 ? "Dùng miễn phí" : "Nâng cấp"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
