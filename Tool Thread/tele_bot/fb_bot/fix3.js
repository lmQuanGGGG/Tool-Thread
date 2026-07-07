const fs = require('fs');
let code = fs.readFileSync('1_fb_puppeteer.js', 'utf8');

code = code.replace(
    'console.log(`[INFO] Tìm thấy ${validCmtBtns.length} bài viết có thể comment.`);',
    `console.log(\`[INFO] Tìm thấy \${validCmtBtns.length} bài viết có thể comment.\`);
            if (validCmtBtns.length === 0) {
                await page.screenshot({ path: \`debug_no_btn_\${Date.now()}.png\` });
            }`
);

fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fixed 1_fb_puppeteer.js no btn debug");
