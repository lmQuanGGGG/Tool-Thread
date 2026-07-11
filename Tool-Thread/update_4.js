const fs = require('fs');
let content = fs.readFileSync('tele_bot/fb_bot/4_fb_shopee_post_story.js', 'utf8');

content = content.replace(
  "const { fetchBotConfig, logToWeb, checkQuota, updateUsageStats } = require('../supabase_helper');",
  "const { fetchBotConfig, logToWeb, checkQuota, updateUsageStats, sendTelegramMessage } = require('../supabase_helper');"
);

content = content.replace(
  "        console.log(`✗ Tài khoản ${email} đã hết giới hạn đăng bài FB hôm nay. Dừng script.`);\n        await logToWeb(email, 'fb-story', `Đã hết giới hạn đăng bài FB hôm nay. Dừng script.`, 'warn');\n        process.exit(0);",
  "        console.log(`✗ Tài khoản ${email} đã hết giới hạn đăng bài FB hôm nay. Dừng script.`);\n        await logToWeb(email, 'fb-story', `Đã hết giới hạn đăng bài FB hôm nay. Dừng script.`, 'warn');\n        if (dbConfig && dbConfig.tele_chat_id) {\n            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Đăng bài FB]</b>\\nTừ chối chạy do đã hết giới hạn đăng bài hôm nay.\\nTài khoản: ${email}`);\n        }\n        process.exit(0);"
);

content = content.replace(
  "    console.log(\"🎉 Hoàn tất chu trình Đăng & Share Shopee!\");\n    await logToWeb(email, 'fb-story', '🎉 Hoàn tất chu trình Đăng & Share Shopee!', 'success');",
  "    console.log(\"🎉 Hoàn tất chu trình Đăng & Share Shopee!\");\n    await logToWeb(email, 'fb-story', '🎉 Hoàn tất chu trình Đăng & Share Shopee!', 'success');\n    if (dbConfig && dbConfig.tele_chat_id) {\n        await sendTelegramMessage(dbConfig.tele_chat_id, `✓ <b>[Bot Đăng bài FB]</b>\\nHoàn thành 1 vòng đăng FB (Post & Story).\\nTài khoản: ${email}`);\n    }"
);

content = content.replace(
  "    } catch (e) {\n        console.error(\"✗ Lỗi trong quá trình đăng bài:\", e.message);\n    }",
  "    } catch (e) {\n        console.error(\"✗ Lỗi trong quá trình đăng bài:\", e.message);\n        if (dbConfig && dbConfig.tele_chat_id) {\n            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Đăng bài FB Lỗi]</b>\\nLỗi: ${e.message}\\nTài khoản: ${email}`);\n        }\n    }"
);

fs.writeFileSync('tele_bot/fb_bot/4_fb_shopee_post_story.js', content);
