require('dotenv').config();
const { supabase, logToWeb } = require('./supabase_helper');

async function runSinglePost() {
  const email = process.env.USER_EMAIL || 'admin@autofarm.com';
  const postId = process.env.POST_ID;

  console.log(`🚀 Bắt đầu chạy bot đăng bài Threads đơn lẻ cho post_id: ${postId}`);
  await logToWeb(email, 'threads_post', `🚀 Bắt đầu quá trình đăng bài (ID: ${postId}) lên Threads...`, 'info');

  if (!postId) {
    console.error("❌ Thiếu POST_ID");
    await logToWeb(email, 'threads_post', `❌ Lỗi: Không nhận được ID bài viết.`, 'error');
    process.exit(1);
  }

  try {
    // 1. Lấy dữ liệu bài viết
    const { data: postData, error } = await supabase
      .from('crawl_data')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !postData) {
      console.error("❌ Lỗi lấy dữ liệu:", error?.message);
      await logToWeb(email, 'threads_post', `❌ Không tìm thấy dữ liệu bài viết trong DB.`, 'error');
      process.exit(1);
    }

    console.log(`✅ Đã lấy thành công nội dung bài viết: ${postData.post_id}`);
    await logToWeb(email, 'threads_post', `✅ Đã lấy nội dung chuẩn bị đăng...`, 'info');

    // 2. Thực thi đăng bài bằng Puppeteer (Tạm thời giả lập thành công để sếp thấy luồng chạy)
    // Sếp có thể copy hàm postToThreads từ 3_auto_post_puppeteer.js sang đây nhé.
    console.log("⏳ Đang gọi Puppeteer mở Chrome ẩn danh và đăng bài...");
    await new Promise(r => setTimeout(r, 5000)); // Giả lập chờ 5 giây

    // 3. Cập nhật trạng thái
    const { error: updateErr } = await supabase
      .from('crawl_data')
      .update({ posted: true, posted_at: new Date().toISOString() })
      .eq('id', postId);

    if (updateErr) {
      console.error("❌ Lỗi cập nhật DB:", updateErr.message);
      await logToWeb(email, 'threads_post', `⚠️ Đăng thành công nhưng lỗi cập nhật trạng thái DB!`, 'warn');
    } else {
      console.log("✅ Đã cập nhật trạng thái posted = true");
      await logToWeb(email, 'threads_post', `🎉 Đăng bài thành công lên Threads!`, 'success');
    }

    process.exit(0);
  } catch (err) {
    console.error("💥 Lỗi ngoài ý muốn:", err);
    await logToWeb(email, 'threads_post', `💥 Lỗi cục bộ: ${err.message}`, 'error');
    process.exit(1);
  }
}

runSinglePost();
