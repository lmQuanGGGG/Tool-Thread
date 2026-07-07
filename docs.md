# BÍ KÍP XÂY DỰNG HỆ SINH THÁI MMO SERVERLESS 0 ĐỒNG
*(Tài liệu nội bộ - Đúc kết từ những tư duy lách luật đỉnh cao nhất)*

---

## 1. Kỹ Thuật Crawl Dữ Liệu (Cào Data)
- **Công cụ:** Script `crawl_post_thread_v2.js` (Bản nâng cấp V2).
- **Cơ chế:** Dùng Javascript chạy ngầm trong Console của trình duyệt Chrome. Script sẽ móc thẳng vào API GraphQL nội bộ của Meta (Threads), tự động lướt và thu thập toàn bộ dữ liệu (Text, Lượt thả tim, Link Ảnh gốc 4K, Video).
- **Cách dùng:** 
  1. Mở trang cá nhân Threads của mục tiêu.
  2. Bấm F12 mở Developer Tools -> Tab Console.
  3. Dán toàn bộ Code vào và bấm Enter.
  4. Đợi Script cào xong sẽ tự động tải về file `threads_full_option_...json`.

## 2. Giải Bài Toán Lưu Trữ (Dùng Telegram làm S3 Free)
- **Nỗi đau:** Các link ảnh gốc cào từ Threads sẽ bị Meta đổi mã (die link) sau vài ngày. Nếu tải về máy tính thì tốn ổ cứng và tốn tiền Server.
- **Giải pháp:** Sử dụng Script `1_mass_uploader.js` làm cầu nối. Script này tự động lấy các link ảnh bị die, ném thẳng lên một Group Kín trên Telegram dưới định dạng "Document" (Để không bị nén ảnh).
- **Thành quả:** Telegram trả về mã `file_id` bất tử. Lúc này, Telegram chính thức trở thành một ổ đĩa Cloud Storage (S3) vô hạn dung lượng, băng thông vô cực, tải ảnh siêu tốc độ mà **không tốn 1 cắc**.

## 3. Kiến Trúc "Nông Trại" Auto-Post
Hệ thống đăng bài hoàn toàn tự động, phi tập trung và không cần treo máy.

- **Cánh tay (Github Actions):** Lưu trữ Script Puppeteer. Nó sẽ mở các trình duyệt ảo ẩn danh, dùng Cookie (lưu trong bảo mật Github Secrets) để đăng nhập đa tài khoản cùng lúc. Tự bốc dữ liệu JSON và tải ảnh từ Tele về để đăng bài. Đăng xong tự Commit lưu trạng thái.
- **Bộ não (Cloudflare Workers):** Một hàm Webhook nằm trên Serverless của Cloudflare (Miễn phí 100.000 lượt request/ngày). Trực chiến 24/24 lắng nghe lệnh từ Telegram (VD: `/postnow all`). Nhận lệnh xong sẽ đánh điện kích hoạt Cánh tay Github chạy.
- **Phân Luồng Ngách (Niche Routing):** Đánh dấu Tag cho từng nick (VD: đồ nữ, drama). Nick nào sẽ tự động chui vào kho JSON của đúng chủ đề đó để bốc bài. Tránh râu ông nọ cắm cằm bà kia.

## 4. Nghệ Thuật Nuôi Nick & Buff Tương Tác
- **Ngâm nick (Warm-up 14 ngày):** Tool có bộ đếm ngày tuổi. 14 ngày đầu lập nick, Tool KHÔNG dán link Affiliate, chỉ đăng bài mồi để kéo "Độ Trust" (Độ tin cậy) từ AI của Meta. Sang ngày 15 tự động mở khóa chèn link Shopee kiếm tiền.
- **Seeding Chéo (Buff Follow Free):** Tận dụng Nông trại nick clone. Các nick sẽ tự động "thăm hỏi" lẫn nhau: tự follow, thả tim và dải comment mồi vào bài của nhau. Mắt trần nhìn vào y hệt một bài viết đang Hot. Kết hợp thả tim dạo để câu Follow thực tế.

## 5. Mở Rộng: Database Vĩnh Cửu (Supabase + Trick Cron Job)
*(Dành cho các Web/App vệ tinh nhỏ sau này)*

- **Kiến trúc Combo:** Supabase (Lưu Text/JSON) + Telegram (Lưu Ảnh).
- **Sức mạnh Supabase:** Là PostgreSQL xịn sò. Lượt Request đọc/ghi là VÔ HẠN (đập bẹp Firebase). Miễn phí 500MB lưu trữ Text và 2GB Băng thông tháng.
- **Trick Ma Giáo:** Supabase bản Free có luật "Ngủ đông" nếu 1 tuần web không có ai truy cập. Khắc phục bằng cách viết 1 con Bot nhỏ hoặc dùng Cron-Job.org, cài đặt mỗi ngày tự động "chọc" (Ping) vào Database 1 lần. 
- **Kết quả:** Đánh lừa hệ thống, giữ Database thức vĩnh viễn tạo thành hệ thống Server siêu mạnh mẽ với chi phí trọn đời bằng 0.

## 6. Mở Rộng: Kéo ảnh từ Tele hiển thị lên Web an toàn (Proxy API)
- **Cái Ngu (Vấn đề):** Nếu dùng API `getFile` của Telegram để lấy link ảnh trực tiếp (`api.telegram.org/file/bot<TOKEN>/...`), Hacker ấn F12 xem mã nguồn Web sẽ chôm được TOKEN và cướp luôn con Bot.
- **Giải Pháp (Trick lỏ thành API xịn):** 
  1. Xây 1 API trung gian (Backend hoặc Cloudflare Workers) với đường dẫn: `domain.com/api/get-image?id=file_id`.
  2. Thẻ HTML trên Web gọi: `<img src="domain.com/api/get-image?id=BQACAg...">`.
  3. API Backend đứng giữa sẽ giấu Token, tự động gọi qua Telegram kéo file ảnh (binary) về và truyền thẳng (Stream) ra cho trình duyệt hiển thị.
  4. **Kết quả:** Khách xem ảnh tốc độ siêu nhanh (nhờ CDN của Tele), Hacker khóc thét vì không thể mò ra Token của Bot.

---
*Lưu ý: Bí kíp này mang đậm tính "Ma giáo" và tư duy hệ thống của dân MMO thực chiến, không phổ biến ra ngoài!*
ytcfg.get('VISITOR_DATA')
