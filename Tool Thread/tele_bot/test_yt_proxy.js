const { execSync } = require('child_process');

// Bạn có thể đổi PROXY này thành proxy khác nếu cái này chết (proxy free rất dễ chết)
const PROXY = "http://90.174.128.42:3128"; 
const VIDEO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // Video test ngắn

console.log(`⏳ Đang thử truy cập YouTube qua Proxy: ${PROXY}...`);
console.log(`Lưu ý: Proxy miễn phí có thể kết nối hơi lâu, vui lòng đợi...\n`);

try {
    // Dùng lệnh yt-dlp kèm tham số --proxy
    const cmd = `yt-dlp --proxy "${PROXY}" --dump-json "${VIDEO_URL}"`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    const data = JSON.parse(output);
    
    console.log("✓ THÀNH CÔNG! Đã vượt tường lửa tải được thông tin video:");
    console.log("📺 Tên video:", data.title);
    console.log("👁️ Lượt xem:", data.view_count);
} catch (e) {
    console.log("✗ THẤT BẠI. Proxy này có thể đã chết hoặc quá chậm.");
    console.log("Chi tiết lỗi:", e.stderr || e.message);
}
