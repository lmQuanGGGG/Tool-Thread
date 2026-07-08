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

const { fetchBotConfig, logToWeb, checkQuota, updateUsageStats } = require('../supabase_helper');

(async () => {
    const pm2ProcessName = 'fb-story-farmer';
    const manualFlagPath = path.resolve(__dirname, '..', `${pm2ProcessName}.manual`);
    const isGithubAction = process.env.GITHUB_ACTIONS === 'true';

    const email = process.env.USER_EMAIL || 'admin@autofarm.com';

    // HÚT CONFIG TỪ SUPABASE TRƯỚC ĐỂ BIẾT TIER
    let dbConfig = null;
    try {
        dbConfig = await fetchBotConfig(email);
    } catch (e) {}

    // Kiểm tra Quota trước khi chạy
    const hasQuota = await checkQuota(email, 'fb_posts_count');
    if (!hasQuota) {
        console.log(`❌ Tài khoản ${email} đã hết giới hạn đăng bài FB hôm nay. Dừng script.`);
        await logToWeb(email, 'fb-story', `Đã hết giới hạn đăng bài FB hôm nay. Dừng script.`, 'warn');
        process.exit(0);
    }

    const isPromax = dbConfig?.tier === 'promax';
    await logToWeb(email, 'fb-story', `Khởi động tool FB Story... Tier: ${dbConfig?.tier}`, 'info');

    if (fs.existsSync(manualFlagPath) || isPromax || isGithubAction) {
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
        console.error("❌ Lỗi: Chưa có FB_COOKIE trong file .env!");
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
        console.error("❌ Không tìm thấy dữ liệu sản phẩm (Chưa nhập link hoặc chưa đồng bộ).");
        await logToWeb(email, 'fb-story', '❌ Lỗi: Bạn chưa nhập Affiliate Link hoặc chưa bấm Đồng Bộ trên Web!', 'error');
        process.exit(1);
    }

    // Chọn 2 sản phẩm ngẫu nhiên khác nhau (nếu đủ số lượng)
    let product1 = scrapedData[getRandomInt(0, scrapedData.length - 1)];
    let product2 = scrapedData[getRandomInt(0, scrapedData.length - 1)];
    if (scrapedData.length > 1) {
        while (product2.aff_link === product1.aff_link) {
            product2 = scrapedData[getRandomInt(0, scrapedData.length - 1)];
        }
    }
    
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
    let caption1 = product1.suggested_comment || `${product1.title}\n🛒 Đặt hàng tại đây: ${product1.aff_link}`;
    let caption2 = product2.suggested_comment || `${product2.title}\n🛒 Đặt hàng tại đây: ${product2.aff_link}`;
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
    await page.goto('https://www.facebook.com/me', { waitUntil: 'networkidle2' });
    await delay(5000);

    try {
        console.log("✍️ Đang tạo bài post mới trên trang cá nhân...");
        await logToWeb(email, 'fb-story', '✍️ Đang tạo bài post mới trên trang cá nhân...', 'info');
        
        // Tìm ô "Bạn đang nghĩ gì?"
        const postBoxSelectors = [
            'div[aria-label="Bạn đang nghĩ gì?"]',
            'div[aria-label="What\'s on your mind?"]',
            'span:contains("Bạn đang nghĩ gì?")',
            'div[role="button"]:has(span:contains("nghĩ gì"))'
        ];
        
        let clicked = false;
        for (let sel of postBoxSelectors) {
            try {
                // Thử dùng evaluate để click cho chuẩn
                const clickedBox = await page.evaluate(() => {
                    const box = document.querySelector('div[aria-label="Bạn đang nghĩ gì?"]') || document.querySelector('div[aria-label="What\'s on your mind?"]');
                    if(box) {
                        box.click();
                        return true;
                    }
                    const spans = Array.from(document.querySelectorAll('span')).filter(el => el.innerText.includes('nghĩ gì') || el.innerText.includes('mind?'));
                    if(spans.length > 0) {
                        spans[0].click();
                        return true;
                    }
                    return false;
                });
                if(clickedBox) {
                    clicked = true;
                    break;
                }
            } catch (e) {}
        }
        
        if (!clicked) {
            console.log("⚠️ Không click được ô post bằng JS, chụp ảnh debug...");
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
            await fileInputs[fileInputs.length - 1].uploadFile(...imagePaths);
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
            const lines = caption.split('\n');
            for (let i = 0; i < lines.length; i++) {
                await page.keyboard.type(lines[i], { delay: 50 });
                if (i < lines.length - 1) {
                    await page.keyboard.down('Shift');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Shift');
                    await delay(100);
                }
            }
        }
        
        await delay(3000);
        
        // Bấm nút Đăng
        console.log("🚀 Bấm Đăng (Post)...");
        await logToWeb(email, 'fb-story', '🚀 Bấm Đăng (Post)...', 'info');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"]'));
            const postBtn = btns.find(b => b.innerText === 'Đăng' || b.innerText === 'Post');
            if(postBtn) postBtn.click();
        });
        
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
            if(shareBtns.length > 0) shareBtns[0].click();
        });
        await delay(3000);
        
        // Bấm nút Share lên Story
        await page.evaluate(() => {
            const menuItems = Array.from(document.querySelectorAll('span'));
            const storyBtn = menuItems.find(s => s.innerText.includes('tin của bạn') || s.innerText.includes('your story'));
            if(storyBtn) {
                // Click ngược lên parent để chọn trúng nút
                let parent = storyBtn.parentElement;
                while(parent && parent.getAttribute('role') !== 'menuitem') {
                    parent = parent.parentElement;
                }
                if(parent) parent.click();
                else storyBtn.click();
            }
        });
        
        console.log("⏳ Chờ 10s để load giao diện chỉnh sửa Story...");
        await delay(10000);
        
        // Bấm nút Đăng (trong giao diện Story)
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"]'));
            const shareBtn = btns.find(b => b.innerText === 'Chia sẻ lên tin' || b.innerText === 'Share to Story');
            if(shareBtn) shareBtn.click();
        });
        
        console.log("✅ Đã Share lên Story thành công!");
        await logToWeb(email, 'fb-story', '✅ Đã Share lên Story thành công!', 'success');
        await updateUsageStats(email, 'fb_posts_count', 1);
        await delay(5000);

    } catch (e) {
        console.error("❌ Lỗi trong quá trình đăng bài:", e.message);
    }
    
    // Dọn dẹp
    for (let p of imagePaths) {
        if (fs.existsSync(p)) {
            fs.unlinkSync(p);
        }
    }
    console.log("🎉 Hoàn tất chu trình Đăng & Share Shopee!");
    await logToWeb(email, 'fb-story', '🎉 Hoàn tất chu trình Đăng & Share Shopee!', 'success');
    await browser.close();
})();
