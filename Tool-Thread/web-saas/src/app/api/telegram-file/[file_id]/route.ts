import { NextResponse } from 'next/server';

export const runtime = 'edge';
export async function GET(request: Request, { params }: { params: Promise<{ file_id: string }> }) {
  const { file_id } = await params;
  if (!file_id) return NextResponse.json({ error: 'Missing file_id' }, { status: 400 });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });

  try {
    // 1. Fetch file path from Telegram
    const getFileUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${file_id}`;
    const fileRes = await fetch(getFileUrl);
    const fileData = await fileRes.json();

    if (!fileData.ok) {
      return NextResponse.json({ error: fileData.description }, { status: 400 });
    }

    const filePath = fileData.result.file_path;
    
    // 2. Fetch the actual file stream
    const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    
    // Parse Range header from client if present
    const requestHeaders = new Headers();
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      requestHeaders.set('Range', rangeHeader);
    }

    const videoRes = await fetch(downloadUrl, { headers: requestHeaders });
    
    const responseHeaders = new Headers();
    const cl = videoRes.headers.get('content-length');
    if (cl) responseHeaders.set('Content-Length', cl);
    const cr = videoRes.headers.get('content-range');
    if (cr) responseHeaders.set('Content-Range', cr);
    
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Content-Type', 'video/mp4');
    
    return new Response(videoRes.body, {
      status: videoRes.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
