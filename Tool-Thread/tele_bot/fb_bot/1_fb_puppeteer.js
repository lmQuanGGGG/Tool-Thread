const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { fetchBotConfig, updateUsageStats, supabase } = require('../supabase_helper');

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Token Telegram từ .env
const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN || "8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc";

async function downloadImageFromTelegram(file_id) {
    console.log(`[INFO] Kéo ảnh từ Telegram... (file_id: ${file_id})`);
    try {
        const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${file_id}`;
        const fileRes = await axios.get(getFileUrl);
        const filePath = fileRes.data.result.file_path;

        const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });

        const localPath = path.resolve(__dirname, `temp_img_${Date.now()}.jpg`);
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

(async () => {
    // Group/Page comment jobs must begin at their scheduled slot. Keep only
    // the short in-browser pauses below; do not apply the old 1–25 minute
    // account warm-up delay to automatic runs.
    console.log('⚡ Bot comment Group/Page bắt đầu ngay, không ngâm nick.');
    // HÚT CONFIG TỪ SUPABASE
    const dbConfig = await fetchBotConfig();
    let fbCookieStr = dbConfig?.fb_cookie || process.env.FB_COOKIE;

    if (!fbCookieStr) {
        console.error("✗ Lỗi: Chưa có FB_COOKIE trong file .env!");
        process.exit(1);
    }
    let cookies = JSON.parse(fbCookieStr);

    const cleanCookies = cookies.map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId;
        delete c.id;
        delete c.hostOnly;
        delete c.session;
        return c;
    });

    // Ưu tiên danh sách Group/Page riêng của account trong Supabase. Nếu chưa
    // cấu hình trên web thì dùng list mặc định chung để tương thích dữ liệu cũ.
    const MAX_GROUP_TARGETS = 17;
    const GROUPS_PER_RUN_BY_TIER = {
        free: 3,
        lite: 4,
        plus: 5,
        pro: 6,
        promax: 6,
    };
    let targets = dbConfig?.fb_targets_arr?.length
        ? dbConfig.fb_targets_arr
        : JSON.parse(fs.readFileSync(path.resolve(__dirname, 'fb_targets.json'), 'utf8'));
    if (targets.length > MAX_GROUP_TARGETS) {
        console.log(`[INFO] Danh sách có ${targets.length} Group/Page; chỉ dùng ${MAX_GROUP_TARGETS} mục đầu theo quyền lợi gói.`);
        targets = targets.slice(0, MAX_GROUP_TARGETS);
    }
    const userTier = dbConfig?.tier || 'free';
    const tierGroupLimit = GROUPS_PER_RUN_BY_TIER[userTier] || GROUPS_PER_RUN_BY_TIER.free;
    if (targets.length > tierGroupLimit) {
        targets = targets.slice(0, tierGroupLimit);
        console.log(`[INFO] Gói ${userTier.toUpperCase()}: giới hạn ${tierGroupLimit} Group/Page mỗi phiên.`);
    }
    // Account chưa nhập affiliate link thì chỉ chạy tối đa 3 group đầu để không
    // chiếm quá lâu slot của các tác vụ khác. Có link vẫn tuân theo giới hạn gói.
    const hasAccountAffiliateLink = (dbConfig?.affiliate_links_arr || []).some(Boolean);
    if (!hasAccountAffiliateLink && targets.length > 3) {
        targets = targets.slice(0, 3);
        console.log('[INFO] Account chưa nhập link affiliate: chỉ chạy 3 Group/Page đầu.');
    }
    console.log(`[INFO] Dùng ${targets.length} Group/Page comment từ ${dbConfig?.fb_targets_arr?.length ? 'cấu hình account' : 'danh sách mặc định'}.`);

    // Đọc data từ data_products.json (tệp đã chứa link ảnh và comment mẫu)
    const productsPath = path.resolve(__dirname, '../data_products.json');
    let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    // Lọc ra các sản phẩm CÓ ẢNH (để đảm bảo cmt cho real)
    let validProducts = products.filter(p => p.tele_file_id && p.suggested_comment);

    if (validProducts.length === 0) {
        console.error("✗ Không có sản phẩm nào có đủ ảnh và cmt mẫu trong data_products.json!");
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: "new", // Ẩn trình duyệt khi chạy PM2
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-notifications'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });

    console.log("🍪 Nạp Cookie Facebook...");
    await page.setCookie(...cleanCookies);

    console.log("🌐 Đang truy cập Facebook (sau khi nạp Cookie)...");
    await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });

    let waitTime = getRandomInt(3000, 7000);
    console.log(`⏳ Đợi ${waitTime / 1000}s cho Facebook load hoàn tất...`);
    await delay(waitTime);

    // Xử lý các màn hình "Tiếp tục", "OK", "Bỏ qua" sau khi nạp cookie
    console.log("🔍 Đang kiểm tra xem có màn hình 'Tiếp tục / Continue' không (chờ tối đa 10s)...");
    for (let i = 0; i < 5; i++) {
        try {
            const clicked = await page.evaluate(() => {
                const btnTexts = ['tiếp tục', 'continue', 'ok', 'chấp nhận', 'accept', 'bỏ qua', 'skip', 'không, cảm ơn', 'no thanks', 'đăng nhập', 'log in', 'allow', 'cho phép'];
                const elements = [...document.querySelectorAll('div[role="button"], button, a, span[dir="auto"]')];
                for (let el of elements) {
                    const text = (el.innerText || '').toLowerCase().trim();
                    if (text && btnTexts.some(t => text.includes(t) || text.startsWith(t))) {
                        // Click cả bản thân và cha (nếu là span)
                        el.click();
                        if (el.closest('div[role="button"]')) el.closest('div[role="button"]').click();
                        return true;
                    }
                }
                return false;
            });
            if (clicked) {
                console.log("✓ Đã bấm nút Tiếp tục / OK!");
                await delay(3000);
                break;
            }
        } catch (e) { }
        await delay(2000); // Đợi 2s rồi thử lại
    }

    let totalGroups = 0;
    let totalPosts = 0;

    for (let target of targets) {
        console.log(`\n🎯 Di chuyển đến mục tiêu: ${target}`);
        await page.goto(target, { waitUntil: 'networkidle2' });
        await delay(getRandomInt(5000, 8000));

        try {
            await page.evaluate(() => {
                const closeBtns = [...document.querySelectorAll('div[aria-label="Đóng"], div[aria-label="Close"], div[aria-label="Tôi đồng ý"], div[aria-label="I agree"], div[aria-label="Tham gia nhóm"], div[aria-label="Join Group"]')];
                closeBtns.forEach(btn => { if (btn) btn.click(); });
            });
            await delay(2000);
        } catch (e) { }

        console.log("Cuộn trang nhiều lần để vượt qua 5 bài viết đầu tiên...");
        for (let s = 0; s < 5; s++) {
            await page.evaluate(() => window.scrollBy(0, 1200));
            await delay(2500);
        }

        try {
            console.log("👀 Đang quét các bài viết...");

            // Tìm tất cả các nút Bình luận
            const cmtBtns = await page.$$('div[role="button"]');
            let validCmtBtns = [];
            for (let btn of cmtBtns) {
                const isValid = await page.evaluate(el => {
                    const text = (el.innerText || '').trim();
                    const aria = (el.getAttribute('aria-label') || '').trim();

                    // Bắt Kiểu 1 (Nút có chữ "Bình luận") và Kiểu 2 (Nút Icon có aria-label="Bình luận")
                    // Tuyệt đối không dùng includes('Bình luận') để tránh click nhầm "Xem thêm bình luận" hoặc "490 bình luận"
                    return (
                        text === 'Bình luận' || text === 'Comment' ||
                        aria === 'Bình luận' || aria === 'Comment' || aria === 'Viết bình luận' || aria === 'Leave a comment'
                    );
                }, btn);

                if (isValid) {
                    validCmtBtns.push(btn);
                }
            }

            console.log(`[INFO] Tìm thấy ${validCmtBtns.length} bài viết có thể comment.`);

            // Bỏ qua 5 bài đầu tiên, bắt đầu từ bài thứ 6 (index 5)
            let startIndex = validCmtBtns.length > 5 ? 5 : 0;
            // Comment đúng 5 bài
            let postsToComment = 5;
            let commentedCount = 0;

            for (let i = startIndex; i < validCmtBtns.length; i++) {
                if (commentedCount >= postsToComment) break;

                let btn = validCmtBtns[i];
                try {
                    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), btn);
                    await delay(2000);

                    // Thả Like bài viết trước khi cmt
                    console.log(`👍 Đang thả Like cho bài thứ ${i + 1}...`);
                    await page.evaluate((cmtEl) => {
                        let parent = cmtEl.parentElement;
                        for (let k = 0; k < 3; k++) {
                            if (!parent) break;
                            const likeBtn = Array.from(parent.querySelectorAll('div[role="button"]')).find(el => el.innerText === 'Thích' || el.innerText === 'Like');
                            if (likeBtn) {
                                likeBtn.click();
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }, btn);
                    await delay(1500);

                    console.log(`💬 Click mở ô Comment cho bài thứ ${i + 1}...`);
                    await btn.click();
                    await delay(3000);

                    const commentBoxSelector = 'div[role="textbox"][aria-label="Viết bình luận"], div[role="textbox"][aria-label="Leave a comment"], div[role="textbox"][aria-label*="Viết bình luận"], div[role="textbox"][contenteditable="true"]';

                    const commentBoxes = await page.$$(commentBoxSelector);
                    if (commentBoxes.length > 0) {
                        let targetBox = null;
                        for (let box of commentBoxes) {
                            const isVisible = await page.evaluate(el => {
                                const rect = el.getBoundingClientRect();
                                return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
                            }, box);
                            if (isVisible) {
                                targetBox = box;
                                break;
                            }
                        }

                        if (!targetBox) targetBox = commentBoxes[0];

                        await targetBox.click();
                        await delay(1000);

                        // Bốc sản phẩm ngẫu nhiên
                        let pickedProduct = validProducts[getRandomInt(0, validProducts.length - 1)];
                        let linkStr = pickedProduct.link || pickedProduct.aff_link || "";
                        let titleStr = pickedProduct.product_name || pickedProduct.title || "";
                        let cmtText = (pickedProduct.suggested_comment && pickedProduct.suggested_comment.includes(linkStr))
                            ? pickedProduct.suggested_comment
                            : (pickedProduct.suggested_comment ? `${pickedProduct.suggested_comment}\n${linkStr}` : `${titleStr}\n${linkStr}`);

                        console.log(`📸 Tải ảnh sản phẩm về...`);
                        let localImg = await downloadImageFromTelegram(pickedProduct.tele_file_id);

                        if (localImg) {
                            console.log(`🖼️ Đính kèm ảnh vào comment...`);

                            // Tìm vị trí nút Đính kèm ảnh để click chuột thật
                            const attachBtnBox = await page.evaluate((box) => {
                                let parent = box;
                                for (let k = 0; k < 6; k++) {
                                    if (!parent) break;
                                    const fileIcons = Array.from(parent.querySelectorAll('div[aria-label="Đính kèm một ảnh hoặc video"], div[aria-label="Đính kèm ảnh hoặc video"], div[aria-label="Attach a photo or video"]'));
                                    if (fileIcons.length > 0) {
                                        const rect = fileIcons[0].getBoundingClientRect();
                                        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                                    }
                                    parent = parent.parentElement;
                                }
                                return null;
                            }, targetBox);

                            if (attachBtnBox) {
                                try {
                                    const [chooser] = await Promise.all([
                                        page.waitForFileChooser({ timeout: 10000 }),
                                        page.mouse.click(attachBtnBox.x, attachBtnBox.y)
                                    ]);
                                    await chooser.accept([localImg]);
                                    console.log(`⏳ Chờ load ảnh...`);
                                    await delay(6000); // Đợi FB tải ảnh xong hẳn
                                } catch (e) {
                                    console.log(`!!! Lỗi khi chờ FileChooser đính kèm ảnh:`, e.message);
                                }
                            } else {
                                console.log(`!!! Không tìm thấy nút đính kèm ảnh!`);
                            }
                        }

                        // Gõ text mồi
                        const lines = cmtText.split('\n');
                        for (let line of lines) {
                            await page.keyboard.type(line, { delay: getRandomInt(20, 50) });
                            await page.keyboard.down('Shift');
                            await page.keyboard.press('Enter');
                            await page.keyboard.up('Shift');
                            await delay(200);
                        }

                        await delay(2000);
                        await page.keyboard.press('Enter');

                        // Dự phòng: Click thẳng vào nút Gửi (đề phòng FB chặn phím Enter khi có ảnh)
                        await page.evaluate((box) => {
                            let parent = box;
                            for (let k = 0; k < 6; k++) {
                                if (!parent) break;
                                const sendBtns = Array.from(parent.querySelectorAll('div[aria-label="Bình luận"], div[aria-label="Comment"]')).filter(b => b.getAttribute('role') === 'button');
                                if (sendBtns.length > 0) {
                                    sendBtns[0].click();
                                    return;
                                }
                                parent = parent.parentElement;
                            }
                        }, targetBox);
                        await delay(3000);
                        console.log("✓ Đã bắn Comment + Ảnh thành công!");
                        commentedCount++;

                        if (localImg && fs.existsSync(localImg)) fs.unlinkSync(localImg);

                        if (commentedCount < postsToComment) {
                            let restTime = getRandomInt(15, 25);
                            console.log(`😴 Bot nghỉ mệt ${restTime}s trước khi cmt bài tiếp theo...`);
                            await delay(restTime * 1000);
                        }
                    } else {
                        console.log("!!! Không tìm thấy ô comment thật sự.");
                    }
                } catch (err) {
                    console.log(`✗ Lỗi khi comment bài ${i + 1}:`, err.message);
                }
            }

            console.log(`🚀 Đã hoàn thành ${commentedCount} bài ở Group/Page này. Chuyển mục tiêu...`);
            if (commentedCount > 0) {
                totalGroups++;
                totalPosts += commentedCount;
            }
            await delay(getRandomInt(20000, 30000));
        } catch (err) {
            console.log(`✗ Lỗi trong Group ${target}:`, err.message);
        }
    }

    console.log("🎉 Hoàn tất chiến dịch rải link FB!");
    try {
        const TELEGRAM_CHAT_ID = dbConfig?.tele_chat_id || process.env.TELE_CHAT_ID || -5396355060;
        const msg = `✓ **Báo cáo FB Comment Bot**\n\nTiến trình vừa chạy xong!\n- Đã rải thính tại: **${totalGroups} nhóm/page**\n- Tổng số bài viết đã cmt: **${totalPosts} bài**`;
        const sendUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(sendUrl, { chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' });
    } catch (err) {
        console.log("Lỗi gửi báo cáo Tele:", err.message);
    }
    
    try {
        const currentCookies = await page.cookies();
        if (currentCookies && currentCookies.length > 0 && supabase) {
            const email = dbConfig?.email || process.env.USER_EMAIL;
            if (email) {
                await supabase.from('profiles').update({ fb_cookie: JSON.stringify(currentCookies) }).eq('email', email);
                console.log("✓ Đã cập nhật Cookie FB mới vào Database!");
            }
        }
    } catch (e) {
        console.error("✗ Không thể lưu cookie FB mới:", e.message);
    }

    await browser.close();
})();
