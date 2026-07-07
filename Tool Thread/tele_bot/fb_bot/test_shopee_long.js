const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const axios = require('axios');

(async () => {
    // 1. Dùng axios hoặc curl để lấy link thật
    let longUrl = '';
    try {
        const response = await axios.get('https://s.shopee.vn/1113p8TfrF', {
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400; // Resolve only if the status code is less than 400
            }
        });
        longUrl = response.headers.location;
    } catch(e) {
        longUrl = e.response ? e.response.headers.location : null;
    }
    console.log("Long URL:", longUrl);

    if (!longUrl) return;

    // 2. Dùng puppeteer mở link thật
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto(longUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    
    const title = await page.evaluate(() => {
        const span = document.querySelector('.WB0p8t') || document.querySelector('span[data-testid="product-name"]');
        if (span) return span.innerText;
        return document.title;
    });
    
    console.log("Title after loading long URL:", title);
    
    await browser.close();
})();
