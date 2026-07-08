const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { fetchBotConfig, logToWeb } = require('../supabase_helper');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const TELE_BOT_TOKEN = process.env.TELE_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Nếu dùng chung config thì TELE_CHAT_ID lấy từ .env hoặc lấy từ profile của user
const USER_EMAIL = process.env.USER_EMAIL || 'admin@autofarm.com';

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getShopeeOGData(shortUrl) {
    try {
        console.log(`\n⏳ Đang cào link: ${shortUrl}`);
        // Tuyệt chiêu MMO: Giả dạng Facebook Bot
        const response = await axios.get(shortUrl, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
            },
            timeout: 10000
        });
        const html = response.data;
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        let imageMatch = html.match(/<meta property="og:square_image" content="(.*?)"/i) || html.match(/<meta property="og:image" content="(.*?)"/i);
        
        if (titleMatch && imageMatch) {
            let title = titleMatch[1].replace(' | Shopee Việt Nam', '').trim();
            return { title, imageUrl: imageMatch[1] };
        }
    } catch (e) {
        console.error("Lỗi cào data Shopee:", e.message);
    }
    return null;
}

async function uploadToTelegram(imageUrl, chatId) {
    const tempFile = path.join(__dirname, `temp_shopee_${Date.now()}.png`);
    try {
        // Tải ảnh bằng curl để vượt anti-bot
        execSync(`curl -s -o "${tempFile}" "${imageUrl}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://shopee.vn/"`);
        if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size < 100) return null;
        
        const form = new FormData();
        if (!chatId) chatId = process.env.TELE_CHAT_ID || '-5396355060';
        form.append('chat_id', chatId);
        form.append('photo', fs.createReadStream(tempFile));
        
        const teleRes = await axios.post(`https://api.telegram.org/bot${TELE_BOT_TOKEN}/sendPhoto`, form, {
            headers: form.getHeaders()
        });
        
        fs.unlinkSync(tempFile);
        
        // Trả về file_id lớn nhất (chất lượng tốt nhất)
        const photoArr = teleRes.data.result.photo;
        return photoArr[photoArr.length - 1].file_id;
    } catch(e) {
        if(fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        console.error("Lỗi upload Telegram:", e.message);
        return null;
    }
}

async function generateComment(title) {
    if (!GEMINI_API_KEY) {
        const catchphrases = ["Mấy bà ơi gom lẹ deal này nha:", "Ai chưa thử cái này thì thử liền đi:", "Eo ôi ưng cái bụng ghê:"];
        return `${catchphrases[Math.floor(Math.random() * catchphrases.length)]}`;
    }
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Bạn là một KOL review sản phẩm Shopee trên Mạng xã hội Threads. Hãy viết ĐÚNG 1 CÂU thả thính cực kỳ tự nhiên, ngắn gọn (dưới 15 chữ) để mời mọi người mua sản phẩm này. KHÔNG dùng icon, KHÔNG in đậm, KHÔNG ngoặc kép, KHÔNG giải thích. Tên sản phẩm: ${title}`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch(e) {
        return "Góc rắc thính: Món này dạo này tui mê cực kì:";
    }
}

(async () => {
    const msgInit = `🚀 Khởi động Trình phân tích Link Affiliate cho: ${USER_EMAIL}`;
    console.log(msgInit);
    await logToWeb(USER_EMAIL, 'parse_links', msgInit, 'info');

    const dbConfig = await fetchBotConfig();
    if (!dbConfig) return;

    let rawLinks = dbConfig.affiliate_links_arr || [];
    let parsedLinks = dbConfig.parsed_affiliate_links || []; // Array object

    let isModified = false;
    let newParsed = [];

    for (let link of rawLinks) {
        link = link.trim();
        if (!link) continue;
        
        // Kiểm tra xem đã parse chưa
        const existing = parsedLinks.find(p => p.aff_link === link);
        if (existing && existing.title && existing.tele_file_id) {
            newParsed.push(existing);
            continue;
        }

        const shopeeData = await getShopeeOGData(link);
        if (shopeeData) {
            console.log(`✅ Lấy thành công: ${shopeeData.title}`);
            const storageChat = process.env.TELE_STORAGE_CHAT || '-5396355060';
            const file_id = await uploadToTelegram(shopeeData.imageUrl, storageChat);
            if (file_id) {
                console.log(`☁️ Đã lưu S3 Telegram File ID: ${file_id}`);
                const comment = await generateComment(shopeeData.title);
                const msgAI = `🤖 AI Comment: ${comment}`;
                console.log(msgAI);
                await logToWeb(USER_EMAIL, 'parse_links', msgAI, 'success');
                
                newParsed.push({
                    aff_link: link,
                    title: shopeeData.title,
                    image_url: shopeeData.imageUrl,
                    tele_file_id: file_id,
                    suggested_comment: comment
                });
                isModified = true;
            }
        }
        await delay(1000); // Tránh rate limit
    }

    if (isModified) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await supabase.from('profiles').update({ parsed_affiliate_links: newParsed }).eq('email', USER_EMAIL);
        if (error) {
            const errLog = `❌ Lỗi lưu DB: ${error.message}`;
            console.error(errLog);
            await logToWeb(USER_EMAIL, 'parse_links', errLog, 'error');
        } else {
            const succLog = "✅ Đã lưu dữ liệu Parse thành công vào Supabase!";
            console.log(succLog);
            await logToWeb(USER_EMAIL, 'parse_links', succLog, 'success');
        }
    } else {
        const noNewLog = "✅ Không có link mới nào cần cào.";
        console.log(noNewLog);
        await logToWeb(USER_EMAIL, 'parse_links', noNewLog, 'info');
    }
    process.exit(0);
})();
