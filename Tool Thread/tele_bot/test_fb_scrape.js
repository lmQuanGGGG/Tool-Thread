const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

(async () => {
    let cookies = JSON.parse(process.env.FB_COOKIE);
    const cleanCookies = cookies.map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        if (c.sameSite === 'unspecified') delete c.sameSite;
        delete c.storeId; delete c.id; delete c.hostOnly; delete c.session;
        return c;
    });

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setCookie(...cleanCookies);

    await page.goto('https://www.facebook.com/me', { waitUntil: 'networkidle2' });
    
    // Tìm ô post
    const clickedBox = await page.evaluate(() => {
        const box = document.querySelector('div[aria-label="Bạn đang nghĩ gì?"]') || document.querySelector('div[aria-label="What\'s on your mind?"]');
        if(box) { box.click(); return true; }
        const spans = Array.from(document.querySelectorAll('span')).filter(el => el.innerText.includes('nghĩ gì') || el.innerText.includes('mind?'));
        if(spans.length > 0) { spans[0].click(); return true; }
        return false;
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Gõ link
    const textBoxSelector = 'div[aria-label^="Bạn đang nghĩ gì"], div[aria-label^="What\'s on your mind"], div[role="textbox"]';
    const textBoxes = await page.$$(textBoxSelector);
    if (textBoxes.length > 0) {
        await textBoxes[textBoxes.length - 1].click();
        await page.keyboard.type('https://s.shopee.vn/1113p8TfrF', { delay: 50 });
    }
    
    // Chờ preview
    await new Promise(r => setTimeout(r, 7000));
    
    const preview = await page.evaluate(() => {
        // Facebook render preview trong một khối link
        // Tìm ảnh
        let imgUrl = '';
        const imgs = Array.from(document.querySelectorAll('img')).filter(img => img.src && (img.src.includes('external') || img.src.includes('safe_image')));
        if (imgs.length > 0) imgUrl = imgs[imgs.length - 1].src;
        
        // Tìm text
        // Text thường nằm cạnh ảnh
        let title = '';
        const spans = Array.from(document.querySelectorAll('span[dir="auto"]'));
        for (let s of spans) {
            if (s.innerText && s.innerText.includes('Shopee') && s.innerText.length > 10) {
                title = s.innerText;
                break;
            }
        }
        return { imgUrl, title };
    });
    
    console.log("FB Preview:", preview);
    await browser.close();
})();
