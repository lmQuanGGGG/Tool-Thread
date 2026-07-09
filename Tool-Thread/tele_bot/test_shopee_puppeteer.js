const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testScrape() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const url = 'https://s.shopee.vn/2Vprblnbew';
    console.log("Going to URL:", url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const finalUrl = page.url();
    console.log("Final URL:", finalUrl);

    // Get title
    const title = await page.evaluate(() => {
        const el = document.querySelector('div.WBwj6U span, h1.WBwj6U, div[class*="title"]');
        return el ? el.innerText : document.title;
    });
    console.log("Title:", title);

    // Get image
    const imgUrl = await page.evaluate(() => {
        // Shopee usually has a meta tag for og:image
        const meta = document.querySelector('meta[property="og:image"]');
        if (meta) return meta.content;
        
        // Or find the main image
        const img = document.querySelector('div[class*="gallery"] img, div.Ap10Ew img');
        return img ? img.src : null;
    });
    console.log("Image URL:", imgUrl);

    await browser.close();
}

testScrape().catch(console.error);
