const axios = require('axios');
const fs = require('fs');
const urls = [
  "https://www.facebook.com/topcomments.vn",
  "https://www.facebook.com/Theanh28",
  "https://www.facebook.com/chuyencuahanoi",
  "https://www.facebook.com/khongsocho.official",
  "https://www.facebook.com/beatvn.network",
  "https://www.facebook.com/welax.vn",
  "https://www.facebook.com/Kenh14.vn",
  "https://www.facebook.com/yan.tintuc",
  "https://www.facebook.com/hong.tintuc",
  "https://www.facebook.com/thangfly",
  "https://www.facebook.com/GocThuGian.net",
  "https://www.facebook.com/1977vlog",
  "https://www.facebook.com/groups/nghienshopee",
  "https://www.facebook.com/groups/yeubepghiennha",
  "https://www.facebook.com/groups/tamsueva",
  "https://www.facebook.com/groups/chuyencongso",
  "https://www.facebook.com/groups/nghiennha"
];

async function checkUrl(url) {
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 5000
        });
        if (res.status === 200 && !res.data.includes("This content isn't available right now")) {
            return true;
        }
    } catch(e) {}
    return false;
}

async function main() {
    let valid = [];
    for (let u of urls) {
        if (await checkUrl(u)) {
            console.log("OK: " + u);
            valid.push(u);
        } else {
            console.log("FAIL: " + u);
        }
    }
    fs.writeFileSync('fb_targets.json', JSON.stringify(valid, null, 2));
    console.log("Done checking!");
}
main();
