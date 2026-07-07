import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { amount, type, description } = await req.json();

    // Lấy user từ Authorization header
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Gọi function adjust_credits() đã tạo trong migration (atomic, chống race condition)
    const { data, error } = await supabaseAdmin.rpc("adjust_credits", {
      p_user_id: user.id,
      p_amount: -(Math.abs(amount)),  // Luôn trừ (âm)
      p_type: type || "crawl",
      p_description: description || "Crawl data",
    });

    if (error) {
      // Lỗi "Insufficient credits" từ PostgreSQL function
      if (error.message.includes("Insufficient credits")) {
        return NextResponse.json({ error: "Không đủ credits" }, { status: 402 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, credits_remaining: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
