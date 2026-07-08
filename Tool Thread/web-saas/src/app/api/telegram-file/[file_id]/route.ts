import { NextResponse } from 'next/server';

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
    
    // 3. Forward the response (headers and body)
    const responseHeaders = new Headers(videoRes.headers);
    // Important: we don't want to expose upstream caching headers sometimes, 
    // but for Telegram files it's usually fine. We explicitly set CORS if needed.
    
    return new NextResponse(videoRes.body, {
      status: videoRes.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
