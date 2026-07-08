import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role bypasses RLS — chỉ gọi từ server, không bao giờ lộ ra client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = 'lmquang.devops@gmail.com';

export async function GET(req: NextRequest) {
  // Xác thực: chỉ admin mới được gọi endpoint này
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Lấy toàn bộ data bằng service role (bypass RLS)
  const [ordersRes, profilesRes] = await Promise.all([
    supabaseAdmin.from('payment_orders').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('profiles').select('id, email, tier, created_at'),
  ]);

  return NextResponse.json({
    orders: ordersRes.data || [],
    profiles: profilesRes.data || [],
  });
}
