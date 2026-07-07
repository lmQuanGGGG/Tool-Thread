const fs = require('fs');
let code = fs.readFileSync('1_fb_puppeteer.js', 'utf8');

code = code.replace(
    /const cmtBtns = await page\.\$\$\('div\[role="button"\]'\);\n\s+let validCmtBtns = \[\];\n\s+for \(let btn of cmtBtns\) \{\n\s+const text = await page\.evaluate\(el => el\.innerText, btn\);\n\s+if \(text === 'Bình luận' \|\| text === 'Comment' \|\| \(text && text\.includes\('Bình luận'\)\)\) \{\n\s+validCmtBtns\.push\(btn\);\n\s+\}\n\s+\}/,
    `const cmtBtns = await page.$$('div[role="button"], div[aria-label*="Bình luận"], div[aria-label*="Comment"]');
            let validCmtBtns = [];
            for (let btn of cmtBtns) {
                const isValid = await page.evaluate(el => {
                    const text = (el.innerText || '').toLowerCase();
                    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
                    return text.includes('bình luận') || text.includes('comment') || aria.includes('bình luận') || aria.includes('comment');
                }, btn);
                if (isValid) {
                    validCmtBtns.push(btn);
                }
            }`
);

fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fixed 1_fb_puppeteer.js button selector");
