module.exports = {
  apps: [
    {
      name: "fb-reels-farmer",
      script: "./7_yt_to_fb_reels.js",
      cron_restart: "15 11,14,16,20,22 * * 1-5", 
      autorestart: false,
      watch: false
    },
    {
      name: "thread-quanao-farmer",
      script: "./3_auto_post_puppeteer.js",
      cron_restart: "0 17 * * 1-5", 
      autorestart: false,
      watch: false,
      env: { NICK_INDEX: "1" }
    },
    {
      name: "thread-drama-farmer",
      script: "./3_auto_post_puppeteer.js",
      cron_restart: "0 17 * * 1-5", 
      autorestart: false,
      watch: false,
      env: { NICK_INDEX: "2" }
    },
    {
      name: "thread-drama-ig-farmer",
      script: "./3_auto_post_puppeteer.js",
      autorestart: false,
      watch: false,
      env: { NICK_INDEX: "3" }
    },
    {
      name: "fb-puppeteer-farmer",
      script: "./fb_bot/1_fb_puppeteer.js",
      cron_restart: "15 11,14,16,20,22 * * 1-5", 
      autorestart: false,
      watch: false
    },
    {
      name: "fb-story-farmer",
      script: "./fb_bot/4_fb_shopee_post_story.js",
      cron_restart: "15 11,14,16,20,22 * * 1-5", 
      autorestart: false,
      watch: false
    },
    {
      name: "shopee-scraper-farmer",
      script: "./fb_bot/5_shopee_bulk_scraper.js",
      autorestart: false,
      watch: false
    },
    {
      name: "th-cmt-farmer-1",
      script: "./8_threads_auto_comment.js",
      autorestart: false,
      watch: false,
      env: { NICK_INDEX: "1" }
    },
    {
      name: "th-cmt-farmer-2",
      script: "./8_threads_auto_comment.js",
      autorestart: false,
      watch: false,
      env: { NICK_INDEX: "2" }
    },
    {
      name: "tele-control-panel",
      script: "./2_tele_control_panel.js",
      autorestart: true,
      watch: false
    }
  ]
};
