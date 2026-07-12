import puppeteer from 'puppeteer';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

(async () => {
  console.log('Khởi chạy trình duyệt...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log('Đang mở trang Shopee Affiliate...');
  await page.goto('https://affiliate.shopee.vn/offer/product_offer', { waitUntil: 'networkidle2' });

  console.log('\n=============================================');
  console.log('🚨 VUI LÒNG ĐĂNG NHẬP TRÊN TRÌNH DUYỆT 🚨');
  console.log('Sau khi đăng nhập thành công và thấy giao diện Affiliate,');
  console.log('hãy quay lại cửa sổ Terminal này để tiếp tục.');
  console.log('=============================================\n');

  await askQuestion('Nhấn [ENTER] khi chồng đã đăng nhập xong: ');

  while (true) {
    const productUrl = await askQuestion('\nNhập link sản phẩm Shopee cần chuyển đổi (hoặc gõ "exit" để thoát): ');
    
    if (productUrl.trim().toLowerCase() === 'exit') {
        break;
    }

    if (!productUrl.trim()) continue;

    console.log(`Đang xử lý link: ${productUrl}...`);
    try {
      if (!page.url().includes('product_offer')) {
          await page.goto('https://affiliate.shopee.vn/offer/product_offer', { waitUntil: 'networkidle2' });
      }

      // 1. Tìm ô nhập link và dán link vào
      const inputSelector = 'input[type="text"]'; 
      await page.waitForSelector(inputSelector, { timeout: 10000 });
      
      const inputs = await page.$$(inputSelector);
      let inputElement = inputs[0]; 
      
      await inputElement.click({ clickCount: 3 });
      await inputElement.press('Backspace');
      await inputElement.type(productUrl.trim());

      // 2. Bấm nút "Lấy link"
      const btnSelector = 'button::-p-text(Lấy link), button::-p-text(Get Link)';
      await page.waitForSelector(btnSelector, { timeout: 5000 });
      await page.click(btnSelector);

      // 3. Chờ popup hiện ra và trích xuất link Affiliate
      console.log('Đang chờ hệ thống render link rút gọn...');
      const resultSelector = 'input[value*="shopee.vn"], input[value*="shope.ee"], input[value*="shp.ee"]';
      await page.waitForSelector(resultSelector, { timeout: 15000 });
      
      const affiliateLink = await page.$eval(resultSelector, el => el.value);
      
      console.log('\n🎉 THÀNH CÔNG! Link Affiliate của chồng đây:');
      console.log('👉 ' + affiliateLink + ' 👈\n');

      // Tắt modal để sẵn sàng cho link tiếp theo
      const closeBtn = 'button::-p-text(Hủy), button::-p-text(Cancel), i[class*="close"]';
      try {
          await page.waitForSelector(closeBtn, { timeout: 2000 });
          await page.click(closeBtn);
      } catch (e) {}
      
    } catch (error) {
      console.log('❌ Có lỗi xảy ra trong quá trình xử lý DOM. Khả năng cao giao diện Shopee đã thay đổi cấu trúc thẻ HTML.');
      console.log('Chi tiết lỗi:', error.message);
      
      const errorImg = `error_${Date.now()}.png`;
      await page.screenshot({ path: errorImg });
      console.log(`Đã lưu ảnh chụp màn hình lúc lỗi vào file: ${errorImg}. Chồng gửi ảnh này cho em xem để em fix code ngay nhé!`);
    }
  }

  console.log('Đang đóng trình duyệt...');
  await browser.close();
  rl.close();
})();
