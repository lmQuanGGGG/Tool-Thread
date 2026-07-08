"use client";

import { useEffect, useState, type ElementType } from "react";
import { Activity, Check, Crown, Loader2, Rocket, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "../../utils/supabase";

type TierKey = "free" | "lite" | "plus" | "pro" | "promax";

type Tier = {
  key: TierKey;
  name: string;
  price: number;
  icon: ElementType;
  tone: string;
  badge?: string;
  quota: {
    reels: string;
    threads: string;
    fbPost: string;
    links: string;
  };
  perks: string[];
};

const TIERS: Tier[] = [
  {
    key: "free",
    name: "Free",
    price: 0,
    icon: Activity,
    tone: "zinc",
    quota: { reels: "1", threads: "10", fbPost: "0", links: "1" },
    perks: ["Chạy thủ công", "Dùng thử luồng bot", "Phù hợp test nhanh"],
  },
  {
    key: "lite",
    name: "Lite",
    price: 59000,
    icon: Zap,
    tone: "emerald",
    quota: { reels: "2", threads: "30", fbPost: "1", links: "3" },
    perks: ["Thông báo Telegram", "Lưu nhiều link hơn", "Dành cho shop nhỏ"],
  },
  {
    key: "plus",
    name: "Plus",
    price: 179000,
    icon: Zap,
    tone: "blue",
    badge: "Phổ biến",
    quota: { reels: "4", threads: "80", fbPost: "2", links: "10" },
    perks: ["Chạy tự động", "Tăng giới hạn mỗi ngày", "Đủ dùng bán hàng đều"],
  },
  {
    key: "pro",
    name: "Pro",
    price: 399000,
    icon: Crown,
    tone: "amber",
    badge: "Đề xuất",
    quota: { reels: "6", threads: "150", fbPost: "5", links: "20" },
    perks: ["Chạy tự động", "Hỗ trợ ưu tiên", "Tối ưu cho vận hành thật"],
  },
  {
    key: "promax",
    name: "ProMax",
    price: 699000,
    icon: Rocket,
    tone: "violet",
    badge: "Max",
    quota: { reels: "∞", threads: "∞", fbPost: "∞", links: "∞" },
    perks: ["Không giới hạn", "Ưu tiên VIP", "Dành cho team scale"],
  },
];

const TONE_CLASS: Record<string, { soft: string; icon: string; border: string; button: string; highlight: string }> = {
  zinc: {
    soft: "bg-zinc-50 text-zinc-600",
    icon: "bg-zinc-100 text-zinc-600",
    border: "border-zinc-200",
    button: "bg-zinc-900 text-white hover:bg-zinc-800",
    highlight: "bg-zinc-50",
  },
  emerald: {
    soft: "bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-200",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    highlight: "bg-emerald-50",
  },
  blue: {
    soft: "bg-blue-50 text-blue-700",
    icon: "bg-blue-50 text-blue-600",
    border: "border-blue-200",
    button: "bg-blue-600 text-white hover:bg-blue-700",
    highlight: "bg-blue-50",
  },
  amber: {
    soft: "bg-amber-50 text-amber-700",
    icon: "bg-amber-50 text-amber-600",
    border: "border-amber-200",
    button: "bg-amber-500 text-white hover:bg-amber-600",
    highlight: "bg-amber-50",
  },
  violet: {
    soft: "bg-violet-50 text-violet-700",
    icon: "bg-violet-50 text-violet-600",
    border: "border-violet-300",
    button: "bg-violet-600 text-white hover:bg-violet-700",
    highlight: "bg-violet-50",
  },
};

function formatPrice(price: number) {
  return price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")}đ`;
}

export default function PricingPage() {
  const [currentTier, setCurrentTier] = useState<TierKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }

      supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setCurrentTier((data?.tier as TierKey) || "free");
          setLoading(false);
        });
    });
  }, []);

  return (
    <div className="h-full overflow-hidden p-4 md:p-6 xl:p-8">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 px-5 py-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.45)] md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Pricing</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Chọn gói vận hành</h2>
            <p className="mt-1 text-sm text-zinc-500">So sánh nhanh giới hạn bot, nâng cấp khi cần scale.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-2 text-center">
            {[
              ["Reels", "ngày"],
              ["Threads", "comment"],
              ["FB Post", "ngày"],
              ["Links", "lưu"],
            ].map(([label, unit]) => (
              <div key={label} className="min-w-[74px] rounded-lg bg-white px-3 py-2 shadow-sm">
                <div className="text-[11px] font-semibold text-zinc-900">{label}</div>
                <div className="text-[10px] text-zinc-400">{unit}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-5">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const tone = TONE_CLASS[tier.tone];
            const isCurrent = currentTier === tier.key;

            return (
              <div
                key={tier.key}
                className={`relative flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_18px_50px_-38px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-36px_rgba(15,23,42,0.55)] ${isCurrent ? "border-zinc-900 ring-2 ring-zinc-900/10" : tone.border}`}
              >
                {tier.badge && (
                  <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone.soft}`}>
                    {tier.badge}
                  </div>
                )}

                <div className={`border-b border-zinc-100 p-4 ${tone.highlight}`}>
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-950">{tier.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tight text-zinc-950">{formatPrice(tier.price)}</span>
                    {tier.price > 0 && <span className="text-xs font-medium text-zinc-400">/tháng</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3">
                  {[
                    ["Reels", tier.quota.reels],
                    ["Threads", tier.quota.threads],
                    ["FB Post", tier.quota.fbPost],
                    ["Links", tier.quota.links],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                      <div className="text-[10px] font-medium text-zinc-400">{label}</div>
                      <div className="mt-0.5 text-lg font-bold leading-none text-zinc-950">{value}</div>
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
                    <button className={`btn-shimmer h-10 w-full rounded-xl text-[12px] font-bold transition-colors ${tone.button}`}>
                      {tier.price === 0 ? "Dùng miễn phí" : "Nâng cấp"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-between rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-3 text-xs text-zinc-500">
          <span>Thanh toán qua PayOS. Hỗ trợ ATM, VISA, MoMo và ZaloPay.</span>
          <span className="font-medium text-zinc-700">Có thể đổi gói bất kỳ lúc nào.</span>
        </div>
      </div>
    </div>
  );
}
