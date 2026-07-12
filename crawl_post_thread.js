(function () {
    console.clear();
    console.log("%c🚀 KHỞI ĐỘNG TOOL CÀO THREADS (BẢN FULL OPTION)", "color: #00ff00; font-size: 20px; font-weight: bold;");

    window.rawThreadsData = []; // Kho chứa data gốc

    // 1. Hook Fetch
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
                        if (JSON.stringify(json).includes('thread_items')) {
                            window.rawThreadsData.push(json);
                            console.log(`%c[+] Bắt được 1 cụm bài từ Fetch! (Tổng: ${window.rawThreadsData.length} cụm)`, "color: #00a8ff");
                        }
                    } catch (e) { }
                });
            }).catch(e => { });
        }
        return response;
    };

    // 2. Hook XHR
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
                            if (JSON.stringify(json).includes('thread_items')) {
                                window.rawThreadsData.push(json);
                                console.log(`%c[+] Bắt được 1 cụm bài từ XHR! (Tổng: ${window.rawThreadsData.length} cụm)`, "color: #fbc531");
                            }
                        } catch (e) { }
                    });
                } catch (e) { }
            }
        });
        return send.apply(this, arguments);
    };

    console.log("✓ Đã cài Hook thành công!");
    console.log("👉 BƯỚC 1: Dùng chuột cuộn trang xuống từ từ để tải thêm bài.");
    console.log("👉 BƯỚC 2: Khi thấy đủ, gõ lệnh này rồi Enter để trích xuất & tải Data Sạch về:");
    console.log("%cdownloadCleanData()", "background: #2f3640; color: #4cd137; padding: 5px; font-size: 16px; border-radius: 4px;");

    // 3. Hàm Siêu Trích Xuất & Lọc Data
    window.downloadCleanData = function () {
        if (window.rawThreadsData.length === 0) {
            console.warn("⚠ Chưa bắt được data. Chồng cuộn trang xuống cho web nó chạy đi đã!");
            return;
        }

        const cleanData = [];

        // Đệ quy moi ruột JSON
        function extractFullData(node) {
            if (Array.isArray(node)) {
                node.forEach(extractFullData);
            } else if (node && typeof node === 'object') {
                if (node.post && node.post.user) {
                    const post = node.post;
                    const mediaList = [];

                    // Logic mổ xẻ bốc hình xịn
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

                    // Nhồi vô object
                    cleanData.push({
                        post_id: post.id || post.pk,
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

        // Bắt đầu bóc tách
        extractFullData(window.rawThreadsData);

        // Lọc trùng lặp bằng thuật toán Map
        const uniqueData = Array.from(new Map(cleanData.map(item => [item.post_id, item])).values());

        // Tung file ra cho chồng
        const blob = new Blob([JSON.stringify(uniqueData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `threads_full_option_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log(`\n🎉 BÙM! Đã bóc tách & tải xong ${uniqueData.length} bài đăng siêu nét! Mở file lên check hàng nào!`);
    };
})();
