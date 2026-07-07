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
    await page.evaluate(() => window.scrollBy(0, 800));
    await delay(3000);
    
    // Tìm và bấm nút comment
    const cmtBtns = await page.$$('div[role="button"]');
    let targetBtn = null;
    for (let btn of cmtBtns) {
        const isValid = await page.evaluate(el => {
            const text = el.innerText || '';
            const aria = el.getAttribute('aria-label') || '';
            return text === 'Bình luận' || aria === 'Bình luận' || aria === 'Viết bình luận';
        }, btn);
        if (isValid) { targetBtn = btn; break; }
    }

    if (targetBtn) {
        console.log("Bấm nút comment...");
        await targetBtn.click();
        await delay(3000);
        
        console.log("Tìm nút Đính kèm ảnh...");
        const commentBoxSelector = 'div[role="textbox"]';
        const boxes = await page.$$(commentBoxSelector);
        
        if (boxes.length > 0) {
             const targetBox = boxes[0];
             // Dump icons quanh ô nhập
             const iconData = await page.evaluate((box) => {
                 let parent = box;
                 let foundIcons = [];
                 for(let k=0; k<6; k++) {
                     if(!parent) break;
                     const fileIcons = Array.from(parent.querySelectorAll('div[aria-label*="ảnh"], div[aria-label*="photo"], div[aria-label*="Ảnh"], div[aria-label*="Photo"], i[data-visualcompletion="css-img"]'));
                     if (fileIcons.length > 0) {
                         foundIcons = fileIcons.map(ic => ({
                             aria: ic.getAttribute('aria-label'),
                             className: ic.className,
                             tagName: ic.tagName
                         }));
                         break;
                     }
                     parent = parent.parentElement;
                 }
                 return foundIcons;
             }, targetBox);
             
             console.log(JSON.stringify(iconData, null, 2));
        }
    }
    await browser.close();
})();
