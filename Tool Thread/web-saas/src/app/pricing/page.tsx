"use client";

import { useState, useEffect } from "react";
import { Check, Crown, Zap, Activity, Rocket, Loader2 } from "lucide-react";
import { supabase } from "../../utils/supabase";

const TIERS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    icon: Activity,
    color: "border-zinc-200",
    headerBg: "bg-zinc-50",
    badge: null,
    features: [
      "1 video Reels / ngày",
      "10 Comment Threads / ngày",
      "1 link Affiliate",
      "Chạy thủ công (bấm tay)",
    ],
    missing: ["FB Post", "Chạy tự động", "Thông báo Telegram", "Hỗ trợ ưu tiên"],
  },
  {
    key: "lite",
    name: "Lite",
    price: 59000,
    icon: Zap,
    color: "border-emerald-200",
    headerBg: "bg-emerald-50",
    badge: null,
    features: [
      "2 video Reels / ngày",
      "30 Comment Threads / ngày",
      "1 FB Post / ngày",
      "3 link Affiliate",
      "Thông báo Telegram",
    ],
    missing: ["Chạy tự động", "Hỗ trợ ưu tiên"],
  },
  {
    key: "plus",
    name: "Plus",
    price: 179000,
    icon: Zap,
    color: "border-blue-300",
    headerBg: "bg-blue-50",
    badge: "Phổ biến",
    features: [
      "4 video Reels / ngày",
      "80 Comment Threads / ngày",
      "2 FB Post / ngày",
      "10 link Affiliate",
      "✅ Chạy tự động hàng ngày",
      "Thông báo Telegram",
    ],
    missing: ["Hỗ trợ ưu tiên"],
  },
  {
    key: "pro",
    name: "Pro",
    price: 399000,
    icon: Crown,
    color: "border-amber-300",
    headerBg: "bg-amber-50",
    badge: "Đề xuất",
    features: [
      "6 video Reels / ngày",
      "150 Comment Threads / ngày",
      "5 FB Post / ngày",
      "20 link Affiliate",
      "✅ Chạy tự động hàng ngày",
      "Thông báo Telegram",
      "Hỗ trợ ưu tiên",
    ],
    missing: [],
  },
  {
    key: "promax",
    name: "ProMax",
    price: 699000,
    icon: Rocket,
    color: "border-violet-400",
    headerBg: "bg-gradient-to-br from-violet-600 to-pink-500",
    badge: "Không giới hạn",
    features: [
      "Không giới hạn Reels",
      "Không giới hạn Comment",
      "Không giới hạn FB Post",
      "Không giới hạn Link",
      "✅ Chạy tự động hàng ngày",
      "Thông báo Telegram",
      "Hỗ trợ ưu tiên VIP",
    ],
    missing: [],
  },
];

export default function PricingPage() {
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase.from("profiles").select("tier").eq("id", user.id).single()
        .then(({ data }) => { setCurrentTier(data?.tier || "free"); setLoading(false); });
    });
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 xl:p-12 xl:pt-16">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4">
          Chọn gói phù hợp
        </h2>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">
          Từ tài khoản thử nghiệm đến cỗ máy kiếm tiền không giới hạn. Nâng cấp bất kỳ lúc nào.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isCurrent = currentTier === tier.key;
          const isProMax = tier.key === "promax";

          return (
            <div
              key={tier.key}
              className={`relative rounded-3xl border-2 overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${tier.color} ${isCurrent ? "ring-2 ring-offset-2 ring-zinc-900" : ""}`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${isProMax ? "bg-white/20 text-white" : "bg-zinc-900 text-white"}`}>
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div className={`p-6 ${tier.headerBg}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${isProMax ? "bg-white/20" : "bg-white shadow-sm"}`}>
                  <Icon className={`w-5 h-5 ${isProMax ? "text-white" : "text-zinc-800"}`} />
                </div>
                <h3 className={`font-black text-xl mb-1 ${isProMax ? "text-white" : "text-zinc-900"}`}>{tier.name}</h3>
                <div className={`text-3xl font-black ${isProMax ? "text-white" : "text-zinc-900"}`}>
                  {tier.price === 0 ? "Miễn phí" : `${tier.price.toLocaleString("vi-VN")}đ`}
                  {tier.price > 0 && <span className={`text-sm font-normal ml-1 ${isProMax ? "text-white/70" : "text-zinc-400"}`}>/tháng</span>}
                </div>
              </div>

              {/* Features */}
              <div className="p-5 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{f}</span>
                  </div>
                ))}
                {tier.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm opacity-40">
                    <span className="w-4 h-4 shrink-0 mt-0.5 text-center">✕</span>
                    <span className="text-zinc-500 line-through">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="p-5 pt-0">
                {isCurrent ? (
                  <div className="w-full text-center py-3 rounded-full bg-zinc-900 text-white text-sm font-bold">
                    ✓ Gói hiện tại
                  </div>
                ) : loading ? (
                  <div className="w-full flex justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                ) : (
                  <button className={`w-full py-3 rounded-full text-sm font-bold transition-all ${isProMax ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}>
                    {tier.price === 0 ? "Bắt đầu miễn phí" : "Nâng cấp ngay"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-center text-zinc-400 text-sm mt-8">
        Thanh toán qua <strong>PayOS</strong> (ATM, VISA, MoMo, ZaloPay). Hủy bất kỳ lúc nào.
      </p>
    </div>
    </div>
  );
}
