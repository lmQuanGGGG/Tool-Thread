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
    
    // Cloudflare Edge workers can fetch up to 50MB into an ArrayBuffer
    // This video is a short loop, so buffering it is safe and ensures iOS playback
    const videoRes = await fetch(downloadUrl);
    
    if (!videoRes.ok) {
      return NextResponse.json({ error: 'Failed to download from Telegram' }, { status: 500 });
    }

    const buffer = await videoRes.arrayBuffer();
    const fileSize = buffer.byteLength;
    
    const rangeHeader = request.headers.get('range');
    
    const responseHeaders = new Headers();
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Content-Type', 'video/mp4');
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] && parts[1] !== "" ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      responseHeaders.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      responseHeaders.set('Content-Length', chunksize.toString());
      
      return new Response(buffer.slice(start, end + 1), {
        status: 206,
        headers: responseHeaders,
      });
    }

    responseHeaders.set('Content-Length', fileSize.toString());
    
    return new Response(buffer, {
      status: 200,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
