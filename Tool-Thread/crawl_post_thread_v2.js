(function () {
    console.clear();
    console.log("%c🚀 BẢN NÂNG CẤP: TOOL CÀO THREADS TỰ ĐỘNG CUỘN", "color: #00ff00; font-size: 20px; font-weight: bold;");

    window.rawThreadsData = [];

    // Hook Fetch & XHR (Mở rộng điều kiện bắt data)
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        if (url.includes('graphql')) {
            const clone = response.clone();
            clone.text().then(text => {
                const chunks = text.split('\n');
                chunks.forEach(chunk => {
                    try {
                        const json = JSON.parse(chunk);
                        const str = JSON.stringify(json);
                        // Bắt cả bài đăng lẫn reply
                        if (str.includes('thread_items') || str.includes('text_post_app_info')) {
                            window.rawThreadsData.push(json);
                            console.log(`%c[+] Bắt được 1 mẻ data! (Tổng: ${window.rawThreadsData.length})`, "color: #00a8ff");
                        }
                    } catch (e) { }
                });
            }).catch(e => { });
        }
        return response;
    };

    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    XHR.open = function (method, url) {
        this._reqUrl = url;
        return open.apply(this, arguments);
    };
    XHR.send = function () {
        this.addEventListener('load', function () {
            if (this._reqUrl && this._reqUrl.includes('graphql')) {
                try {
                    const chunks = this.responseText.split('\n');
                    chunks.forEach(chunk => {
                        try {
                            const json = JSON.parse(chunk);
                            const str = JSON.stringify(json);
                            if (str.includes('thread_items') || str.includes('text_post_app_info')) {
                                window.rawThreadsData.push(json);
                                console.log(`%c[+] Bắt được 1 mẻ data! (Tổng: ${window.rawThreadsData.length})`, "color: #fbc531");
                            }
                        } catch (e) { }
                    });
                } catch (e) { }
            }
        });
        return send.apply(this, arguments);
    };

    console.log("✓ Đã cài Hook thành công!");
    console.log("👉 NHỚ LÀM TRICK: Chuyển qua tab 'Câu trả lời' rồi quay lại tab 'Threads' để bắt bài mới nhất nha chồng!");
    console.log("👉 Gõ lệnh này để Tool TỰ ĐỘNG CUỘN TRANG (đổi số 30 thành số trang chồng muốn):");
    console.log("%cautoScrape(30)", "background: #2f3640; color: #4cd137; padding: 5px; font-size: 16px; border-radius: 4px;");

    // TÍNH NĂNG MỚI: Tự động cuộn trang
    window.autoScrape = async function (maxScrolls = 20) {
        console.log(`🤖 Bắt đầu auto-scroll ${maxScrolls} nhịp... Chồng bỏ tay ra uống ngụm nước nhé!`);
        for (let i = 0; i < maxScrolls; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 2000)); // Đợi 2 giây cho mỗi nhịp cuộn để GraphQL load
            console.log(`Đã cuộn ${i + 1}/${maxScrolls} nhịp...`);
        }
        console.log("Đã cuộn tới đáy! Đang xuất file JSON...");
        window.downloadCleanData();
    };

    window.downloadCleanData = function () {
        if (window.rawThreadsData.length === 0) {
            console.warn("⚠ Khoan, chưa bắt được data nào cả. Chồng làm lại trick chuyển tab đi!");
            return;
        }

        const cleanData = [];

        function extractFullData(node) {
            if (Array.isArray(node)) {
                node.forEach(extractFullData);
            } else if (node && typeof node === 'object') {
                if (node.post && node.post.user) {
                    const post = node.post;
                    const mediaList = [];

                    const extractMedia = (mediaItem) => {
                        if (mediaItem.image_versions2?.candidates?.length > 0) {
                            mediaList.push({ type: 'image', url: mediaItem.image_versions2.candidates[0].url });
                        }
                        if (mediaItem.video_versions?.length > 0) {
                            mediaList.push({ type: 'video', url: mediaItem.video_versions[0].url });
                        }
                    };

                    if (post.carousel_media) {
                        post.carousel_media.forEach(extractMedia);
                    } else {
                        extractMedia(post);
                    }

                    cleanData.push({
                        post_id: post.id || post.pk,
                        timestamp: post.taken_at,
                        post_url: post.code ? `https://www.threads.net/@${post.user.username}/post/${post.code}` : null,
                        author: {
                            username: post.user.username,
                            full_name: post.user.full_name,
                            is_verified: post.user.is_verified,
                            avatar_url: post.user.profile_pic_url
                        },
                        content: {
                            text: post.caption?.text || "",
                            media: mediaList
                        },
                        stats: {
                            likes: post.like_count || 0,
                            replies: post.text_post_app_info?.direct_reply_count || 0,
                            reposts: post.text_post_app_info?.repost_count || 0,
                            quotes: post.text_post_app_info?.quote_count || 0
                        }
                    });
                }
                Object.values(node).forEach(extractFullData);
            }
        }

        extractFullData(window.rawThreadsData);
        const uniqueData = Array.from(new Map(cleanData.map(item => [item.post_id, item])).values());

        const blob = new Blob([JSON.stringify(uniqueData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `threads_full_option_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log(`\n🎉 BÙM! Trúng mánh! Đã cào sạch sẽ ${uniqueData.length} bài đăng!`);
    };
})();
