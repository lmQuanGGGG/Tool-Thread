const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const { fetchBotConfig, logToWeb, checkQuota, updateUsageStats, sendTelegramMessage } = require('../supabase_helper');

(async () => {
    const pm2ProcessName = 'fb-story-farmer';
    const manualFlagPath = path.resolve(__dirname, '..', `${pm2ProcessName}.manual`);
    const isGithubAction = process.env.GITHUB_ACTIONS === 'true';

    const email = process.env.USER_EMAIL || 'admin@autofarm.com';

    // HÚT CONFIG TỪ SUPABASE TRƯỚC ĐỂ BIẾT TIER
    let dbConfig = null;
    try {
        dbConfig = await fetchBotConfig(email);
    } catch (e) { }

    // Kiểm tra Quota trước khi chạy
    const hasQuota = await checkQuota(email, 'fb_posts_count');
    if (!hasQuota) {
        console.log(`✗ Tài khoản ${email} đã hết giới hạn đăng bài FB hôm nay. Dừng script.`);
        await logToWeb(email, 'fb-story', `Đã hết giới hạn đăng bài FB hôm nay. Dừng script.`, 'warn');
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Đăng bài FB]</b>\nTừ chối chạy do đã hết giới hạn đăng bài hôm nay.\nTài khoản: ${email}`);
        }
        process.exit(0);
    }

    const isPromax = dbConfig?.tier === 'promax';
    await logToWeb(email, 'fb-story', `Khởi động tool FB Story... Tier: ${dbConfig?.tier}`, 'info');

    if (fs.existsSync(manualFlagPath) || isPromax || isGithubAction || process.argv.includes('--manual')) {
        let msg = isGithubAction ? '⚡ Lệnh chạy tay từ Web' : (fs.existsSync(manualFlagPath) ? '⚡ Lệnh chạy tay' : '💎 Đặc quyền Promax');
        console.log(`${msg}! Bỏ qua bước ngâm nick...`);
        await logToWeb(email, 'fb-story', `${msg}! Bỏ qua bước ngâm nick...`, 'info');
        if (fs.existsSync(manualFlagPath)) fs.unlinkSync(manualFlagPath);
    } else {
        const randomMinutes = Math.floor(Math.random() * 25) + 1;
        const msg = `⏱ Đang ngâm nick (delay ngẫu nhiên) ${randomMinutes} phút trước khi bắt đầu...`;
        console.log(msg);
        await logToWeb(email, 'fb-story', msg, 'info');
        await delay(randomMinutes * 60 * 1000);
    }
    console.log("🚀 Đang khởi động FB Shopee Post & Story Bot...");

    let fbCookieStr = dbConfig?.fb_cookie || process.env.FB_COOKIE;

    if (!fbCookieStr) {
        console.error("✗ Lỗi: Chưa có FB_COOKIE trong file .env!");
        process.exit(1);
    }
    let cookies = JSON.parse(fbCookieStr);

    const cleanCookies = cookies.map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        if (c.sameSite === 'unspecified') delete c.sameSite;
        delete c.storeId;
        delete c.id;
        delete c.hostOnly;
        delete c.session;
        return c;
    });

    // Đọc data cào từ DB (ưu tiên), nếu không có thì đọc từ file local
    let scrapedData = dbConfig?.parsed_affiliate_links || [];
    if (scrapedData.length === 0) {
        const dataFile = path.resolve(__dirname, 'shopee_data.json');
        if (fs.existsSync(dataFile)) {
            scrapedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        }
    }

    if (scrapedData.length === 0) {
        console.error("✗ Không tìm thấy dữ liệu sản phẩm (Chưa nhập link hoặc chưa đồng bộ).");
        await logToWeb(email, 'fb-story', '✗ Lỗi: Bạn chưa nhập Affiliate Link hoặc chưa bấm Đồng Bộ trên Web!', 'error');
        process.exit(1);
    }

    // Lọc ra các sản phẩm chưa đăng
    let unpostedData = scrapedData.filter(item => !item.fb_posted);

    // Nếu hết bài hoặc chỉ còn 1 bài (không đủ 2 bài để đăng), reset lại toàn bộ
    if (unpostedData.length < 2) {
        console.log("♻️ Đã đăng hết 1 vòng (hoặc không đủ 2 bài). Đang reset lại danh sách đăng từ đầu...");
        scrapedData.forEach(item => item.fb_posted = false);
        unpostedData = scrapedData;
    }

    // Chọn 2 sản phẩm ngẫu nhiên khác nhau từ danh sách chưa đăng
    let p1Index = getRandomInt(0, unpostedData.length - 1);
    let p2Index = getRandomInt(0, unpostedData.length - 1);
    if (unpostedData.length > 1) {
        while (p2Index === p1Index) {
            p2Index = getRandomInt(0, unpostedData.length - 1);
        }
    }

    let product1 = unpostedData[p1Index];
    let product2 = unpostedData[p2Index];

    // Đánh dấu 2 sản phẩm này là đã đăng trong mảng gốc
    let originalIdx1 = scrapedData.findIndex(item => item.aff_link === product1.aff_link);
    let originalIdx2 = scrapedData.findIndex(item => item.aff_link === product2.aff_link);
    if (originalIdx1 !== -1) scrapedData[originalIdx1].fb_posted = true;
    if (originalIdx2 !== -1) scrapedData[originalIdx2].fb_posted = true;

    console.log("🎯 Sản phẩm mục tiêu 1:", product1.title);
    console.log("🎯 Sản phẩm mục tiêu 2:", product2.title);

    // Tải ảnh về lưu tạm để upload
    const https = require('https');

    async function downloadImage(url, filename) {
        return new Promise((resolve) => {
            https.get(url, (res) => {
                const stream = fs.createWriteStream(filename);
                res.pipe(stream);
                stream.on('finish', () => resolve(filename));
            }).on('error', () => resolve(null));
        });
    }

    let imagePaths = [];
    if (product1.image_url) {
        const p1 = path.resolve(__dirname, `shopee_product1_${Date.now()}.png`);
        await downloadImage(product1.image_url, p1);
        imagePaths.push(p1);
    }
    if (product2.image_url) {
        const p2 = path.resolve(__dirname, `shopee_product2_${Date.now()}.png`);
        await downloadImage(product2.image_url, p2);
        imagePaths.push(p2);
    }

    console.log("📸 Đã tải ảnh xong:", imagePaths);

    // Ghép Caption 2 sản phẩm
    let caption1 = product1.suggested_comment && product1.suggested_comment.includes(product1.aff_link)
        ? product1.suggested_comment
        : (product1.suggested_comment ? `${product1.suggested_comment}\n🛒 Link: ${product1.aff_link}` : `${product1.title}\n🛒 Đặt hàng tại đây: ${product1.aff_link}`);

    let caption2 = product2.suggested_comment && product2.suggested_comment.includes(product2.aff_link)
        ? product2.suggested_comment
        : (product2.suggested_comment ? `${product2.suggested_comment}\n🛒 Link: ${product2.aff_link}` : `${product2.title}\n🛒 Đặt hàng tại đây: ${product2.aff_link}`);

    let finalCaption = `✨ Gom lẹ 2 deal này cho bà nào cần nha:\n\n1️⃣ ${caption1}\n\n2️⃣ ${caption2}`;

    // Khởi tạo trình duyệt
    const browser = await puppeteer.launch({
        headless: 'new', // Chạy ngầm hoàn toàn
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 2. Đăng nhập Facebook
    console.log("🌐 Đang truy cập Facebook (sau khi nạp Cookie)...");
    await logToWeb(email, 'fb-story', '🌐 Đang truy cập Facebook (sau khi nạp Cookie)...', 'info');
    await page.setCookie(...cleanCookies);

    // Tới trang chủ để lướt Feed giống người thật
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

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

    // Chuyển sang trang cá nhân để đăng bài
    await page.goto('https://www.facebook.com/me', { waitUntil: 'networkidle2' });

    // Xử lý các màn hình "Tiếp tục", "OK", "Bỏ qua" sau khi nạp cookie
    try {
        console.log("🔍 Đang kiểm tra xem có màn hình 'Tiếp tục / Continue' không...");
        await page.evaluate(() => {
            const btnTexts = ['tiếp tục', 'continue', 'ok', 'chấp nhận', 'accept', 'bỏ qua', 'skip', 'không, cảm ơn', 'no thanks', 'đăng nhập', 'log in'];
            const elements = [...document.querySelectorAll('div[role="button"], button, span')];
            for (let el of elements) {
                const text = (el.innerText || '').toLowerCase().trim();
                if (btnTexts.some(t => text.includes(t))) {
                    el.click();
                    break;
                }
            }
        });
        await delay(3000);
    } catch (e) {
        // Bỏ qua nếu không có nút
    }

    try {
        console.log("✍️ Đang tạo bài post mới trên trang cá nhân...");
        await logToWeb(email, 'fb-story', '✍️ Đang tạo bài post mới trên trang cá nhân...', 'info');

        let clicked = false;
        
        try {
            // Thử click bằng XPath
            const postBoxXPaths = [
                '//div[@role="button" and contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "nghĩ gì")]',
                '//div[@role="button" and contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "mind")]'
            ];

            for (let xpath of postBoxXPaths) {
                const elements = await page.$$('::-p-xpath(' + xpath + ')');
                for (let el of elements) {
                    // Click the element and wait a bit to see if modal opens
                    await el.click();
                    clicked = true;
                    break;
                }
                if (clicked) break;
            }
        } catch (e) {
            console.log("XPath click fail: " + e.message);
        }

        if (!clicked) {
            try {
                // Fallback: Thử bấm phím 'p' trên bàn phím (Phím tắt FB mở hộp thoại Đăng bài)
                console.log("Thử dùng phím tắt 'p' để mở ô đăng bài...");
                await page.keyboard.press('p');
                clicked = true;
            } catch (e) { }
        }

        if (!clicked) {
            console.log("!!! Không click được ô post bằng JS, chụp ảnh debug...");
            await page.screenshot({ path: 'debug_fb_post_box.png' });
            throw new Error("Không tìm thấy ô đăng bài. Có thể FB chưa đăng nhập thành công hoặc Cookie đã chết!");
        }

        await delay(3000);

        // Kích hoạt nút thêm Ảnh/Video trên giao diện FB trước
        console.log("Tìm nút thêm Ảnh/Video...");
        await page.evaluate(() => {
            const photoBtns = Array.from(document.querySelectorAll('div[aria-label="Ảnh/Video"], div[aria-label="Photo/video"], div[aria-label="Photo/Video"]'));
            if (photoBtns.length > 0) {
                photoBtns[0].click();
            }
        });
        await delay(2000);

        // Upload ảnh
        const fileInputSelector = 'input[type="file"][accept*="image"]';
        await page.waitForSelector(fileInputSelector, { timeout: 10000 }).catch(e => console.log("Không thấy nút up file, thử up mò"));

        // Lấy đúng ô input của form tạo bài (thường là ô cuối cùng)
        const fileInputs = await page.$$(fileInputSelector);
        if (fileInputs.length > 0 && imagePaths.length > 0) {
            const fileInput = fileInputs[fileInputs.length - 1];
            // Ép thẻ input nhận multiple file để tránh lỗi Puppeteer
            await page.evaluate(el => el.setAttribute('multiple', 'multiple'), fileInput);
            await fileInput.uploadFile(...imagePaths);
            console.log("🖼 Đã tải ảnh lên bài post!");
            await logToWeb(email, 'fb-story', '🖼 Đã tải ảnh lên bài post!', 'info');
            await delay(8000); // Tăng thời gian chờ load nhiều ảnh lên FB
        }

        // Gõ nội dung
        console.log("⌨️ Đang gõ Caption...");
        let caption = finalCaption;

        const textBoxSelector = 'div[aria-label^="Bạn đang nghĩ gì"], div[aria-label^="What\'s on your mind"], div[role="textbox"]';
        const textBoxes = await page.$$(textBoxSelector);
        if (textBoxes.length > 0) {
            await textBoxes[textBoxes.length - 1].click();
            // Đợi lâu hơn một chút để FB focus con trỏ vào ô nhập liệu
            await delay(1500);

            // Sử dụng insertText để paste nội dung thay vì type từng chữ, tránh lỗi emoji
            await page.evaluate((text) => {
                document.execCommand('insertText', false, text);
            }, caption);

            await delay(2000);
        }

        await delay(3000);

        // Bấm nút Đăng
        console.log("🚀 Bấm Đăng (Post)...");
        await logToWeb(email, 'fb-story', '🚀 Bấm Đăng (Post)...', 'info');
        // Hàm click button
        const clickPostBtn = async (btnTexts) => {
            let clicked = false;
            // 1. Thử click JS
            clicked = await page.evaluate((texts) => {
                const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                const postBtn = btns.find(b => {
                    const text = (b.innerText || '').trim();
                    const ariaLabel = b.getAttribute('aria-label') || '';
                    return texts.includes(text) || texts.includes(ariaLabel);
                });
                if (postBtn) {
                    postBtn.click();
                    return true;
                }
                return false;
            }, btnTexts);

            if (clicked) return true;

            // 2. Thử click bằng toạ độ
            await delay(1000);
            try {
                const postBtnInfo = await page.evaluate((texts) => {
                    const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                    const postBtn = btns.find(b => {
                        const text = (b.innerText || '').trim();
                        const ariaLabel = b.getAttribute('aria-label') || '';
                        return texts.includes(text) || texts.includes(ariaLabel);
                    });
                    if (postBtn) {
                        const style = window.getComputedStyle(postBtn);
                        if (postBtn.hasAttribute('disabled') || postBtn.getAttribute('aria-disabled') === 'true' || style.opacity !== '1') {
                            return 'DISABLED';
                        }
                        const rect = postBtn.getBoundingClientRect();
                        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                    }
                    return 'NOT_FOUND';
                }, btnTexts);

                if (postBtnInfo !== 'NOT_FOUND' && postBtnInfo !== 'DISABLED') {
                    console.log(`[INFO] Đã tìm thấy toạ độ nút ${btnTexts[0]}, thử click bằng chuột thật...`);
                    await page.mouse.click(postBtnInfo.x, postBtnInfo.y);
                    return true;
                }
            } catch (err) {
                console.log("Lỗi khi click toạ độ:", err.message);
            }
            return false;
        };

        const clickedNext = await clickPostBtn(['Tiếp', 'Next', 'Tiếp tục', 'Continue']);
        if (clickedNext) {
            console.log("👉 Đã bấm nút Tiếp. Chờ popup Đăng hiện ra...");
            await delay(2000);
        }

        await clickPostBtn(['Đăng', 'Post']);

        console.log("⏳ Chờ 15s để bài viết lên tường...");
        await delay(15000);

        // 3. Chuyển sang Share Story
        console.log("♻️ Đang tìm bài viết vừa đăng để Share lên Story...");
        await logToWeb(email, 'fb-story', '♻️ Đang tìm bài viết vừa đăng để Share lên Story...', 'info');
        await page.goto('https://www.facebook.com/me', { waitUntil: 'networkidle2' });
        await delay(5000);

        // Bấm nút Chia sẻ (Share) đầu tiên (chính là bài vừa đăng)
        await page.evaluate(() => {
            const shareBtns = Array.from(document.querySelectorAll('div[aria-label="Chia sẻ"], div[aria-label="Share"], div[aria-label="Gửi đi"], div[role="button"]')).filter(b => b.innerText === 'Chia sẻ' || b.innerText === 'Share');
            if (shareBtns.length > 0) shareBtns[0].click();
        });
        await delay(3000);

        // Bấm nút Share lên Story
        await page.evaluate(() => {
            const menuItems = Array.from(document.querySelectorAll('span'));
            const storyBtn = menuItems.find(s => s.innerText.includes('tin của bạn') || s.innerText.includes('your story'));
            if (storyBtn) {
                // Click ngược lên parent để chọn trúng nút
                let parent = storyBtn.parentElement;
                while (parent && parent.getAttribute('role') !== 'menuitem') {
                    parent = parent.parentElement;
                }
                if (parent) parent.click();
                else storyBtn.click();
            }
        });

        console.log("⏳ Chờ 10s để load giao diện chỉnh sửa Story...");
        await delay(10000);

        // Bấm nút Đăng (trong giao diện Story)
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"]'));
            const shareBtn = btns.find(b => b.innerText === 'Chia sẻ lên tin' || b.innerText === 'Share to Story');
            if (shareBtn) shareBtn.click();
        });

        console.log("✓ Đã Share lên Story thành công!");
        await logToWeb(email, 'fb-story', '✓ Đã Share lên Story thành công!', 'success');
        await updateUsageStats(email, 'fb_posts_count', 1);

        // Cập nhật lại mảng dữ liệu (đã đánh dấu fb_posted) lên DB và file local
        const { supabase } = require('../supabase_helper');
        if (dbConfig && dbConfig.id && supabase) {
            await supabase.from('profiles').update({ parsed_affiliate_links: scrapedData }).eq('id', dbConfig.id);
            console.log("💾 Đã lưu trạng thái Đã Đăng (fb_posted) của 2 sản phẩm vào Database.");
        }

        const dataFile = path.resolve(__dirname, 'shopee_data.json');
        if (fs.existsSync(dataFile)) {
            fs.writeFileSync(dataFile, JSON.stringify(scrapedData, null, 2));
        }

        await delay(5000);

    } catch (e) {
        console.error("✗ Lỗi trong quá trình đăng bài:", e.message);
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Đăng bài FB Lỗi]</b>\nLỗi: ${e.message}\nTài khoản: ${email}`);
        }
    }

    // Dọn dẹp
    for (let p of imagePaths) {
        if (fs.existsSync(p)) {
            fs.unlinkSync(p);
        }
    }
    console.log("🎉 Hoàn tất chu trình Đăng & Share Shopee!");
    await logToWeb(email, 'fb-story', '🎉 Hoàn tất chu trình Đăng & Share Shopee!', 'success');
    if (dbConfig && dbConfig.tele_chat_id) {
        await sendTelegramMessage(dbConfig.tele_chat_id, `✓ <b>[Bot Đăng bài FB]</b>\nHoàn thành 1 vòng đăng FB (Post & Story).\nTài khoản: ${email}`);
    }

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

        const { supabase } = require('../supabase_helper');
        if (dbConfig && dbConfig.id && supabase) {
            const { error: cookieUpdateErr } = await supabase
                .from('profiles')
                .update({ fb_cookie: JSON.stringify(updatedCookies) })
                .eq('id', dbConfig.id);

            if (!cookieUpdateErr) {
                console.log("✓ Đã lấy Cookie FB mới thành công và cập nhật lên DB!");
                await logToWeb(email, 'fb-story', `✓ Đã lưu Cookie FB mới vào DB (Gia hạn thành công)!`, 'success');
            }
        }
    } catch (cookieErr) {
        console.error("Lỗi trích xuất Cookie FB:", cookieErr);
    }
    // === END AUTO REFRESH ===

    await browser.close();
})();
