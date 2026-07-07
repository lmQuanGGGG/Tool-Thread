import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, botType = 'reels' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO; // Định dạng: owner/repo (Ví dụ: tuantran/autofarm)

    if (!githubToken || !githubRepo) {
      return NextResponse.json({ 
        error: 'Chưa cấu hình GITHUB_TOKEN hoặc GITHUB_REPO trong file .env.local' 
      }, { status: 500 });
    }

    // Map botType sang tên file workflow
    let workflowId = 'reels_worker.yml';
    if (botType === 'reels') workflowId = 'reels_worker.yml';
    if (botType === 'threads') workflowId = 'threads_comment_worker.yml';
    if (botType === 'fb') workflowId = 'fb_worker.yml';
    if (botType === 'farm') workflowId = 'farm_worker.yml';
    if (botType === 'shopee') workflowId = 'shopee_worker.yml';
    if (botType === 'parse_links') workflowId = 'parse_links_worker.yml';

    // Gọi API của Github để kích hoạt Workflow Dispatch
    const response = await fetch(`https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main', // Chạy trên nhánh main
        inputs: {
          // Chúng ta không truyền email qua input mà workflow đang tự lấy từ get_users.js.
          // NHƯNG ĐỢI ĐÃ! get_users.js đang móc trong bảng. 
          // Workflow dispatch cần email để truyền vào USER_EMAIL.
          // Ta cần cập nhật cấu hình file YAML một chút nếu muốn truyền thẳng qua input, 
          // nhưng tạm thời truyền qua input "email" và sửa YAML sau nếu cần.
          email: email 
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Github API Error:", errorText);
      return NextResponse.json({ error: 'Không thể kích hoạt Bot trên Github' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã gửi lệnh chạy Bot thành công!' });

  } catch (error: any) {
    console.error("Lỗi API trigger:", error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
