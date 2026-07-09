import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const MAX_ACCOUNTS_PER_SIGNAL = 2;

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

async function countOtherAccountsBy(field: 'last_login_ip' | 'device_fingerprint', value: string, excludeUserId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq(field, value)
    .neq('id', excludeUserId);
  return count ?? 0;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const fingerprint: string | undefined = body?.fingerprint;
    const clientIP = getClientIP(req);

    // Lấy dữ liệu cũ của user để so sánh thay đổi
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('last_login_ip, device_fingerprint')
      .eq('id', user.id)
      .maybeSingle();

    const updates: Record<string, string> = {};

    // --- Kiểm tra IP ---
    if (currentProfile?.last_login_ip !== clientIP) {
      const ipCount = await countOtherAccountsBy('last_login_ip', clientIP, user.id);
      if (ipCount >= MAX_ACCOUNTS_PER_SIGNAL) {
        return NextResponse.json(
          {
            error: `Mạng Internet của bạn đã có ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản. Mỗi kết nối mạng chỉ được dùng tối đa ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản.`,
            code: 'IP_LIMIT_EXCEEDED',
          },
          { status: 403 }
        );
      }
      updates.last_login_ip = clientIP;
    }

    // --- Kiểm tra Device Fingerprint ---
    if (fingerprint && currentProfile?.device_fingerprint !== fingerprint) {
      const fpCount = await countOtherAccountsBy('device_fingerprint', fingerprint, user.id);
      if (fpCount >= MAX_ACCOUNTS_PER_SIGNAL) {
        return NextResponse.json(
          {
            error: `Thiết bị của bạn đã đăng nhập vào ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản khác. Mỗi thiết bị chỉ được dùng tối đa ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản.`,
            code: 'FINGERPRINT_LIMIT_EXCEEDED',
          },
          { status: 403 }
        );
      }
      updates.device_fingerprint = fingerprint;
    }

    // Cập nhật IP và fingerprint mới nếu có thay đổi hợp lệ
    if (Object.keys(updates).length > 0) {
      await supabaseAdmin.from('profiles').update(updates).eq('id', user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[verify-ip] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
