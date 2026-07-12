import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

const ALLOWED_KEYS = new Set(["crawls_count"]);

function vietnamDate() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, amount = 1 } = await request.json();
  if (!ALLOWED_KEYS.has(key) || !Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ error: "Invalid usage increment" }, { status: 400 });
  }

  const date = vietnamDate();
  const { data: current, error: readError } = await admin
    .from("usage_stats")
    .select(key)
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const nextValue = (current?.[key] || 0) + amount;
  const { error: writeError } = current
    ? await admin.from("usage_stats").update({ [key]: nextValue }).eq("user_id", user.id).eq("date", date)
    : await admin.from("usage_stats").insert({ user_id: user.id, date, [key]: amount });
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 });

  return NextResponse.json({ success: true, key, value: nextValue });
}
