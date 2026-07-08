const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { fetchBotConfig, updateUsageStats, logToWeb, checkQuota } = require('./supabase_helper');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

function delay(time) {
    return new Promise(function (resolve) { setTimeout(resolve, time) });
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN || "8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc";
const NICK_INDEX = process.env.NICK_INDEX || '1';

async function downloadImageFromTelegram(file_id) {
    try {
        const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${file_id}`;
        const fileRes = await axios.get(getFileUrl);
        const filePath = fileRes.data.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
        const localPath = path.resolve(__dirname, `temp_th_cmt_${Date.now()}.jpg`);
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(localPath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('[ERROR] Lỗi tải ảnh:', error.message);
        return null;
    }
}

// Removed duplicated require
(async () => {
    console.log(`🚀 Khởi động Threads Comment Bot (Nick ${NICK_INDEX})...`);

    const pm2ProcessName = `th-cmt-farmer-${NICK_INDEX}`;
    const manualFlagPath = path.resolve(__dirname, `${pm2ProcessName}.manual`);
    const isGithubAction = process.env.GITHUB_ACTIONS === 'true';

    // HÚT CONFIG TỪ SUPABASE TRƯỚC ĐỂ BIẾT TIER
    let dbConfig = null;
    const email = process.env.USER_EMAIL || 'admin@autofarm.com';
    try {
        dbConfig = await fetchBotConfig(email);
    } catch (e) { }

    // Kiểm tra Quota trước khi chạy
    const hasQuota = await checkQuota(email, 'threads_commented');
    if (!hasQuota) {
        console.log(`❌ Tài khoản ${email} đã hết giới hạn comment Threads hôm nay. Dừng script.`);
        await logToWeb(email, 'threads', `Đã hết giới hạn comment Threads hôm nay. Dừng script.`, 'warn');
        process.exit(0);
    }

    const isPromax = dbConfig?.tier === 'promax';
    await logToWeb(email, 'threads', `Khởi động tool Threads Comment... Tier: ${dbConfig?.tier}`, 'info');

    if (fs.existsSync(manualFlagPath) || isPromax || isGithubAction) {
        let msg = isGithubAction ? '⚡ Lệnh chạy tay từ Web' : (fs.existsSync(manualFlagPath) ? '⚡ Lệnh chạy từ Telegram' : '💎 Đặc quyền Promax');
        console.log(`${msg}! Bỏ qua bước ngâm nick, phi thẳng vào comment!`);
        await logToWeb(email, 'threads', `${msg}! Bỏ qua bước ngâm nick...`, 'info');
        if (fs.existsSync(manualFlagPath)) fs.unlinkSync(manualFlagPath); // Xoá cờ đi để lần sau chạy tự động còn biết mà ngâm nick
    } else {
        // Chạy tự động theo giờ (Cronjob): Ngâm delay random 10-30 phút
        const randomMinutes = Math.floor(Math.random() * 20) + 10;
        const msg = `⏱ HỆ THỐNG BOT TỰ ĐỘNG: Đang ngâm nick (delay ngẫu nhiên) ${randomMinutes} phút để tránh bị block...`;
        console.log(msg);
        await logToWeb(email, 'threads', msg, 'info');
        await delay(randomMinutes * 60 * 1000);
    }

    // Ưu tiên lấy data cào từ DB của user, nếu chưa có thì lấy tạm data gốc mẫu
    let products = dbConfig?.parsed_affiliate_links || [];
    if (products.length === 0) {
        const productsPath = path.resolve(__dirname, 'fb_bot', 'shopee_data.json');
        if (fs.existsSync(productsPath)) {
            products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        }
    }

    let validProducts = products.filter(p => p.tele_file_id && (p.suggested_comment || p.title));

    if (validProducts.length === 0) {
        console.error("❌ Không có sản phẩm nào hợp lệ (Chưa nhập Link Affiliate hoặc Chưa Đồng bộ).");
        await logToWeb(email, 'threads', '❌ Lỗi: Bạn chưa nhập Affiliate Link hoặc chưa bấm nút Đồng Bộ trên Web!', 'error');
        process.exit(1);
    }

    // dbConfig đã được fetch ở trên
    const cookieString = dbConfig?.threads_cookie || process.env[`COOKIE_ACC${NICK_INDEX}`];

    if (!cookieString) return console.error('[ERROR] Thiếu Cookie!');
    const rawCookies = JSON.parse(cookieString);

    const cookies = [];
    for (const raw of rawCookies) {
        let c = { ...raw };
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId; delete c.id; delete c.hostOnly; delete c.session;
        cookies.push({ ...c, domain: '.instagram.com' });
        cookies.push({ ...c, domain: '.threads.net' });
        cookies.push({ ...c, domain: '.threads.com' });
    }

    const browser = await puppeteer.launch({
        headless: 'new', // Ẩn màn hình, chạy ngầm
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');

        await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
        await page.setCookie(...cookies.filter(c => c.domain === '.instagram.com'));
        await page.setCookie(...cookies.filter(c => c.domain.includes('threads')));

        console.log("🌐 Truy cập Threads For You...");
        await logToWeb(email, 'threads', 'Đăng nhập thành công! Truy cập Threads For You...', 'info');
        await page.goto('https://www.threads.net/', { waitUntil: 'networkidle2', timeout: 45000 });
        await delay(5000);

        let commentedCount = 0;
        let consecutiveErrors = 0;
        let postsToComment = getRandomInt(4, 5);
        console.log(`🎯 Mục tiêu: Đi cmt dạo ${postsToComment} bài viết...`);
        await logToWeb(email, 'threads', `Mục tiêu: Đi cmt dạo ${postsToComment} bài viết...`, 'info');

        // Scroll vài lần để load bài
        for (let j = 0; j < 3; j++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await delay(2000);
        }

        // Vòng lặp comment
        while (commentedCount < postsToComment) {
            try {
                // Cuộn xuống vài bài để tìm bài mới
                console.log(`[INFO] Cuộn trang xuống để tìm bài viết mới...`);
                for (let s = 0; s < getRandomInt(2, 4); s++) {
                    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
                    await delay(1500);
                }

                // Tìm nút Comment gần giữa màn hình nhất (tránh lỗi danh sách ảo của React)
                let btn = await page.evaluateHandle(() => {
                    const btns = Array.from(document.querySelectorAll('svg[aria-label="Comment"], svg[aria-label="Bình luận"], svg[aria-label="Reply"], svg[aria-label="Trả lời"]'));
                    let centerBtn = btns[0];
                    let minDiff = 999999;
                    const centerY = window.innerHeight / 2;
                    for (let b of btns) {
                        const rect = b.getBoundingClientRect();
                        const diff = Math.abs(rect.top - centerY);
                        if (diff < minDiff) {
                            minDiff = diff;
                            centerBtn = b;
                        }
                    }
                    return centerBtn;
                });

                if (!btn) {
                    console.log("[INFO] Không tìm thấy nút comment nào trên màn hình hiện tại. Bỏ qua...");
                    continue;
                }

                // Click nút reply bằng thao tác chuột thật của Puppeteer (chuẩn xác hơn DOM click)
                const box = await btn.boundingBox();
                if (box) {
                    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                } else {
                    console.log("[INFO] Nút comment bị ẩn, bỏ qua bài này...");
                    continue;
                }
                await delay(3000);

                let pickedProduct = validProducts[getRandomInt(0, validProducts.length - 1)];

                const catchphrases = [
                    "Cái này xài thích lắm á mn, tui ưng xỉu:",
                    "Mấy bà ơi gom lẹ deal này nha, xài bao êm:",
                    "Ai chưa thử cái này thì thử liền đi, khum hối hận đâu:",
                    "Eo ôi ưng cái bụng ghê, để lại link cho bà nào cần nè:",
                    "Góc rắc thính: Món này dạo này tui mê cực kì:",
                    "Hôm bữa ai hỏi tui xài gì thì link đây nha:",
                    "Đừng hỏi sao tui chăm mua sắm, tại mấy món này xịn quá nè:"
                ];
                let randomThinh = catchphrases[getRandomInt(0, catchphrases.length - 1)];
                let cmtText = `✨ ${pickedProduct.title}\n\n👉 ${randomThinh} ${pickedProduct.aff_link}`;
                let localImg = await downloadImageFromTelegram(pickedProduct.tele_file_id);

                if (localImg) {
                    console.log(`🖼️ Đính kèm ảnh vào comment thứ ${commentedCount + 1}...`);
                    const [chooser] = await Promise.all([
                        page.waitForFileChooser({ timeout: 10000 }),
                        page.evaluate(() => {
                            const dialog = document.querySelector('div[role="dialog"]') || document;
                            const attachSvgs = Array.from(dialog.querySelectorAll('svg[aria-label="Attach media"], svg[aria-label="Đính kèm file phương tiện"]'));
                            if (attachSvgs.length > 0) {
                                // Tìm thẻ div bọc ngoài gần nhất có thể click
                                let p = attachSvgs[attachSvgs.length - 1]; // Lấy phần tử cuối cùng (thường là trong dialog hiện lên sau cùng)
                                while (p && p.tagName !== 'DIV') p = p.parentElement;
                                if (p) p.click();
                            }
                        })
                    ]);
                    await chooser.accept([localImg]);
                    await delay(6000);
                }

                console.log(`💬 Gõ nội dung comment...`);
                await logToWeb(email, 'threads', `Đang gõ comment thứ ${commentedCount + 1}...`, 'info');
                // Gõ text
                const lines = cmtText.split('\n');
                for (let line of lines) {
                    await page.keyboard.type(line, { delay: getRandomInt(20, 50) });
                    await page.keyboard.down('Shift');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Shift');
                    await delay(200);
                }

                await delay(2000);

                // Bấm nút Post bằng chuột thật của Puppeteer (Hỗ trợ 2 kiểu: Chữ và Mũi tên)
                const postBox = await page.evaluate(() => {
                    let postBtn = null;
                    const dialog = document.querySelector('div[role="dialog"]') || document;

                    // Kiểu 1: Nút chữ "Post", "Đăng", "Reply"...
                    const btns = Array.from(dialog.querySelectorAll('div[role="button"]'));
                    postBtn = btns.reverse().find(b => {
                        const txt = (b.innerText || '').trim();
                        return txt === 'Post' || txt === 'Đăng' || txt === 'Reply' || txt === 'Trả lời';
                    });

                    // Kiểu 2: Nút dạng mũi tên (SVG)
                    if (!postBtn) {
                        const svgs = Array.from(dialog.querySelectorAll('svg[aria-label="Post"], svg[aria-label="Đăng"], svg[aria-label="Reply"], svg[aria-label="Trả lời"]'));
                        if (svgs.length > 0) {
                            postBtn = svgs[svgs.length - 1]; // Ưu tiên nút xuất hiện sau cùng (trong modal)
                        }
                    }

                    if (postBtn) {
                        const rect = postBtn.getBoundingClientRect();
                        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                    }
                    return null;
                });

                if (postBox) {
                    await page.mouse.click(postBox.x + postBox.width / 2, postBox.y + postBox.height / 2);
                } else {
                    console.log("⚠️ Không tìm thấy nút Post!");
                }

                await delay(5000);
                console.log("✅ Đã bắn Comment + Ảnh thành công!");
                await logToWeb(email, 'threads', `✅ Đã bắn Comment + Ảnh thành công bài thứ ${commentedCount + 1}!`, 'success');
                await updateUsageStats(email, 'threads_commented', 1);
                commentedCount++;
                consecutiveErrors = 0;

                if (localImg && fs.existsSync(localImg)) fs.unlinkSync(localImg);

                let restTime = getRandomInt(15, 30);
                console.log(`😴 Bot nghỉ mệt ${restTime}s trước khi lướt bài tiếp...`);
                await delay(restTime * 1000);

                // Tắt modal (nếu có) bằng nút Esc hoặc nút Cancel
                await page.keyboard.press('Escape');
                await delay(1000);

                // Nhấn nút Home để thoát khỏi overlay bài viết và về lại feed chính
                console.log("🏠 Nhấn nút Home để thoát bài viết, về lại trang chủ...");
                await page.evaluate(() => {
                    const homeIcon = document.querySelector('svg[aria-label="Home"], svg[aria-label="Trang chủ"]');
                    if (homeIcon) {
                        let p = homeIcon;
                        while (p && p.tagName !== 'A') p = p.parentElement;
                        if (p) p.click();
                    } else {
                        // Fallback click logo Threads
                        const logo = document.querySelector('svg[aria-label="Threads"]');
                        if (logo) {
                            let p = logo;
                            while (p && p.tagName !== 'A') p = p.parentElement;
                            if (p) p.click();
                        }
                    }
                });
                await delay(3000);

            } catch (err) {
                console.log(`❌ Lỗi khi comment bài ${commentedCount + 1}:`, err.message);
                consecutiveErrors++;

                // Chụp màn hình để debug xem bị kẹt ở đâu
                await page.screenshot({ path: `debug_threads_cmt_err_${Date.now()}.png` });

                // Nhấn Esc nhiều lần để cố gắng đóng modal bị kẹt
                await page.keyboard.press('Escape');
                await delay(500);
                await page.keyboard.press('Escape');
                await delay(2000);

                if (consecutiveErrors >= 3) {
                    console.log("🛑 Lỗi liên tiếp quá 3 lần! Dừng bot để tránh kẹt vĩnh viễn.");
                    break; // Thoát vòng lặp
                }
            }
        }

        console.log(`🎉 Hoàn tất cmt dạo Threads. Tổng cộng: ${commentedCount} bài.`);
        await logToWeb(email, 'threads', `🎉 Hoàn tất cmt dạo Threads. Tổng cộng: ${commentedCount} bài.`, 'success');
        try {
            const TELEGRAM_CHAT_ID = dbConfig?.tele_chat_id || process.env.TELE_CHAT_ID || -5396355060;
            const msg = `✅ **Báo cáo Threads Comment Bot (Nick ${NICK_INDEX})**\n\nTiến trình vừa chạy xong!\n- Đã rải thính tại: **Trang chủ (For You)**\n- Tổng số bài viết đã cmt: **${commentedCount} bài**`;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' });
        } catch (err) { }
    } catch (err) {
        console.error("Lỗi tổng:", err.message);
    } finally {
        await browser.close();
    }
})();
