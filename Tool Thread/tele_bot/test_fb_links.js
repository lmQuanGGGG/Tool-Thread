const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
require('dotenv').config();

(async () => {
    let targets = JSON.parse(fs.readFileSync("fb_bot/fb_targets.json", "utf8"));
    let fbCookieStr = process.env.FB_COOKIE;
    let cookies = JSON.parse(fbCookieStr).map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId; delete c.id; delete c.hostOnly; delete c.session;
        return c;
    });

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    
    console.log("🔍 Bắt đầu kiểm tra 16 links với quyền User...");

    for (let target of targets) {
        try {
            await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
            const title = await page.title();
            const bodyText = await page.evaluate(() => document.body.innerText);
            
            if (bodyText.includes("Bạn hiện không xem được nội dung này") || 
                bodyText.includes("This content isn't available right now") ||
                bodyText.includes("Liên kết bị hỏng") ||
                bodyText.includes("Broken link")) {
                console.log(`❌ [LỖI - KHÔNG TỒN TẠI]: ${target}`);
            } else if (title.includes("Đăng nhập") || title.includes("Log in")) {
                console.log(`⚠️ [LỖI COOKIE/ĐĂNG NHẬP]: ${target}`);
            } else if (bodyText.includes("Tham gia nhóm") || bodyText.includes("Join Group")) {
                console.log(`⚠️ [CHƯA THAM GIA NHÓM]: ${target}`);
            } else {
                console.log(`✅ [OK]: ${target} (Title: ${title})`);
            }
        } catch (e) {
            console.log(`❌ [LỖI TRUY CẬP]: ${target} - ${e.message}`);
        }
    }
    
    await browser.close();
})();
