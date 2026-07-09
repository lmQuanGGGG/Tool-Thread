/**
 * Telegram Bot Webhook Handler on Cloudflare Workers
 */

async function triggerGithubAction(env, nickIndex, customWorkflowId = 'farm_worker.yml') {
  const ghToken = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;

  if (!ghToken || !owner || !repo) {
    throw new Error('Missing GITHUB configs in Secrets');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${customWorkflowId}/dispatches`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${ghToken}`,
      'User-Agent': 'Cloudflare-Worker'
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: { nick_index: String(nickIndex) }
    })
  });

  if (!response.ok) {
    throw new Error(`Github API Error: ${response.status} ${response.statusText}`);
  }
}

async function sendMessage(env, chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${env.TELE_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      ...options
    })
  });
}

async function answerCallbackQuery(env, callbackQueryId) {
  const url = `https://api.telegram.org/bot${env.TELE_BOT_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId
    })
  });
}

async function handleWebhook(body, env) {
  const adminChatId = env.ADMIN_CHAT_ID || "-5396355060";

  // Xử lý nút bấm (Callback Query)
  if (body.callback_query) {
    const cb = body.callback_query;
    const chatId = cb.message.chat.id;
    const data = cb.data;

    // Trả lời event loading trên điện thoại
    await answerCallbackQuery(env, cb.id);

    if (chatId.toString() !== adminChatId) {
      return new Response('OK');
    }

    if (data === 'cmd_post_1' || data === 'cmd_post_2' || data === 'cmd_post_3') {
      const nickIndex = data === 'cmd_post_1' ? '1' : (data === 'cmd_post_2' ? '2' : '3');
      const nickName = nickIndex === '1' ? '👗 Thời trang (Uyên)' : (nickIndex === '2' ? '🔥 Drama' : '📸 Drama (IG)');
      
      await sendMessage(env, chatId, `⏳ Đang ra lệnh cho Github khởi động Máy cày Nick ${nickIndex} [${nickName}]...`);
      
      try {
        await triggerGithubAction(env, nickIndex);
        await sendMessage(env, chatId, `✓ Đã đánh thức Github thành công!\nSếp có thể vào tab **Actions** trên repo Github để xem nó đang chạy trực tiếp nhé!`, { parse_mode: 'Markdown' });
      } catch (err) {
        await sendMessage(env, chatId, `✗ Gửi lệnh thất bại: ${err.message}`);
      }
    } else if (data === 'cmd_post_fb') {
      await sendMessage(env, chatId, `⏳ Đang ra lệnh cho Github khởi động Bot Rải Link Facebook...`);
      try {
        await triggerGithubAction(env, 'fb', 'fb_worker.yml');
        await sendMessage(env, chatId, `✓ Đã đánh thức Bot FB thành công trên mây!`, { parse_mode: 'Markdown' });
      } catch (err) {
        await sendMessage(env, chatId, `✗ Gửi lệnh FB thất bại: ${err.message}`);
      }
    } else if (data === 'cmd_post_reels') {
      await sendMessage(env, chatId, `⏳ Đang ra lệnh cho Github khởi động Tool: Lách YT -> FB Reels...`);
      try {
        await triggerGithubAction(env, 'reels', 'reels_worker.yml');
        await sendMessage(env, chatId, `✓ Đã đánh thức Github chạy Reels Bot thành công!\nSếp mở Github Actions ra hóng nhé!`, { parse_mode: 'Markdown' });
      } catch (err) {
        await sendMessage(env, chatId, `✗ Gửi lệnh Reels thất bại: ${err.message}`);
      }
    } else if (data === 'cmd_post_shopee') {
      await sendMessage(env, chatId, `⏳ Đang ra lệnh cho Github khởi động Tool: Đăng Shopee FB...`);
      try {
        await triggerGithubAction(env, 'shopee', 'shopee_worker.yml');
        await sendMessage(env, chatId, `✓ Đã đánh thức Github chạy Shopee Bot thành công!\nSếp mở Github Actions ra hóng nhé!`, { parse_mode: 'Markdown' });
      } catch (err) {
        await sendMessage(env, chatId, `✗ Gửi lệnh Shopee thất bại: ${err.message}`);
      }
    } else if (data === 'cmd_status') {
      await sendMessage(env, chatId, `📊 **BÁO CÁO KHO BÀI VIẾT**\n\nKho bài viết hiện đang được quản lý trên Github Repository.\n\n*(Lịch đăng tự động được quản lý trực tiếp trên Github, chạy 18:03 mỗi ngày)*`, { parse_mode: 'Markdown' });
    }
    
    return;
  }

  // Xử lý tin nhắn (Message)
  if (body.message && body.message.text) {
    const msg = body.message;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (chatId.toString() !== adminChatId) {
      return new Response('OK');
    }

    if (text === '/start' || text === '/menu') {
      const menuOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Xem trạng thái Kho Bài', callback_data: 'cmd_status' }],
            [
              { text: '👗 Post Thời Trang', callback_data: 'cmd_post_1' },
              { text: '🔥 Post Drama', callback_data: 'cmd_post_2' }
            ],
            [
              { text: '📸 Post Drama (IG)', callback_data: 'cmd_post_3' },
              { text: '📘 Rải Link FB', callback_data: 'cmd_post_fb' }
            ],
            [
              { text: '🎬 Up FB Reels', callback_data: 'cmd_post_reels' },
              { text: '🛍️ Đăng Shopee FB', callback_data: 'cmd_post_shopee' }
            ]
          ]
        },
        parse_mode: 'Markdown'
      };
      
      await sendMessage(env, chatId, "🤖 **BẢNG ĐIỀU KHIỂN AUTO-POST (Cloudflare)**\n\nSếp chọn chức năng ở các nút bên dưới nhé:", menuOptions);
    } else if (text.startsWith('/post ')) {
      const nickIndex = text.replace('/post ', '').trim();
      if (nickIndex === '1' || nickIndex === '2' || nickIndex === '3') {
        const nickName = nickIndex === '1' ? '👗 Thời trang (Uyên)' : (nickIndex === '2' ? '🔥 Drama' : '📸 Drama (IG)');
        await sendMessage(env, chatId, `⏳ Đang ra lệnh cho Github khởi động Máy cày Nick ${nickIndex} [${nickName}]...`);
        try {
          await triggerGithubAction(env, nickIndex);
          await sendMessage(env, chatId, `✓ Đã đánh thức Github thành công!`, { parse_mode: 'Markdown' });
        } catch (err) {
          await sendMessage(env, chatId, `✗ Gửi lệnh thất bại: ${err.message}`);
        }
      } else if (nickIndex === 'reels') {
        await sendMessage(env, chatId, `⏳ Đang ra lệnh cho Github khởi động Tool: Lách YT -> FB Reels...`);
        try {
          await triggerGithubAction(env, 'reels', 'reels_worker.yml');
          await sendMessage(env, chatId, `✓ Đã đánh thức Github chạy Reels Bot thành công!`, { parse_mode: 'Markdown' });
        } catch (err) {
          await sendMessage(env, chatId, `✗ Gửi lệnh Reels thất bại: ${err.message}`);
        }
      } else if (nickIndex === 'shopee') {
        await sendMessage(env, chatId, `⏳ Đang ra lệnh cho Github khởi động Tool: Đăng Shopee FB...`);
        try {
          await triggerGithubAction(env, 'shopee', 'shopee_worker.yml');
          await sendMessage(env, chatId, `✓ Đã đánh thức Github chạy Shopee Bot thành công!`, { parse_mode: 'Markdown' });
        } catch (err) {
          await sendMessage(env, chatId, `✗ Gửi lệnh Shopee thất bại: ${err.message}`);
        }
      } else {
        await sendMessage(env, chatId, "⚠️ Vui lòng gõ `/post 1`, `/post 2`, `/post 3`, `/post reels` hoặc `/post shopee`", { parse_mode: 'Markdown' });
      }
    }
  }

}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') return new Response('OK');
    
    let body;
    try {
      body = await request.json();
    } catch(e) {
      return new Response('OK');
    }
    
    // Giao việc cho mây Cloudflare chạy ngầm, không bắt Telegram chờ đợi
    // Trả lời Telegram NGAY LẬP TỨC để chặn tính năng tự động gửi lại (nguyên nhân gây đúp bài)
    ctx.waitUntil(handleWebhook(body, env));
    
    return new Response('OK');
  }
};
