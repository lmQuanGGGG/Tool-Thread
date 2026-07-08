const puppeteer = require('puppeteer');
require('dotenv').config();

const delay = ms => new Promise(r => setTimeout(r, ms));
const { fetchBotConfig } = require('./supabase_helper');

(async () => {
    // 1. Lấy Cookie từ DB Supabase (thay vì dùng biến môi trường cứng)
    const dbConfig = await fetchBotConfig(process.env.USER_EMAIL || 'admin@autofarm.com');
    const cookieData = dbConfig?.fb_cookies_arr || [];

    if (!cookieData || cookieData.length === 0) {
        console.error("❌ Lỗi: Chưa có FB Cookie! Hãy nhập cookie trên trang Bots & Config.");
        process.exit(1);
    }

    let cookies = cookieData.map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId; delete c.id; delete c.hostOnly; delete c.session;
        return c;
    });

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'] });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Navigating...");
    await page.goto('https://www.facebook.com/groups/590639768048047/', { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(5000);
    
    await page.evaluate(() => window.scrollBy(0, 800));
    await delay(3000);
    
    // Tìm và bấm nút comment
    const cmtBtns = await page.$$('div[role="button"]');
    let targetBtn = null;
    for (let btn of cmtBtns) {
        const isValid = await page.evaluate(el => {
            const text = el.innerText || '';
            const aria = el.getAttribute('aria-label') || '';
            return text === 'Bình luận' || aria === 'Bình luận' || aria === 'Viết bình luận';
        }, btn);
        if (isValid) { targetBtn = btn; break; }
    }

    if (targetBtn) {
        console.log("Bấm nút comment...");
        await targetBtn.click();
        await delay(3000);
        await page.screenshot({ path: 'test_fb_cmt_box.png' });
        
        console.log("Đánh dấu ô nhập text...");
        const commentBoxSelector = 'div[role="textbox"]';
        const boxes = await page.$$(commentBoxSelector);
        
        // Dump textbox data
        const boxData = await page.evaluate(() => {
            let btns = Array.from(document.querySelectorAll('div[role="textbox"]'));
            return btns.map(b => ({
                text: b.innerText,
                aria: b.getAttribute('aria-label'),
                className: b.className
            }));
        });
        console.log(JSON.stringify(boxData, null, 2));

        if (boxes.length > 0) {
             await boxes[0].click();
             await delay(1000);
             await page.keyboard.type("Test auto bot");
             await delay(1000);
             await page.screenshot({ path: 'test_fb_cmt_typed.png' });
             await page.keyboard.press('Enter');
             await delay(2000);
             await page.screenshot({ path: 'test_fb_cmt_submitted.png' });
        }
    }
    await browser.close();
})();
