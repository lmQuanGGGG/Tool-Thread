/**
 * TOOL CÀO DATA INSTAGRAM (API V1) - DÀNH CHO HỆ SINH THÁI MMO
 * Hướng dẫn sử dụng:
 * 1. Đăng nhập 1 nick Instagram Clone trên trình duyệt Chrome.
 * 2. Vào trang cá nhân của mục tiêu (Ví dụ: https://www.instagram.com/cristiano/)
 * 3. Ấn F12 -> Mở tab Console -> Dán toàn bộ Code này vào và ấn Enter.
 * 4. Đợi script chạy và tự động tải file JSON về máy. File này dùng chung form với Threads.
 */

(async () => {
    console.log("%c🚀 BẮT ĐẦU KHỞI ĐỘNG HỆ THỐNG CÀO DATA INSTAGRAM...", "color: #00ff00; font-size: 20px; font-weight: bold;");

    // 1. Lấy Username từ URL hiện tại
    const pathParts = window.location.pathname.split('/').filter(p => p);
    if (pathParts.length === 0) {
        alert("LỖI: Vui lòng vào trang cá nhân của một người dùng Instagram để cào!");
        return;
    }
    const targetUsername = pathParts[0];
    console.log(`[INFO] Đang nhắm mục tiêu: @${targetUsername}`);

    let allPosts = [];
    let hasNextPage = true;
    let nextMaxId = "";
    const IG_APP_ID = "936619743392459"; // App ID mặc định của Instagram Web
    let pageCount = 1;

    try {
        // Vòng lặp lấy data qua API
        while (hasNextPage && allPosts.length < 500) { // Đặt max 500 bài để tránh bị ban
            console.log(`⏳ Đang cào trang thứ ${pageCount}... (Đã gom được ${allPosts.length} bài)`);
            
            const apiUrl = `/api/v1/feed/user/${targetUsername}/username/?count=30${nextMaxId ? '&max_id=' + nextMaxId : ''}`;
            const res = await fetch(apiUrl, {
                headers: {
                    "x-ig-app-id": IG_APP_ID,
                    "accept": "*/*"
                }
            });

            if (!res.ok) {
                console.error("[ERROR] Bị Instagram chặn hoặc lỗi mạng. Chờ 5s rồi thử lại...");
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            const data = await res.json();
            const items = data.items || [];
            
            if (items.length === 0) break;

            for (let item of items) {
                // Xử lý caption
                let captionText = "";
                if (item.caption && item.caption.text) {
                    captionText = item.caption.text;
                }

                // Xử lý Media (Ảnh/Video)
                let mediaList = [];
                
                // Nếu là dạng Carousel (Nhiều ảnh/video lướt ngang)
                if (item.carousel_media) {
                    for (let cMedia of item.carousel_media) {
                        if (cMedia.video_versions && cMedia.video_versions.length > 0) {
                            mediaList.push({
                                type: "video",
                                url: cMedia.video_versions[0].url
                            });
                        } else if (cMedia.image_versions2 && cMedia.image_versions2.candidates.length > 0) {
                            mediaList.push({
                                type: "image",
                                url: cMedia.image_versions2.candidates[0].url
                            });
                        }
                    }
                } 
                // Nếu là Bài đơn (Chỉ 1 Ảnh hoặc 1 Video)
                else {
                    if (item.video_versions && item.video_versions.length > 0) {
                        mediaList.push({
                            type: "video",
                            url: item.video_versions[0].url
                        });
                    } else if (item.image_versions2 && item.image_versions2.candidates.length > 0) {
                        mediaList.push({
                            type: "image",
                            url: item.image_versions2.candidates[0].url
                        });
                    }
                }

                // Ép kiểu Data cho giống chuẩn JSON của luồng Threads (để Bot Tele đọc được luôn)
                const formattedPost = {
                    post_id: item.pk,
                    timestamp: item.taken_at, // Lấy thời gian đăng bài (Unix Timestamp)
                    post_url: `https://www.instagram.com/p/${item.code}/`,
                    author: {
                        username: item.user.username,
                        full_name: item.user.full_name,
                        is_verified: item.user.is_verified,
                        avatar_url: item.user.profile_pic_url
                    },
                    content: {
                        text: captionText,
                        media: mediaList
                    },
                    stats: {
                        likes: item.like_count || 0,
                        replies: item.comment_count || 0,
                        reposts: 0,
                        quotes: 0
                    }
                };

                allPosts.push(formattedPost);
            }

            // Chuyển trang
            hasNextPage = data.more_available;
            nextMaxId = data.next_max_id;
            pageCount++;

            // Delay random từ 2-4 giây để giống người thật, tránh bị block
            const delayTime = Math.floor(Math.random() * 2000) + 2000;
            await new Promise(r => setTimeout(r, delayTime));
        }

        // Chống trùng lặp bài viết (Lọc theo post_id)
        const uniquePosts = Array.from(new Map(allPosts.map(item => [item.post_id, item])).values());
        
        console.log(`%c🎉 HOÀN TẤT! Đã cào thành công ${uniquePosts.length} bài viết (đã lọc trùng) của @${targetUsername}.`, "color: #00ff00; font-size: 16px; font-weight: bold;");

        // 3. Tải file JSON xuống máy tính
        const fileName = `instagram_farm_${targetUsername}_${Date.now()}.json`;
        const blob = new Blob([JSON.stringify(uniquePosts, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("%c[FATAL ERROR] Lỗi bung bét trong quá trình cào:", "color: red; font-size: 16px;", error);
    }
})();
