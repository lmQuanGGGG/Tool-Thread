const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    await page.goto('https://s.shopee.vn/1113p8TfrF', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 5000));
    console.log(page.url());
    const title = await page.title();
    console.log(title);
    
    await browser.close();
})();
