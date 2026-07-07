const fs = require('fs');
let code = fs.readFileSync('1_fb_puppeteer.js', 'utf8');

const oldScroll = `        await page.evaluate(() => window.scrollBy(0, 800));
        await delay(3000);`;

const newScroll = `        // Cuộn xuống nhiều lần để load khoảng 10 bài viết
        for (let s = 0; s < 5; s++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await delay(2000);
        }`;

code = code.replace(oldScroll, newScroll);

// Skip the first 1 or 2 posts if possible (to avoid pinned posts/ads)
const oldLoop = `            for (let i = 0; i < validBoxes.length; i++) {
                if (commentedCount >= postsToComment) break;
                
                let targetBox = validBoxes[i];`;

const newLoop = `            // Xáo trộn danh sách bài viết (bỏ qua 1-2 bài đầu tiên vì thường là quảng cáo / ghim)
            if (validBoxes.length > 2) {
                validBoxes = validBoxes.slice(2); // Cắt bỏ 2 bài đầu
            }
            // Shuffle
            validBoxes = validBoxes.sort(() => 0.5 - Math.random());

            for (let i = 0; i < validBoxes.length; i++) {
                if (commentedCount >= postsToComment) break;
                
                let targetBox = validBoxes[i];`;

code = code.replace(oldLoop, newLoop);

fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fixed 1_fb_puppeteer.js scrolling and randomizing");
