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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fingerprint: string | undefined = body?.fingerprint;
    const clientIP = getClientIP(req);

    // --- Kiểm tra IP ---
    if (clientIP && clientIP !== 'unknown' && clientIP !== '127.0.0.1' && clientIP !== '::1') {
      const { count: ipCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('last_login_ip', clientIP);
        
      if ((ipCount || 0) >= MAX_ACCOUNTS_PER_SIGNAL) {
        return NextResponse.json(
          {
            error: `Mạng Internet của bạn đã có ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản. Mỗi mạng chỉ được tạo tối đa ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản.`,
            code: 'IP_LIMIT_EXCEEDED',
          },
          { status: 403 }
        );
      }
    }

    // --- Kiểm tra Device Fingerprint ---
    if (fingerprint) {
      const { count: fpCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('device_fingerprint', fingerprint);
        
      if ((fpCount || 0) >= MAX_ACCOUNTS_PER_SIGNAL) {
        return NextResponse.json(
          {
            error: `Thiết bị của bạn đã tạo ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản khác. Mỗi thiết bị chỉ được tạo tối đa ${MAX_ACCOUNTS_PER_SIGNAL} tài khoản.`,
            code: 'FINGERPRINT_LIMIT_EXCEEDED',
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[precheck-ip] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
