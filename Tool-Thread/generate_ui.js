const fs = require('fs');

// Đọc file JSON
const rawData = fs.readFileSync('/Users/wang04/Downloads/threads_full_option_1783106066747.json', 'utf8');

// Khung xương HTML
const htmlTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Threads Viewer - 135 Posts</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #101010;
            --card-bg: #181818;
            --text-main: #F3F5F7;
            --text-dim: #777777;
            --border-color: #333638;
            --accent: #0095F6;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            display: flex;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 600px;
            border-left: 1px solid var(--border-color);
            border-right: 1px solid var(--border-color);
            min-height: 100vh;
        }
        .header {
            padding: 16px;
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
            background-color: rgba(16, 16, 16, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 10;
            text-align: center;
            font-weight: 600;
            font-size: 16px;
        }
        .thread-post {
            padding: 16px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            gap: 12px;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        .thread-post:hover {
            background-color: rgba(255,255,255,0.03);
        }
        .left-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
        }
        .threadline {
            width: 2px;
            flex-grow: 1;
            background-color: var(--border-color);
            border-radius: 2px;
            margin-top: 4px;
        }
        .right-col {
            flex-grow: 1;
            overflow: hidden;
        }
        .author-info {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 4px;
        }
        .username { font-weight: 600; font-size: 15px; }
        .verified { width: 14px; height: 14px; fill: var(--accent); }
        .content-text {
            font-size: 15px;
            line-height: 1.4;
            margin-bottom: 12px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .media-grid {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            border-radius: 12px;
            margin-bottom: 12px;
            scrollbar-width: none;
            scroll-snap-type: x mandatory;
        }
        .media-grid::-webkit-scrollbar { display: none; }
        .media-item {
            border-radius: 12px;
            border: 1px solid var(--border-color);
            max-height: 400px;
            object-fit: cover;
            scroll-snap-align: start;
        }
        .single-media {
            width: 100%;
        }
        .multi-media {
            height: 250px;
            width: auto;
        }
        .interaction-bar {
            display: flex;
            gap: 16px;
            margin-top: 12px;
        }
        .action-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-main);
            font-size: 13px;
            fill: var(--text-main);
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        .action-btn:hover { opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Threads Viewer</div>
        <div id="feed"></div>
    </div>

    <script>
        // Nhúng nguyên 135 post vào thẳng file HTML (bỏ qua bước fetch bị lỗi CORS)
        const threadsData = ${rawData};
        
        const feedContainer = document.getElementById('feed');

        // Bọn icon nhúng dạng SVG cho mượt như App thật
        const heartIcon = \`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path></svg>\`;
        const commentIcon = \`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path></svg>\`;
        const repostIcon = \`<svg viewBox="0 0 24 24" width="20" height="20"><path d="m19.798 10.158-3.08-3.081a1.442 1.442 0 0 0-2.04 2.04l.6.599h-3.951a5.006 5.006 0 0 0-5 5v5.334a1.442 1.442 0 0 0 2.885 0v-5.334a2.124 2.124 0 0 1 2.115-2.116h3.951l-.6.6a1.442 1.442 0 0 0 2.04 2.04l3.08-3.082a1.442 1.442 0 0 0 0-2.04ZM4.202 13.842a1.442 1.442 0 0 0-2.04 0l-3.08 3.082a1.442 1.442 0 0 0 0 2.04l3.08 3.081a1.442 1.442 0 0 0 2.04-2.04l-.6-.6h3.951a5.006 5.006 0 0 0 5-5v-5.334a1.442 1.442 0 0 0-2.885 0v5.334a2.124 2.124 0 0 1-2.115 2.116H5.642l.6-.599a1.442 1.442 0 0 0 0-2.04Z" fill="currentColor"></path></svg>\`;
        const verifiedBadge = \`<svg class="verified" viewBox="0 0 100 100"><path d="M49.9 2L59.1 13H73V27.4L84.5 35.8L81.2 50.4L88 62.5L78.2 73.6L76.5 88H61.6L50.4 97L39.2 88H24.3L22.6 73.6L12.8 62.5L19.6 50.4L16.3 35.8L27.8 27.4V13H41.7L49.9 2Z" fill="currentColor"/><path d="M43.5 73.1L23.9 53.5L31 46.4L43.5 58.9L68.7 33.7L75.8 40.8L43.5 73.1Z" fill="#fff"/></svg>\`;

        let html = '';
        threadsData.forEach(post => {
            if(!post || !post.author) return;
            const author = post.author;
            const content = post.content || {};
            const stats = post.stats || {};

            let mediaHtml = '';
            if (content.media && content.media.length > 0) {
                const isSingle = content.media.length === 1;
                mediaHtml = \`<div class="media-grid">\`;
                content.media.forEach(m => {
                    if (m.type === 'image') {
                        // Thêm loading lazy để lướt mượt ko bị giật
                        mediaHtml += \`<img src="\${m.url}" loading="lazy" class="media-item \${isSingle ? 'single-media' : 'multi-media'}" />\`;
                    } else if (m.type === 'video') {
                        mediaHtml += \`<video src="\${m.url}" controls class="media-item \${isSingle ? 'single-media' : 'multi-media'}"></video>\`;
                    }
                });
                mediaHtml += \`</div>\`;
            }

            html += \`
                <div class="thread-post">
                    <div class="left-col">
                        <img src="\${author.avatar_url || ''}" loading="lazy" class="avatar" />
                        <div class="threadline"></div>
                    </div>
                    <div class="right-col">
                        <div class="author-info">
                            <span class="username">\${author.username || 'unknown'}</span>
                            \${author.is_verified ? verifiedBadge : ''}
                        </div>
                        <div class="content-text">\${content.text || ''}</div>
                        \${mediaHtml}
                        <div class="interaction-bar">
                            <div class="action-btn">\${heartIcon} \${stats.likes || 0}</div>
                            <div class="action-btn">\${commentIcon} \${stats.replies || 0}</div>
                            <div class="action-btn">\${repostIcon} \${stats.reposts || 0}</div>
                        </div>
                    </div>
                </div>
            \`;
        });

        feedContainer.innerHTML = html;
        document.querySelector('.header').innerHTML = \`Threads Viewer (\${threadsData.length} bài đăng)\`;
    </script>
</body>
`;

// Lưu vào thư mục của chồng
fs.writeFileSync('/Users/wang04/Documents/Crawl Thread/Tool-Thread/index.html', htmlTemplate);
console.log("Xong! Đã tạo file index.html thành công.");
