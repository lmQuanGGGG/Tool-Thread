import { NextRequest, NextResponse } from "next/server";
import { payos } from "@/utils/payos";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { orderCode } = await req.json();

    if (!orderCode) {
      return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
    }

    // 1. Kiểm tra đơn hàng trên PayOS
    const paymentInfo = await payos.paymentRequests.get(Number(orderCode));
    
    if (!paymentInfo || paymentInfo.status !== 'PAID') {
      return NextResponse.json({ error: "Payment not completed or not found" }, { status: 400 });
    }

    // 2. Kiểm tra trong DB xem đã xử lý chưa
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('order_code', orderCode)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found in DB" }, { status: 404 });
    }

    if (order.status === 'PAID') {
      // Đã xử lý rồi, trả về success
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // 3. Nếu chưa xử lý, tiến hành cập nhật Tier và Status (giống hệt webhook)
    await supabaseAdmin
      .from('payment_orders')
      .update({ status: 'PAID' })
      .eq('order_code', orderCode);

    await supabaseAdmin
      .from('profiles')
      .update({ tier: order.tier })
      .eq('id', order.user_id);

    // Ghi Audit Log vào credit_transactions
    await supabaseAdmin
      .from('credit_transactions')
      .insert([{
        user_id: order.user_id,
        amount: order.amount,
        type: 'topup',
        description: `Nâng cấp gói ${order.tier.toUpperCase()} qua PayOS (Manual Sync)`,
        ref_id: paymentInfo.id
      }]);

    console.log(`✅ Verify API: Đã nâng cấp ${order.user_id} lên gói ${order.tier}`);
    
    return NextResponse.json({ success: true, message: "Payment verified and tier updated" });
    
  } catch (error: any) {
    console.error("PayOS Verify Payment Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi xác thực thanh toán" }, { status: 500 });
  }
}
