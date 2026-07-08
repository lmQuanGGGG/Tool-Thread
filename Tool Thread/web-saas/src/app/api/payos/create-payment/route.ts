import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { payos } from "@/utils/payos";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { tier, price_vnd } = await req.json();

    // Lấy user từ Authorization header
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!tier || !price_vnd) {
      return NextResponse.json({ error: "Missing tier or price" }, { status: 400 });
    }

    // Tạo orderCode (số nguyên ngẫu nhiên nhỏ hơn 9007199254740991)
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

    // Lưu order vào DB (pending)
    const { error: dbError } = await supabaseAdmin
      .from('payment_orders')
      .insert([
        {
          order_code: orderCode,
          user_id: user.id,
          tier: tier,
          amount: price_vnd,
          status: 'PENDING'
        }
      ]);

    if (dbError) {
      console.error("Lỗi lưu payment_orders:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const domain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

    const body = {
      orderCode: orderCode,
      amount: price_vnd,
      description: `Nâng cấp gói ${tier.toUpperCase()}`,
      items: [
        {
          name: `Gói ${tier.toUpperCase()}`,
          quantity: 1,
          price: price_vnd
        }
      ],
      returnUrl: `${domain}/dashboard?payment=success`,
      cancelUrl: `${domain}/pricing?payment=cancel`
    };

    const paymentLinkRes = await payos.createPaymentLink(body);

    return NextResponse.json({ checkoutUrl: paymentLinkRes.checkoutUrl });

  } catch (error: any) {
    console.error("PayOS Create Payment Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo link thanh toán" }, { status: 500 });
  }
}
