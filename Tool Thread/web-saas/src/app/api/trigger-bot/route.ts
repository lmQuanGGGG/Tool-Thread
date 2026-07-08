import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, botType = 'reels' } = body;

    // Lấy user từ Authorization header
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Đảm bảo chỉ có thể kích hoạt bot cho chính email của user đang login
    if (user.email !== email) {
      return NextResponse.json({ error: "Forbidden: Cannot trigger bot for another user" }, { status: 403 });
    }

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

    let workflowId = 'reels_worker.yml';
    let inputs: any = { email };

    if (botType === 'reels') workflowId = 'reels_worker.yml';
    else if (botType === 'threads') workflowId = 'threads_comment_worker.yml';
    else if (botType === 'fb') workflowId = 'fb_worker.yml';
    else if (botType === 'fb_story') workflowId = 'fb_story_worker.yml';
    else if (botType === 'farm') workflowId = 'farm_worker.yml';
    else if (botType === 'shopee') workflowId = 'shopee_worker.yml';
    else if (botType === 'parse_links') workflowId = 'parse_links_worker.yml';
    else if (botType === 'fb_comment') workflowId = 'fb_comment_worker.yml';
    else if (botType === 'threads_scraper') {
      workflowId = 'threads_scraper_worker.yml';
      inputs = { 
        target_url: body.target_url || "https://www.threads.net/@zuck",
        email: email
      };
    }
    else if (botType.startsWith('threads_post_')) {
      workflowId = 'threads_post_worker.yml';
      inputs.post_id = botType.replace('threads_post_', '');
    }

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
        inputs: inputs
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
