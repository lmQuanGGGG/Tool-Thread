import { NextRequest, NextResponse } from "next/server";
import { payos } from "@/utils/payos";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature (async in v2)
    const webhookData = await payos.webhooks.verify(body);

    if (webhookData.code === "00") {
      const orderCode = webhookData.orderCode;

      // 1. Lấy order từ DB
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('payment_orders')
        .select('*')
        .eq('order_code', orderCode)
        .single();

      if (orderErr || !order) {
        console.error("Webhook: Không tìm thấy order_code:", orderCode);
        return NextResponse.json({ success: true }); // Vẫn trả về 200 để PayOS không gửi lại
      }

      if (order.status === 'PAID') {
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // 2. Cập nhật trạng thái Order
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: 'PAID' })
        .eq('order_code', orderCode);

      // 3. Cập nhật Tier cho User (Không bị block bởi RLS vì dùng service_role)
      await supabaseAdmin
        .from('profiles')
        .update({ tier: order.tier })
        .eq('id', order.user_id);

      // 4. Ghi Audit Log vào credit_transactions
      await supabaseAdmin
        .from('credit_transactions')
        .insert([{
          user_id: order.user_id,
          amount: order.amount,
          type: 'topup',
          description: `Nâng cấp gói ${order.tier.toUpperCase()} qua PayOS`,
          ref_id: null // có thể lưu ID giao dịch của PayOS nếu cần
        }]);

      console.log(`✓ Webhook: Đã nâng cấp ${order.user_id} lên gói ${order.tier}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayOS Webhook Error:", error.message);
    return NextResponse.json({ error: "Lỗi webhook" }, { status: 400 });
  }
}
