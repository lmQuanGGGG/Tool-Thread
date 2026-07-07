const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const shopeeCookiePath = path.resolve(__dirname, 'shopee_cookie.json');
    let shopeeCookies = JSON.parse(fs.readFileSync(shopeeCookiePath, 'utf8'));
    shopeeCookies = shopeeCookies.map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        if (c.sameSite === 'unspecified') delete c.sameSite;
        delete c.storeId;
        delete c.id;
        delete c.hostOnly;
        delete c.session;
        return c;
    });
    await page.setCookie(...shopeeCookies);

    await page.goto('https://s.shopee.vn/2Vprblnbew', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("URL after redirect:", page.url());
    
    const title = await page.evaluate(() => {
        const span = document.querySelector('.WB0p8t') || document.querySelector('span[data-testid="product-name"]');
        if (span) return span.innerText;
        return document.title;
    });
    
    console.log("Title:", title);
    
    await browser.close();
})();
