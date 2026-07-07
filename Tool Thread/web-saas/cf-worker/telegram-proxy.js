/**
 * Cloudflare Worker: Telegram Image Proxy
 * 
 * Deploy lên Cloudflare Workers để làm proxy ảnh từ Telegram.
 * Không lộ BOT_TOKEN cho client.
 * 
 * URL public: https://tg-img.YOUR_SUBDOMAIN.workers.dev/?file_id=XXXXX
 * 
 * Env vars cần set trong Cloudflare Dashboard:
 *   BOT_TOKEN = token bot Telegram dùng để lưu ảnh
 */

export default {
  async fetch(request, env) {
    // CORS cho Next.js app
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const fileId = url.searchParams.get('file_id');

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'Missing file_id param' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!env.BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'BOT_TOKEN not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      // Bước 1: Lấy file_path từ Telegram API
      const getFileRes = await fetch(
        `https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${fileId}`
      );
      const getFileData = await getFileRes.json();

      if (!getFileData.ok || !getFileData.result?.file_path) {
        return new Response(JSON.stringify({ error: 'File not found on Telegram' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Bước 2: Stream file về client (không download xuống Worker)
      const filePath = getFileData.result.file_path;
      const fileRes = await fetch(
        `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${filePath}`
      );

      if (!fileRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch file from Telegram' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Detect content type từ extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      const contentTypeMap = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg',
        png: 'image/png', gif: 'image/gif',
        webp: 'image/webp', mp4: 'video/mp4',
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      return new Response(fileRes.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          // Cache 24h tại browser + Cloudflare Edge
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          ...corsHeaders,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
