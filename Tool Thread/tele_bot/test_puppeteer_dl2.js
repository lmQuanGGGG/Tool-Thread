const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
    console.log("Launching...");
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    console.log("Navigating to ssyoutube.com...");
    try {
        await page.goto('https://ssyoutube.com/en741', { waitUntil: 'networkidle2' });
        await page.type('#id_url', 'https://www.youtube.com/watch?v=aj38LViraNc');
        await page.click('#btn-submit');
        console.log("Waiting for link...");
        await page.waitForSelector('.download-btn', { timeout: 15000 });
        const href = await page.evaluate(() => {
            const btn = document.querySelector('.download-btn');
            return btn ? btn.href : null;
        });
        console.log("FOUND LINK:", href ? href.substring(0, 50) + "..." : null);
    } catch (e) {
        console.log("Failed:", e.message);
    }
    await browser.close();
}
run();
