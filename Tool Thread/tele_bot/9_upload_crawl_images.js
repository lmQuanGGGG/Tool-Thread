require('dotenv').config();
const { supabase, uploadMediaBatch } = require('./supabase_helper');

async function processPendingImages() {
  console.log("🚀 Đang khởi động Worker: Tải ảnh từ Crawl Data lên Telegram (S3)...");

  if (!supabase) {
    console.error("❌ Chưa kết nối được Supabase!");
    return;
  }

  try {
    // 1. Tìm các bài viết chưa có image_file_ids nhưng có image_urls
    const { data: posts, error } = await supabase
      .from('crawl_data')
      .select('*')
      .eq('image_file_ids', '{}') // Nghĩa là mảng rỗng
      .neq('image_urls', '{}')   // Nhưng có url ảnh
      .limit(100); // Mỗi mẻ xử lý max 100 bài theo ý sếp

    if (error) {
      console.error("❌ Lỗi khi lấy dữ liệu:", error.message);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log("✅ Không có bài viết nào cần upload ảnh lúc này.");
      return;
    }

    console.log(`⏳ Đang xử lý ${posts.length} bài viết...`);

    for (const post of posts) {
      console.log(`\n👉 Đang xử lý bài: ${post.post_id}`);
      
      const mediaList = post.image_urls.map(url => ({
        url,
        type: url.includes('.mp4') ? 'video' : 'image' // Đoán type dựa trên đuôi file
      }));

      // 2. Upload qua Telegram
      const results = await uploadMediaBatch(mediaList, 2000); // Delay 2s giữa các ảnh
      
      const fileIds = results.map(r => r.file_id).filter(Boolean); // Bỏ các file lỗi (null)

      if (fileIds.length > 0) {
        // 3. Trừ Credit (ví dụ: 1 credit cho 1 file)
        const cost = fileIds.length;
        const { error: rpcError } = await supabase.rpc('adjust_credits', {
          p_user_id: post.user_id,
          p_amount: -cost,
          p_type: 'storage',
          p_description: `Upload ${cost} file media lên Telegram`
        });

        if (rpcError) {
          console.warn(`⚠️ Không thể trừ credit cho user ${post.user_id}:`, rpcError.message);
          // Có thể tài khoản hết tiền, tuỳ logic sếp có muốn chặn hay không.
          // Tạm thời vẫn lưu file_id vào DB.
        }

        // 4. Lưu lại vào DB
        const { error: updateErr } = await supabase
          .from('crawl_data')
          .update({ image_file_ids: fileIds })
          .eq('id', post.id);

        if (updateErr) {
          console.error(`❌ Lỗi update file_ids cho bài ${post.post_id}:`, updateErr.message);
        } else {
          console.log(`✅ Hoàn tất bài ${post.post_id} | Đã lưu ${fileIds.length} file_ids | Tiêu hao ${cost} credits`);
        }
      } else {
        console.warn(`⚠️ Bài ${post.post_id} không tải được ảnh nào!`);
      }
    }
  } catch (e) {
    console.error("💥 Lỗi ngoài ý muốn:", e);
  }
}

// Chạy 1 lần rồi thoát (Dành cho Cronjob hoặc PM2)
processPendingImages().then(() => {
  console.log("👋 Worker hoàn thành chu trình.");
  process.exit(0);
});
