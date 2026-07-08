const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
require('dotenv').config();

// TÍCH HỢP ĐƯỜNG ỐNG SUPABASE
const { fetchBotConfig, updateUsageStats, logToWeb } = require('./supabase_helper');

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
            console.error("❌ Lỗi quét kênh:", err.message);
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
                    return texts.some(t => text.includes(t)) && !disabled;
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

    // 1. Kéo config từ DB trước
    let dbConfig = null;
    try {
        dbConfig = await fetchBotConfig();
    } catch (e) {}
    
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
    await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `Khởi động tool FB Reels... Channels: ${channels.length}`, 'info');

    const pm2ProcessName = 'fb-reels-farmer';
    const manualFlagPath = path.resolve(__dirname, `${pm2ProcessName}.manual`);
    const isGithubAction = process.env.GITHUB_ACTIONS === 'true';
    
    if (fs.existsSync(manualFlagPath) || isPromax || isGithubAction) {
        let msg = isGithubAction ? '⚡ Lệnh chạy tay từ Web' : (fs.existsSync(manualFlagPath) ? '⚡ Lệnh chạy tay' : '💎 Đặc quyền Promax');
        console.log(`${msg}! Bỏ qua bước ngâm nick...`);
        await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `${msg}! Bỏ qua bước ngâm nick...`, 'info');
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
    await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `Đã tìm thấy video mới: ${videoToProcess.title}. Đang tải...`, 'info');
    const outputPath = path.join(OUTPUT_DIR, `${videoToProcess.id}.mp4`);

    try {
        const videoUrl = videoToProcess.url.includes('/video/') ? videoToProcess.url : (videoToProcess.isTikTok ? `https://www.tiktok.com/@user/video/${videoToProcess.id}` : `https://www.youtube.com/watch?v=${videoToProcess.id}`);
        
        console.log(`\n➡️ Gọi API gendownload.com để lấy link 1080p cho video: ${videoUrl}`);
        await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `Đang gọi API GenDownload lấy video 1080p cho đa nền tảng...`, 'info');
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
            
            // Tải file bằng curl (-sL để tải âm thầm, tránh spam log trên Github Actions)
            const downloadCmd = `curl -sL -o "${outputPath}" "${bestFormat.url}"`;
            execSync(downloadCmd, { stdio: 'inherit' });
    } catch (err) {
        console.error("❌ Lỗi tải video:", err.message);
        process.exit(1);
    }

    if (!fs.existsSync(outputPath)) {
        console.error("❌ File không tồn tại sau khi tải.");
        process.exit(1);
    }
    console.log("✅ Tải video thành công!");
    await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `Tải video 1080p hoàn tất! Đang kết nối Facebook để đăng...`, 'info');

    // Bỏ qua FFMPEG theo yêu cầu của sếp, giữ nguyên video gốc để chất lượng cao nhất và up nhanh hơn.

    // 3. Đăng lên Facebook Reels
    // Lấy cookie
    const cookies = dbConfig?.fb_cookie_reels_arr || dbConfig?.fb_cookies_arr || [];
    
    if (!cookies || cookies.length === 0) {
        console.error("❌ Lỗi: Chưa có FB Cookie! Hãy nhập cookie trên trang Bots & Config.");
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
    await delay(3000);

    console.log("🔄 Kiểm tra màn hình xác nhận đăng nhập (Continue as)...");
    try {
        const isLoginScreen = await page.evaluate(() => {
            return document.body.innerText.includes('Tiếp tục') || document.body.innerText.includes('Continue');
        });
        if (isLoginScreen) {
            console.log("🔄 Phát hiện màn hình xác nhận đăng nhập, đang bấm Tiếp tục...");
            await clickButtonWithText(page, ['tiếp tục', 'continue'], 2);
            await delay(5000);
        }
    } catch (e) {}

    console.log("🌐 Đi đến trang tạo Reels...");
    await page.goto('https://www.facebook.com/reels/create', { waitUntil: 'networkidle2' });
    await delay(5000);

    try {
        console.log("⬆️ Đang tải video lên...");
        await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `Đang upload video lên Facebook Reels...`, 'info');
        
        let fileInput = await page.$('input[type="file"]');
        if (!fileInput) {
            const currentUrl = page.url();
            console.error("❌ Không tìm thấy input up video. URL hiện tại:", currentUrl);
            
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
            console.log("⚠️ Không bấm được nút Tiếp 1. Dừng tiến trình!");
            throw new Error("Không thể click nút Tiếp Lần 1");
        }
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
            if (affLink) console.log("⚠️ Fallback về env SHOPEE_AFF_LINK");
        }

        // BƯỚC 2: Điền mô tả trên màn hình Chỉnh sửa thước phim
        console.log("✍️ Đang điền Caption...");
        const textBox = await page.$('div[role="textbox"][contenteditable="true"]');
        if (textBox) {
            await textBox.click();
            await delay(1000);

            let caption = `${videoToProcess.title}\n#phimhay #reviewphim #giaitri #reels`;
            if (affLink) {
                caption += `\n👉 Link mua hàng ở đây nha: ${affLink}`;
            }
            const lines = caption.split('\n');
            for (let line of lines) {
                await page.keyboard.type(line, { delay: 50 });
                await page.keyboard.down('Shift');
                await page.keyboard.press('Enter');
                await page.keyboard.up('Shift');
            }
        } else {
            console.log("⚠️ Không tìm thấy ô nhập Caption!");
        }
        await delay(3000);

        // BƯỚC 3: Bấm Tiếp Lần 2 (Chỉnh sửa thước phim -> Tuỳ chọn đăng)
        console.log("➡️ Bấm nút Tiếp (Lần 2)...");
        const next2 = await clickButtonWithText(page, ['tiếp', 'next']);
        if (!next2) console.log("⚠️ Không bấm được nút Tiếp 2.");
        await delay(5000);

        // BƯỚC 4: Gắn thẻ Affiliate (Màn hình cuối)
        if (affLink && affLink !== 'https://shope.ee/YOUR_LINK_HERE') {
            console.log("🛒 Bắt đầu gắn thẻ Affiliate Shopee...");
            await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', 'Đang thực hiện gắn thẻ link Affiliate Shopee vào Reels...', 'info');

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
                    console.log("✅ Đã gắn thẻ sản phẩm!");
                }
                await delay(3000);
            } else {
                console.log("⚠️ Không tìm thấy nút 'Thêm sản phẩm' trên màn hình Đăng.");
            }
        }

        // BƯỚC 5: Bấm Đăng / Publish
        console.log("🚀 Bấm Đăng Reels (Đợi FB duyệt bản quyền)...");
        await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', 'Bấm Đăng Reels! Đang chờ thuật toán FB duyệt bản quyền (90s)...', 'info');
        const published = await clickButtonWithText(page, ['đăng', 'publish', 'chia sẻ', 'share'], 30); // Chờ lên đến 90s (30x3s)
        if (!published) {
            console.log("⚠️ Không bấm được nút Đăng (có thể do video quá nặng hoặc lỗi). Dừng tiến trình!");
            throw new Error("Không thể click nút Đăng");
        }

        console.log("⏳ Chờ hoàn tất đăng bài (90s) để video 1080p không bị ngắt quãng...");
        await delay(90000);

        console.log("✅ Đăng FB Reels thành công!");
        await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `Đăng FB Reels thành công: ${videoToProcess.title}`, 'success');
        await updateUsageStats(process.env.USER_EMAIL || 'admin@autofarm.com', 'reels_posted', 1);

        // Lưu lịch sử
        postedIds.push(videoToProcess.id);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(postedIds, null, 2));

    } catch (err) {
        console.error("❌ Lỗi khi đăng Reels:", err.message);
        await logToWeb(process.env.USER_EMAIL || 'admin@autofarm.com', 'yt-reels', `Lỗi khi đăng Reels: ${err.message}`, 'error');
        await page.screenshot({ path: `debug_reels_err_${Date.now()}.png` });
        process.exit(1); // Cố tình văng lỗi để Github Actions đỏ lòm cho dễ track
    } finally {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        await browser.close();
    }
})();
