import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KEYS = new Set(["reels", "fb_comment", "threads_comment", "fb_post", "threads_post"]);
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

async function currentUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
}

async function readSettings(email: string) {
  const { data, error } = await admin
    .from("bot_logs")
    .select("bot_type,message,created_at")
    .eq("email", email)
    .like("bot_type", "auto-setting:%")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const settings: Record<string, boolean> = {};
  for (const row of data || []) {
    const key = row.bot_type.replace("auto-setting:", "");
    if (KEYS.has(key) && settings[key] === undefined) settings[key] = row.message === "enabled";
  }
  return settings;
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await readSettings(user.email) });
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key, enabled } = await request.json();
  if (!KEYS.has(key) || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid auto bot setting" }, { status: 400 });
  }
  const { error } = await admin.from("bot_logs").insert({
    email: user.email,
    bot_type: `auto-setting:${key}`,
    message: enabled ? "enabled" : "disabled",
    level: "info",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: await readSettings(user.email) });
}
