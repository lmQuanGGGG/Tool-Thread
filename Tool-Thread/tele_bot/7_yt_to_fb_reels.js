const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
require('dotenv').config();

// TÍCH HỢP ĐƯỜNG ỐNG SUPABASE
const { fetchBotConfig, updateUsageStats, logToWeb, checkQuota, sendTelegramMessage } = require('./supabase_helper');

puppeteer.use(StealthPlugin());

const OUTPUT_DIR = path.resolve(__dirname, 'reels_videos');
const HISTORY_FILE = path.resolve(__dirname, 'reels_history.json');

const localYtDlp = path.resolve(__dirname, 'bin', 'yt-dlp');
// Ép dùng yt-dlp của hệ thống (bản mới nhất) thay vì bản cũ trong thư mục bin
const YTDLP_CMD = "yt-dlp";

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let postedIds = [];
if (fs.existsSync(HISTORY_FILE)) {
    try {
        postedIds = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) { }
}

async function fetchLatestVideos(channels) {
    let allVideos = [];
    for (let channel of channels) {
        console.log("🔍 Đang quét danh sách Videos từ:", channel);
        try {
            if (channel.includes('tiktok.com')) {
                const usernameMatch = channel.match(/@([\w.-]+)/);
                if (usernameMatch && usernameMatch[1]) {
                    const username = usernameMatch[1];
                    const res = await axios.get(`https://www.tikwm.com/api/user/posts?unique_id=${username}&count=50`);
                    if (res.data && res.data.data && res.data.data.videos) {
                        for (let vid of res.data.data.videos) {
                            allVideos.push({
                                id: vid.video_id,
                                title: vid.title,
                                url: `https://www.tiktok.com/@${username}/video/${vid.video_id}`,
                                playUrl: vid.play,
                                isTikTok: true
                            });
                        }
                    }
                }
            } else {
                const cmd = `${YTDLP_CMD} --flat-playlist --dump-json --playlist-end 50 --extractor-args "youtube:player_client=android" "${channel}"`;
                const output = execSync(cmd, { encoding: 'utf8' });

                const lines = output.trim().split('\n');
                for (let line of lines) {
                    if (!line) continue;
                    try {
                        let info = JSON.parse(line);
                        if (info.id) {
                            allVideos.push({
                                id: info.id,
                                title: info.title,
                                url: info.url || info.webpage_url || channel,
                                isTikTok: false
                            });
                        }
                    } catch (e) { }
                }
            }
        } catch (err) {
            console.error("✗ Lỗi quét kênh:", err.message);
        }
    }
    return allVideos;
}

(async () => {
    const clickButtonWithText = async (page, texts, retries = 30) => {
        let clicked = false;
        for (let i = 0; i < retries; i++) {
            clicked = await page.evaluate((texts) => {
                const btns = Array.from(document.querySelectorAll('div[role="button"], span[role="button"], button'));
                const targetBtn = btns.find(b => {
                    const text = (b.innerText || '').trim().toLowerCase();
                    const disabled = b.getAttribute('aria-disabled') === 'true' || b.disabled;
                    if (disabled) return false;

                    // So khớp chính xác hoặc chỉ flexible với chữ 'tiếp tục' / 'continue'
                    return texts.some(t => {
                        if (text === t) return true;
                        if ((t === 'tiếp tục' || t === 'continue') && text.startsWith(t)) return true;
                        return false;
                    });
                });
                if (targetBtn) {
                    targetBtn.click();
                    return true;
                }
                return false;
            }, texts);
            if (clicked) break;
            await delay(3000);
        }
        return clicked;
    };

    let dbConfig = null;
    const email = process.env.USER_EMAIL || 'admin@autofarm.com';

    try {
        dbConfig = await fetchBotConfig(email);
    } catch (e) { }

    // Kiểm tra Quota trước khi chạy
    const hasQuota = await checkQuota(email, 'reels_posted');
    if (!hasQuota) {
        console.log(`✗ Tài khoản ${email} đã hết giới hạn đăng Reels hôm nay. Dừng script.`);
        await logToWeb(email, 'yt-reels', `Đã hết giới hạn đăng Reels hôm nay. Dừng script.`, 'warn');
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Up Reels]</b>\nTừ chối chạy do đã hết giới hạn đăng Reels hôm nay.\nTài khoản: ${email}`);
        }
        process.exit(0);
    }

    // Đọc danh sách kênh từ DB, nếu không có thì fallback mặc định
    let channels = [];
    if (dbConfig?.target_channels) {
        channels = dbConfig.target_channels.split('\n').map(c => c.trim()).filter(Boolean);
    }
    if (channels.length === 0) {
        channels = [
            "https://www.youtube.com/@RvPhim1Phut/shorts",
            "https://www.youtube.com/@CutReviewPhim/shorts"
        ];
    }

    const isPromax = dbConfig?.tier === 'promax';
    await logToWeb(email, 'yt-reels', `Khởi động tool FB Reels... Channels: ${channels.length}`, 'info');

    const pm2ProcessName = 'fb-reels-farmer';
    const manualFlagPath = path.resolve(__dirname, `${pm2ProcessName}.manual`);
    const isGithubAction = process.env.GITHUB_ACTIONS === 'true';

    if (fs.existsSync(manualFlagPath) || isPromax || isGithubAction) {
        let msg = isGithubAction ? '⚡ Lệnh chạy tay từ Web' : (fs.existsSync(manualFlagPath) ? '⚡ Lệnh chạy tay' : '💎 Đặc quyền Promax');
        console.log(`${msg}! Bỏ qua bước ngâm nick...`);
        await logToWeb(email, 'yt-reels', `${msg}! Bỏ qua bước ngâm nick...`, 'info');
        if (fs.existsSync(manualFlagPath)) fs.unlinkSync(manualFlagPath);
    } else {
        const randomMinutes = Math.floor(Math.random() * 25) + 1;
        console.log(`⏱ HỆ THỐNG BOT TỰ ĐỘNG: Đang ngâm nick (delay ngẫu nhiên) ${randomMinutes} phút trước khi bắt đầu...`);
        await delay(randomMinutes * 60 * 1000); // Đổi ra mili-giây
    }

    console.log("🚀 KHỞI ĐỘNG TOOL: QUÉT VIDEO SANG FB REELS...");

    // 1. Lấy danh sách video
    const videos = await fetchLatestVideos(channels);

    // Lọc ra tất cả các video chưa từng tải
    const unpostedVideos = videos.filter(vid => !postedIds.includes(vid.id));

    if (unpostedVideos.length === 0) {
        console.log("🤷‍♂️ Toàn bộ video trong tệp quét đã được đăng. Dừng hệ thống.");
        process.exit(0);
    }

    // Chọn NGẪU NHIÊN 1 video trong danh sách CHƯA TỪNG ĐĂNG
    const videoToProcess = unpostedVideos[Math.floor(Math.random() * unpostedVideos.length)];

    // 2. Tải video chất lượng cao nhất (Best Quality)
    console.log(`\n⬇️ Đang tải video: ${videoToProcess.title}`);
    await logToWeb(email, 'yt-reels', `Đã tìm thấy video mới: ${videoToProcess.title}. Đang tải...`, 'info');
    const outputPath = path.join(OUTPUT_DIR, `${videoToProcess.id}.mp4`);

    try {
        const videoUrl = videoToProcess.url.includes('/video/') ? videoToProcess.url : (videoToProcess.isTikTok ? `https://www.tiktok.com/@user/video/${videoToProcess.id}` : `https://www.youtube.com/watch?v=${videoToProcess.id}`);

        console.log(`\n➡️ Gọi API gendownload.com để lấy link 1080p cho video: ${videoUrl}`);
        await logToWeb(email, 'yt-reels', `Đang gọi API GenDownload lấy video 1080p cho đa nền tảng...`, 'info');
        const apiCmd = `curl -s -X POST https://gendownload.com/api/extract -H "Content-Type: application/json" -d '{"url":"${videoUrl}"}'`;
        const apiResponse = execSync(apiCmd, { encoding: 'utf-8' });
        const jsonResp = JSON.parse(apiResponse);

        if (!jsonResp.formats || jsonResp.formats.length === 0) {
            throw new Error("API gendownload không trả về formats nào.");
        }

        // Ưu tiên lấy format video có độ phân giải cao nhất (1080p, 720p, ...)
        let bestFormat = jsonResp.formats.find(f => f.label === '1080p' && f.type === 'video');
        if (!bestFormat) bestFormat = jsonResp.formats.find(f => f.label === '720p' && f.type === 'video');
        if (!bestFormat) bestFormat = jsonResp.formats.find(f => f.type === 'video');

        if (!bestFormat) {
            throw new Error("Không tìm thấy format video hợp lệ từ API.");
        }

        console.log(`➡️ Tìm thấy chất lượng ${bestFormat.label}, đang tải xuống...`);

        const axios = require('axios');
        const response = await axios({
            url: bestFormat.url,
            method: 'GET',
            responseType: 'stream',
            timeout: 300000 // 5 minutes timeout
        });

        const totalLength = parseInt(response.headers['content-length'], 10);
        let downloadedLength = 0;
        let lastReportedProgress = 0; // For percentage
        let lastReportedMB = 0; // For MB if no totalLength

        const writer = fs.createWriteStream(outputPath);
        response.data.on('data', (chunk) => {
            downloadedLength += chunk.length;
            if (totalLength) {
                const percent = Math.floor((downloadedLength / totalLength) * 100);
                if (percent >= lastReportedProgress + 10) {
                    console.log(`⏳ Đang tải: ${percent}%...`);
                    lastReportedProgress = percent;
                }
            } else {
                const downloadedMB = Math.floor(downloadedLength / (1024 * 1024));
                if (downloadedMB >= lastReportedMB + 5) { // Report every 5MB
                    console.log(`⏳ Đang tải... (đã tải được ${downloadedMB} MB)`);
                    lastReportedMB = downloadedMB;
                }
            }
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        console.log(`✓ Tải video ${bestFormat.label} hoàn tất!`);
    } catch (err) {
        console.error("✗ Lỗi tải video:", err.message);
        process.exit(1);
    }

    if (!fs.existsSync(outputPath)) {
        console.error("✗ File không tồn tại sau khi tải.");
        process.exit(1);
    }
    console.log("✓ Tải video thành công!");
    await logToWeb(email, 'yt-reels', `Tải video 1080p hoàn tất! Đang kết nối Facebook để đăng...`, 'info');

    // Bỏ qua FFMPEG theo yêu cầu của sếp, giữ nguyên video gốc để chất lượng cao nhất và up nhanh hơn.

    // 3. Đăng lên Facebook Reels
    // Lấy cookie
    let cookies = dbConfig?.fb_cookie_reels_arr || dbConfig?.fb_cookies_arr || [];

    if ((!cookies || cookies.length === 0) && process.env.FB_COOKIE) {
        try {
            cookies = JSON.parse(process.env.FB_COOKIE);
            console.log("!!! Lấy FB_COOKIE từ biến môi trường (.env) do Supabase không có.");
        } catch (e) {
            console.error("✗ Lỗi parse FB_COOKIE từ .env:", e.message);
        }
    }

    if (!cookies || cookies.length === 0) {
        console.error("✗ Lỗi: Chưa có FB Cookie! Hãy nhập cookie trên trang Bots & Config hoặc set biến môi trường FB_COOKIE.");
        process.exit(1);
    }
    console.log(`🍪 Đã load ${cookies.length} cookies cho Facebook.`);

    const browser = await puppeteer.launch({
        headless: false, // Hiển thị màn hình cho Sếp xem
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-notifications',
            '--window-size=1280,800'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log("🌐 Truy cập trang Facebook (Giao diện Máy Tính)...");
    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });
    await page.setCookie(...cookies);

    console.log("🌐 Đang truy cập Trang Chủ Facebook (để nhận diện Cookie)...");
    await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });

    // === THÊM HÀNH VI NGƯỜI THẬT ===
    console.log("🎭 Đang giả lập hành vi người dùng (scroll, lướt feed)...");
    for (let i = 0; i < 3; i++) {
        await page.mouse.wheel({ deltaY: 300 + Math.random() * 500 });
        await delay(2000 + Math.random() * 3000);

        // Rê chuột ngẫu nhiên
        const rx = 100 + Math.random() * 600;
        const ry = 100 + Math.random() * 600;
        await page.mouse.move(rx, ry, { steps: 10 });
    }
    // Cuộn lên lại đầu trang
    await page.mouse.wheel({ deltaY: -2000 });
    await delay(2000);
    // === END HÀNH VI ===

    console.log("🔄 Kiểm tra màn hình xác nhận đăng nhập (Continue as)...");
    for (let i = 0; i < 5; i++) {
        try {
            const clicked = await page.evaluate(() => {
                const btnTexts = ['tiếp tục', 'continue', 'ok', 'chấp nhận', 'accept', 'bỏ qua', 'skip', 'không, cảm ơn', 'no thanks', 'đăng nhập', 'log in', 'allow', 'cho phép'];
                const elements = [...document.querySelectorAll('div[role="button"], button, a, span[dir="auto"]')];
                for (let el of elements) {
                    const text = (el.innerText || '').toLowerCase().trim();
                    if (text && btnTexts.some(t => text.includes(t) || text.startsWith(t))) {
                        el.click();
                        if (el.closest('div[role="button"]')) el.closest('div[role="button"]').click();
                        return true;
                    }
                }
                return false;
            });
            if (clicked) {
                console.log("🔄 Phát hiện màn hình xác nhận, đã bấm Tiếp tục...");
                await delay(3000);
                break;
            }
        } catch (e) { }
        await delay(2000);
    }

    console.log("🌐 Đi đến trang tạo Reels...");
    await page.goto('https://www.facebook.com/reels/create', { waitUntil: 'networkidle2' });
    await delay(5000);

    try {
        console.log("⬆️ Đang tải video lên...");
        await logToWeb(email, 'yt-reels', `Đang upload video lên Facebook Reels...`, 'info');

        let fileInput = await page.$('input[type="file"]');
        if (!fileInput) {
            const currentUrl = page.url();
            console.error("✗ Không tìm thấy input up video. URL hiện tại:", currentUrl);

            await page.screenshot({ path: 'error_fb_reels.png' });
            console.log("📸 Đang upload ảnh chụp màn hình lỗi lên mạng...");
            try {
                const uploadRes = execSync('curl -s -F "file=@error_fb_reels.png" https://bashupload.com', { encoding: 'utf8' });
                console.log("👉 Xem ảnh lỗi tại đây:");
                console.log(uploadRes);
            } catch (e) {
                console.log("Upload ảnh lỗi thất bại:", e.message);
            }

            throw new Error("Không tìm thấy input up video. Có thể bị FB văng ra login hoặc đổi giao diện.");
        }

        await fileInput.uploadFile(outputPath);
        console.log("⏳ Chờ FB upload và xử lý video (15s)...");
        await delay(15000);



        // BƯỚC 1: Bấm Tiếp Lần 1 (Tạo thước phim -> Chỉnh sửa thước phim)
        console.log("➡️ Bấm nút Tiếp (Lần 1)...");
        const next1 = await clickButtonWithText(page, ['tiếp', 'next']);
        if (!next1) {
            console.log("!!! Không bấm được nút Tiếp 1. Dừng tiến trình!");
            throw new Error("Không thể click nút Tiếp Lần 1");
        }
        await delay(5000);

        // BƯỚC 2: Bấm Tiếp Lần 2 (Chỉnh sửa thước phim -> Tuỳ chọn đăng)
        console.log("➡️ Bấm nút Tiếp (Lần 2)...");
        const next2 = await clickButtonWithText(page, ['tiếp', 'next']);
        if (!next2) console.log("!!! Không bấm được nút Tiếp 2.");
        await delay(5000);

        // Gắn Link Affiliate (nếu có)
        const fs = require('fs');
        // Lấy affiliate link từ Supabase trước, fallback data_products.json, rồi env
        let affLink = null;
        try {
            // Ưu tiên link từ Supabase (user đã nhập trên web)
            const supabaseLinks = dbConfig?.affiliate_links_arr || [];
            if (supabaseLinks.length > 0) {
                affLink = supabaseLinks[Math.floor(Math.random() * supabaseLinks.length)];
                console.log("🔗 Lấy affiliate link từ Supabase:", affLink);
            } else {
                // Fallback: đọc từ file JSON local
                const products = JSON.parse(fs.readFileSync('./data_products.json', 'utf8'));
                if (products && products.length > 0) {
                    affLink = products[Math.floor(Math.random() * products.length)].link;
                    console.log("🎲 Lấy link từ data_products.json:", affLink);
                }
            }
        } catch (e) {
            affLink = process.env.SHOPEE_AFF_LINK || null;
            if (affLink) console.log("!!! Fallback về env SHOPEE_AFF_LINK");
        }

        // BƯỚC 3: Điền mô tả trên màn hình Tuỳ chọn đăng
        console.log("✍️ Đang điền Caption...");
        const textBox = await page.$('div[role="textbox"][contenteditable="true"]');
        if (textBox) {
            await textBox.click();
            await delay(1000);

            const userTier = dbConfig?.tier || 'free';
            const GEMINI_KEY_POOL = [
                process.env.GEMINI_API_KEY,
                process.env.GEMINI_API_KEY_2,
                process.env.GEMINI_API_KEY_3,
            ].filter(Boolean);

            let caption = "";

            if (userTier !== 'free' && GEMINI_KEY_POOL.length > 0) {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                let prompt = `Bạn là một chuyên gia sáng tạo nội dung viral trên Facebook Reels.\n`;
                prompt += `Hãy viết 1 caption thật ngắn gọn (tối đa 2-3 câu) theo ĐÚNG CẤU TRÚC SAU:\n`;
                if (affLink) {
                    prompt += `👉 [1 câu mồi giới thiệu món đồ hot trend gây tò mò] [LINK]\n\n`;
                }
                prompt += `[1 câu giật gân tóm tắt phim dựa trên tiêu đề: "${videoToProcess.title}"]\n\n`;
                prompt += `Không dùng markdown in đậm/nghiêng. Trả về trực tiếp kết quả. ${affLink ? 'Tuyệt đối giữ nguyên chữ [LINK] để tool tự thay thế.' : ''}\n`;

                let success = false;
                for (let i = 0; i < GEMINI_KEY_POOL.length; i++) {
                    try {
                        console.log(`🔑 Thử Gemini key #${i + 1}/${GEMINI_KEY_POOL.length} để viết Cap Reels...`);
                        const genAI = new GoogleGenerativeAI(GEMINI_KEY_POOL[i]);
                        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
                        
                        const result = await model.generateContent(prompt);
                        let finalCaption = result.response.text().replace(/\*/g, '').trim();
                        if (finalCaption.startsWith('"') && finalCaption.endsWith('"')) {
                            finalCaption = finalCaption.slice(1, -1);
                        }
                        
                        if (affLink) {
                            if (finalCaption.includes('[LINK]')) {
                                caption = finalCaption.replace('[LINK]', affLink);
                            } else {
                                caption = `👉 Link mua hàng ở đây nha: ${affLink}\n\n${finalCaption}`;
                            }
                        } else {
                            caption = finalCaption;
                        }
                        success = true;
                        break;
                    } catch (e) {
                        console.log(`⚠️ Key #${i + 1} lỗi: ${e.message}`);
                    }
                }
                if (!success) {
                    // Fallback nếu API lỗi hết
                    caption = affLink ? `👉 Link mua hàng ở đây nha: ${affLink}\n\n${videoToProcess.title}` : videoToProcess.title;
                }
            } else {
                // Gói free hoặc không có key
                caption = affLink ? `👉 Link mua hàng ở đây nha: ${affLink}\n\n${videoToProcess.title}` : videoToProcess.title;
            }

            caption += `\n\n#phimhay #reviewphim #giaitri #reels`;

            const lines = caption.split('\n');
            for (let line of lines) {
                await page.keyboard.type(line, { delay: 50 });
                await page.keyboard.down('Shift');
                await page.keyboard.press('Enter');
                await page.keyboard.up('Shift');
            }
        } else {
            console.log("!!! Không tìm thấy ô nhập Caption!");
        }
        await delay(3000);

        // BƯỚC 4: Gắn thẻ Affiliate (Màn hình cuối)
        if (affLink && affLink !== 'https://shope.ee/YOUR_LINK_HERE') {
            console.log("🛒 Bắt đầu gắn thẻ Affiliate Shopee...");
            await logToWeb(email, 'yt-reels', 'Đang thực hiện gắn thẻ link Affiliate Shopee vào Reels...', 'info');

            const clickAddProduct = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*')).filter(el => {
                    if (el.children.length > 0) return false;
                    const text = (el.innerText || '').trim();
                    return text === 'Thêm sản phẩm' || text === 'Add product';
                });

                for (let el of elements) {
                    let clickable = el.closest('div[role="button"]') || el.closest('div[tabindex="0"]');
                    if (clickable) {
                        clickable.click();
                        return true;
                    }
                }
                return false;
            });

            if (clickAddProduct) {
                console.log("⏳ Chờ Pop-up hiện lên...");
                await delay(3000);

                console.log("⌨️ Nhập URL Shopee...");
                const inputFocused = await page.evaluate(() => {
                    const inputs = Array.from(document.querySelectorAll('input'));
                    let urlInput = inputs.find(i => i.placeholder === 'URL' || i.getAttribute('aria-label') === 'URL' || i.type === 'text' || i.type === 'url');
                    if (urlInput) {
                        urlInput.focus();
                        return true;
                    }
                    return false;
                });

                if (inputFocused) {
                    await delay(500);
                    await page.keyboard.type(affLink, { delay: 10 });
                    await delay(2000);

                    console.log("💾 Bấm nút Lưu...");
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                        const saveBtn = buttons.find(b => (b.innerText || '').trim() === 'Lưu' || (b.innerText || '').trim() === 'Save');
                        if (saveBtn) saveBtn.click();
                    });
                    console.log("✓ Đã gắn thẻ sản phẩm!");
                }
                await delay(3000);
            } else {
                console.log("!!! Không tìm thấy nút 'Thêm sản phẩm' trên màn hình Đăng.");
            }
        }

        // BƯỚC 5: Bấm Đăng / Publish
        console.log("🚀 Bấm Đăng Reels (Đợi FB duyệt bản quyền)...");
        await logToWeb(email, 'yt-reels', 'Bấm Đăng Reels! Đang chờ thuật toán FB duyệt bản quyền (90s)...', 'info');
        const published = await clickButtonWithText(page, ['đăng', 'publish'], 30); // Chờ lên đến 90s (30x3s)
        if (!published) {
            console.log("!!! Không bấm được nút Đăng (có thể do video quá nặng hoặc lỗi). Dừng tiến trình!");
            throw new Error("Không thể click nút Đăng");
        }

        console.log("⏳ Chờ hoàn tất đăng bài (90s) để video 1080p không bị ngắt quãng...");
        await delay(90000);

        console.log("✓ Đăng FB Reels thành công!");
        await logToWeb(email, 'yt-reels', `Đăng FB Reels thành công: ${videoToProcess.title}`, 'success');
        await updateUsageStats(email, 'reels_posted', 1);
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✓ <b>[Bot Up Reels]</b>\nĐăng FB Reels thành công:\n- Video: <b>${videoToProcess.title}</b>\nTài khoản: ${email}`);
        }

        // Lưu lịch sử
        postedIds.push(videoToProcess.id);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(postedIds, null, 2));

        // BƯỚC 6: AUTO-COMMENT RẢI LINK CHO GÓI PLUS / PRO
        const userTier = dbConfig?.tier || 'free';
        let numComments = 0;
        if (userTier === 'plus') numComments = 2;
        else if (userTier === 'pro' || userTier === 'promax') numComments = 3;

        if (numComments > 0) {
            console.log(`💬 Kích hoạt Auto-comment cho gói ${userTier.toUpperCase()} (${numComments} links)...`);
            await logToWeb(email, 'yt-reels', `Chuyển sang tường nhà để Auto-comment ${numComments} links Affiliate...`, 'info');

            await page.goto('https://www.facebook.com/me', { waitUntil: 'networkidle2', timeout: 60000 });
            await delay(5000);

            const clickedFirstCommentBtn = await page.evaluate(() => {
                const cmtBtns = Array.from(document.querySelectorAll('div[role="button"][aria-label="Bình luận"], div[role="button"][aria-label="Leave a comment"]'));
                const visibleCmtBtn = cmtBtns.find(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && rect.top >= 0;
                });
                if (visibleCmtBtn) {
                    visibleCmtBtn.click();
                    return true;
                }
                return false;
            });

            if (clickedFirstCommentBtn) {
                console.log("💬 Đã mở bảng Bình luận của Reel vừa đăng.");
                await delay(3000);

                const supabaseLinks = dbConfig?.affiliate_links_arr || [];
                let localProducts = [];
                try {
                    localProducts = JSON.parse(fs.readFileSync('./data_products.json', 'utf8')).map(p => p.link);
                } catch (e) {}
                
                let linkPool = supabaseLinks.length > 0 ? supabaseLinks : localProducts;
                linkPool = linkPool.sort(() => 0.5 - Math.random());
                const linksToPost = linkPool.slice(0, numComments);

                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const GEMINI_KEY_POOL = [
                    process.env.GEMINI_API_KEY,
                    process.env.GEMINI_API_KEY_2,
                    process.env.GEMINI_API_KEY_3,
                ].filter(Boolean);

                for (let cmtIdx = 0; cmtIdx < linksToPost.length; cmtIdx++) {
                    const currentLink = linksToPost[cmtIdx];
                    let cmtText = `👉 Món đồ này siêu hot luôn nha: ${currentLink}`;

                    if (GEMINI_KEY_POOL.length > 0) {
                        let prompt = `Bạn là người săn sale Shopee.\n`;
                        prompt += `Hãy viết 1 câu bình luận siêu ngắn gọn, khen một món đồ cực hot, cuối câu để nguyên chữ [LINK]\n`;
                        prompt += `Ví dụ: "Món này xinh xỉu luôn mấy bà: [LINK]"\n`;
                        prompt += `Tuyệt đối không dùng markdown. BẮT BUỘC có chữ [LINK].\n`;

                        for (let i = 0; i < GEMINI_KEY_POOL.length; i++) {
                            try {
                                const genAI = new GoogleGenerativeAI(GEMINI_KEY_POOL[i]);
                                const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
                                const result = await model.generateContent(prompt);
                                let gCap = result.response.text().replace(/\*/g, '').trim();
                                if (gCap.startsWith('"') && gCap.endsWith('"')) gCap = gCap.slice(1, -1);
                                if (gCap.includes('[LINK]')) {
                                    cmtText = gCap.replace('[LINK]', currentLink);
                                } else {
                                    cmtText = `${gCap} 👉 ${currentLink}`;
                                }
                                break;
                            } catch (e) {}
                        }
                    }

                    const uploadBoxInfo = await page.evaluate(() => {
                        const boxes = Array.from(document.querySelectorAll('div[role="textbox"][aria-label="Viết bình luận"], div[role="textbox"][aria-label="Leave a comment"], div[role="textbox"][contenteditable="true"]'));
                        const visibleBox = boxes.find(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.width > 0 && rect.height > 0;
                        });
                        if (visibleBox) {
                            const boxRect = visibleBox.getBoundingClientRect();
                            return { boxX: boxRect.x + boxRect.width / 2, boxY: boxRect.y + boxRect.height / 2 };
                        }
                        return null;
                    });

                    if (uploadBoxInfo) {
                        await page.mouse.click(uploadBoxInfo.boxX, uploadBoxInfo.boxY);
                        await delay(1000);
                        
                        const lines = cmtText.split('\n');
                        for (const [index, line] of lines.entries()) {
                            await page.keyboard.type(line, { delay: 50 });
                            if (index < lines.length - 1) {
                                await page.keyboard.down('Shift');
                                await page.keyboard.press('Enter');
                                await page.keyboard.up('Shift');
                                await delay(200);
                            }
                        }

                        await delay(1000);
                        await page.keyboard.press('Enter');
                        console.log(`✓ Đã gửi cmt thứ ${cmtIdx + 1}`);
                        await logToWeb(email, 'yt-reels', `Đã bắn Comment rải link ${cmtIdx + 1}/${numComments}...`, 'info');
                        await delay(Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000);
                    } else {
                        break;
                    }
                }
            } else {
                console.log("!!! Không tìm thấy nút Bình luận trên trang cá nhân.");
            }
        }

    } catch (err) {
        console.error("✗ Lỗi khi đăng Reels:", err.message);
        await logToWeb(email, 'yt-reels', `Lỗi khi đăng Reels: ${err.message}`, 'error');
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Up Reels Lỗi]</b>\nLỗi: ${err.message}\nTài khoản: ${email}`);
        }
        await page.screenshot({ path: `debug_reels_err_${Date.now()}.png` });
        process.exit(1); // Cố tình văng lỗi để Github Actions đỏ lòm cho dễ track
    } finally {
        // === AUTO REFRESH COOKIE ===
        try {
            console.log("🍪 Đang trích xuất Cookie FB mới để gia hạn...");
            const currentCookies = await page.cookies();

            const updatedCookies = currentCookies.map(c => ({
                domain: c.domain,
                expirationDate: c.expires,
                hostOnly: !c.domain.startsWith('.'),
                httpOnly: c.httpOnly,
                name: c.name,
                path: c.path,
                sameSite: c.sameSite === 'None' ? 'no_restriction' : 'unspecified',
                secure: c.secure,
                session: c.session,
                storeId: '0',
                value: c.value
            }));

            const { supabase } = require('./supabase_helper');
            if (dbConfig && dbConfig.id && supabase) {
                const { error: cookieUpdateErr } = await supabase
                    .from('profiles')
                    .update({ fb_cookie: JSON.stringify(updatedCookies) })
                    .eq('id', dbConfig.id);

                if (!cookieUpdateErr) {
                    console.log("✓ Đã lấy Cookie FB mới thành công và cập nhật lên DB!");
                    await logToWeb(email, 'yt-reels', `✓ Đã lưu Cookie FB mới vào DB (Gia hạn thành công)!`, 'success');
                }
            }
        } catch (cookieErr) {
            console.error("Lỗi trích xuất Cookie FB:", cookieErr);
        }
        // === END AUTO REFRESH ===

        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        await browser.close();
    }
})();
