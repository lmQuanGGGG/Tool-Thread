const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://s.shopee.vn/2Vprblnbew', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'shopee_test.png' });
    
    console.log("URL after redirect:", page.url());
    
    const title = await page.evaluate(() => {
        const span = document.querySelector('.WB0p8t') || document.querySelector('span[data-testid="product-name"]');
        if (span) return span.innerText;
        return document.title;
    });
    
    console.log("Title:", title);
    
    await browser.close();
})();
