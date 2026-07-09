const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const axios = require('axios');
const fs = require('fs');

async function download() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Using an alternative API or site
    // Try yt1s.com or api
    console.log("Navigating to cobalt alternative or similar...");
    // Let's try to just use an open API like https://www.y2mate.com/en885
    await page.goto('https://www.y2mate.com/en885', { waitUntil: 'networkidle2' });
    
    await page.type('#txt-url', 'https://www.youtube.com/watch?v=aj38LViraNc');
    await page.click('#btn-submit');
    
    console.log("Waiting for results...");
    try {
        await page.waitForSelector('#mp4 table tbody tr td a', { timeout: 10000 });
        const downloadLink = await page.evaluate(() => {
            const btn = document.querySelector('#mp4 table tbody tr:nth-child(1) td a');
            return btn ? btn.href : null;
        });
        console.log("Download link:", downloadLink);
    } catch(e) {
        console.log("Failed to get link", e.message);
    }
    
    await browser.close();
}
download();
