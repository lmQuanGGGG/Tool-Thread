require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Cấu hình Bot & Group
const token = process.env.TELE_BOT_TOKEN || '8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc';
const chatId = -5396355060;
const bot = new TelegramBot(token, { polling: true });

// ==========================================
// KÍCH HOẠT PM2 LOCAL
// ==========================================
function triggerLocalPM2(processName, chatId, displayName) {
    bot.sendMessage(chatId, `⏳ Đang ra lệnh cho máy Mac khởi động tiến trình: ${displayName}...`);
    
    // Tạo cờ để báo hiệu cho bot biết là chạy bằng tay (bỏ qua bước ngâm nick)
    fs.writeFileSync(path.resolve(__dirname, `${processName}.manual`), 'true');
    
    exec(`pm2 start ecosystem.config.js --only ${processName}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            bot.sendMessage(chatId, `✗ Gửi lệnh thất bại: ${error.message}`);
            return;
        }
        bot.sendMessage(chatId, `✓ Đã đánh thức **${displayName}** thành công trên máy Mac! 🚀`, { parse_mode: 'Markdown' });
    });
}

// ==========================================
// MENU & GIAO DIỆN NÚT BẤM
// ==========================================
const menuOptions = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '📊 Xem trạng thái Kho Bài', callback_data: 'cmd_status' }],
            [
                { text: '👗 Post Thời Trang', callback_data: 'cmd_post_1' },
                { text: '🔥 Post Drama', callback_data: 'cmd_post_2' },
                { text: '📸 Post Drama IG', callback_data: 'cmd_post_3' }
            ],
            [
                { text: '🎬 Up FB Reels', callback_data: 'cmd_post_reels' },
                { text: '📚 Up FB Story', callback_data: 'cmd_post_story' }
            ],
            [
                { text: '💬 Đi Comment Dạo FB', callback_data: 'cmd_post_cmt' },
                { text: '🛒 Cào Data Shopee', callback_data: 'cmd_scrape' }
            ],
            [
                { text: '💬 Cmt Dạo Threads 1', callback_data: 'cmd_cmt_th_1' },
                { text: '💬 Cmt Dạo Threads 2', callback_data: 'cmd_cmt_th_2' }
            ]
        ]
    }
};

function sendStatusReport(chatId) {
    const data_quanao = fs.existsSync('data_ready_to_post.json') ? JSON.parse(fs.readFileSync('data_ready_to_post.json', 'utf8')).length : 0;
    const data_drama = fs.existsSync('drama_ready_to_post.json') ? JSON.parse(fs.readFileSync('drama_ready_to_post.json', 'utf8')).length : 0;
    const data_ig = fs.existsSync('ig_ready_to_post.json') ? JSON.parse(fs.readFileSync('ig_ready_to_post.json', 'utf8')).length : 0;
    
    const statusMsg = `📊 **BÁO CÁO KHO BÀI VIẾT**\n\n👗 Ngách Uyên (Thời trang): **${data_quanao} bài**\n🔥 Ngách Drama: **${data_drama} bài**\n📸 Ngách Drama IG: **${data_ig} bài**\n\n*(Hệ thống đang chạy ngầm trực tiếp trên máy Mac của sếp)*`;
    bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
}

// Lắng nghe lệnh gọi menu
bot.onText(/\/start|\/menu/, (msg) => {
    if (msg.chat.id !== chatId && msg.chat.id.toString() !== chatId.toString()) return;
    bot.sendMessage(chatId, "🤖 **BẢNG ĐIỀU KHIỂN AUTO-POST PM2**\n\nSếp chọn chức năng ở các nút bên dưới nhé:", {
        parse_mode: 'Markdown',
        ...menuOptions
    });
});

// Lắng nghe sự kiện bấm nút (Callback Query)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Phản hồi cho Tele biết đã nhận lệnh (tắt hiệu ứng loading ở nút)
    bot.answerCallbackQuery(query.id);

    if (data === 'cmd_status') {
        sendStatusReport(chatId);
    } else if (data === 'cmd_post_1') {
        triggerLocalPM2('thread-quanao-farmer', chatId, 'Threads Thời Trang');
    } else if (data === 'cmd_post_2') {
        triggerLocalPM2('thread-drama-farmer', chatId, 'Threads Drama');
    } else if (data === 'cmd_post_3') {
        triggerLocalPM2('thread-drama-ig-farmer', chatId, 'Threads Drama IG');
    } else if (data === 'cmd_post_reels') {
        triggerLocalPM2('fb-reels-farmer', chatId, 'FB Reels Bot');
    } else if (data === 'cmd_post_story') {
        triggerLocalPM2('fb-story-farmer', chatId, 'FB Story Bot');
    } else if (data === 'cmd_post_cmt') {
        triggerLocalPM2('fb-puppeteer-farmer', chatId, 'FB Comment Bot');
    } else if (data === 'cmd_scrape') {
        triggerLocalPM2('shopee-scraper-farmer', chatId, 'Shopee Scraper');
    } else if (data === 'cmd_cmt_th_1') {
        triggerLocalPM2('th-cmt-farmer-1', chatId, 'Threads Comment (Nick 1)');
    } else if (data === 'cmd_cmt_th_2') {
        triggerLocalPM2('th-cmt-farmer-2', chatId, 'Threads Comment (Nick 2)');
    }
});

// Vẫn giữ lệnh gõ text đề phòng sếp thích gõ nhanh
bot.onText(/\/status/, (msg) => {
    if (msg.chat.id !== chatId && msg.chat.id.toString() !== chatId.toString()) return;
    sendStatusReport(chatId);
});

console.log("🤖 Control Panel Bot (PM2 Local) đang chạy túc trực 24/7...");
bot.sendMessage(chatId, "🤖 **Control Panel Bot Đã Trở Lại (PM2 Mode)!**\n\nSếp có thể gõ lệnh `/menu` để mở bảng điều khiển nút bấm nha!", { parse_mode: 'Markdown' });
