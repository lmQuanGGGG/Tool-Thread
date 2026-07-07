const puppeteer = require('puppeteer');
require('dotenv').config();

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    let cookies = JSON.parse(process.env.FB_COOKIE).map(c => {
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
    
    // Attempt to close popups
    try {
        await page.evaluate(() => {
            const closeBtns = [...document.querySelectorAll('div[aria-label="Đóng"], div[aria-label="Close"]')];
            closeBtns.forEach(btn => { if (btn) btn.click(); });
        });
        await delay(2000);
    } catch(e) {}
    
    await page.evaluate(() => window.scrollBy(0, 800));
    await delay(3000);
    
    await page.screenshot({ path: 'test_fb_debug.png' });
    
    // Dump button roles
    const btnData = await page.evaluate(() => {
        let btns = Array.from(document.querySelectorAll('div[role="button"]'));
        return btns.map(b => ({
            text: b.innerText,
            aria: b.getAttribute('aria-label'),
            className: b.className
        })).filter(b => b.text && b.text.length < 20);
    });
    
    console.log(JSON.stringify(btnData, null, 2));
    await browser.close();
})();
