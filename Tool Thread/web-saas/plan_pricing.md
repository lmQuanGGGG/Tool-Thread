# Cập nhật thông tin các gói cước

## 1. Cập nhật Database & Migration
- Thêm cột `fb_comment_per_day` vào bảng `tier_limits` trong Supabase.
- Cập nhật số liệu các gói cước trong Database theo yêu cầu mới.
- Cập nhật file `supabase_migration.sql` với cấu trúc cột và dữ liệu mới.
- Cập nhật object `defaults` trong `tele_bot/supabase_helper.js`.

**Số liệu chi tiết:**
- **Free:** 2 Reels, 1 FB Post, 10 FB Cmt, 10 Threads Cmt, 2 Links
- **Lite:** 3 Reels, 3 FB Post, 15 FB Cmt, 30 Threads Cmt, 4 Links
- **Plus:** 6 Reels, 5 FB Post, 35 FB Cmt, 80 Threads Cmt (giữ nguyên Threads Plus hiện tại), 10 Links
- **Pro:** 12 Reels, 10 FB Post, 70 FB Cmt, 160 Threads Cmt, 20 Links (gấp đôi Plus)
- **Promax:** Không giới hạn (-1)

## 2. Nâng cấp Giao diện Pricing (`pricing/page.tsx`)
- Đổi cách hiển thị quota từ dạng Grid 2x2 thành dạng danh sách dọc (hoặc thiết kế lại sao cho rõ ràng, dễ đọc hơn khi có 5 thông số).
- Cập nhật lại mảng `TIERS` với các dữ liệu mới.
