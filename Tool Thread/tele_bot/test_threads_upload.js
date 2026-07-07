const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

(async () => {
    let cookies = [];
    if (fs.existsSync('account_state_1.json')) {
        const raw = JSON.parse(fs.readFileSync('account_state_1.json', 'utf8'));
        let c = { ...raw };
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId; delete c.id; delete c.hostOnly; delete c.session;
        cookies.push({ ...c, domain: '.instagram.com' });
        cookies.push({ ...c, domain: '.threads.net' });
        cookies.push({ ...c, domain: '.threads.com' });
    }

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.setCookie(...cookies);
    console.log("Navigating to threads...");
    await page.goto('https://www.threads.net/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));

    console.log("Looking for reply button...");
    const btn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('div[role="button"]:not([aria-disabled="true"]) > svg[aria-label="Reply"], div[role="button"]:not([aria-disabled="true"]) > svg[aria-label="Trả lời"]'));
        return btns.length;
    });
    console.log("Found reply buttons:", btn);

    if (btn > 0) {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"]:not([aria-disabled="true"]) > svg[aria-label="Reply"], div[role="button"]:not([aria-disabled="true"]) > svg[aria-label="Trả lời"]'));
            let p = btns[0].closest('div[role="button"]') || btns[0].parentElement;
            while(p && p.tagName !== 'DIV') p = p.parentElement;
            if (p) p.click();
        });
        console.log("Clicked reply button. Waiting for dialog...");
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: 'debug_threads_dialog.png' });
        const html = await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            return dialog ? dialog.outerHTML : 'No dialog found';
        });
        fs.writeFileSync('debug_threads_dialog.html', html);
        console.log("Saved debug_threads_dialog.png and html");
    }
    
    await browser.close();
})();
