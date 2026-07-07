const puppeteer = require('puppeteer');
require('dotenv').config();
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    let cookies = JSON.parse(process.env.COOKIE_ACC1).map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId; delete c.id; delete c.hostOnly; delete c.session;
        return c;
    });

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    
    console.log("Navigating...");
    await page.goto('https://www.threads.net/', { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(5000);
    
    const replyBtns = await page.$$('svg[aria-label="Comment"], svg[aria-label="Bình luận"], svg[aria-label="Trả lời"], svg[aria-label="Reply"]');
    console.log("Tìm thấy", replyBtns.length, "nút comment");
    
    if (replyBtns.length > 0) {
        await page.evaluate(el => {
            let parent = el.parentElement;
            while(parent && parent.tagName !== 'DIV') {
                parent = parent.parentElement;
            }
            if(parent) parent.click();
        }, replyBtns[0]);
        await delay(3000);
        
        const labels = await page.evaluate(() => {
            const svgs = Array.from(document.querySelectorAll('svg'));
            return Array.from(new Set(svgs.map(s => s.getAttribute('aria-label')).filter(l => l)));
        });
        console.log("All SVG aria-labels:", labels);
    }
    
    await browser.close();
})();
