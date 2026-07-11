const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'tele_bot/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteUser(email) {
    console.log(`Bắt đầu xoá user: ${email}`);
    
    // Tìm user trong profiles
    const { data: profile, error: errProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
    if (errProfile) {
        console.error("Lỗi khi tìm profile:", errProfile.message);
    }
    
    let userId = profile ? profile.id : null;
    
    // Nếu tìm thấy bằng email trong auth.users
    const { data: users, error: errAuth } = await supabase.auth.admin.listUsers();
    if (errAuth) {
        console.error("Lỗi list users:", errAuth.message);
    } else {
        const authUser = users.users.find(u => u.email === email);
        if (authUser) {
            userId = authUser.id;
            console.log(`Tìm thấy UUID trong auth.users: ${userId}`);
        }
    }
    
    if (!userId) {
        console.log("Không tìm thấy UUID của tài khoản này trong hệ thống.");
        return;
    }
    
    console.log(`Đang xoá dữ liệu của user ID: ${userId}...`);
    
    // Xoá các bảng liên quan
    const tables = ['bot_logs', 'usage_stats', 'crawl_jobs', 'crawl_data', 'credit_transactions', 'profiles'];
    for (let table of tables) {
        // Tuỳ table có cột user_id hay id
        let col = table === 'profiles' ? 'id' : 'user_id';
        const { error } = await supabase.from(table).delete().eq(col, userId);
        if (error) {
            console.log(`- Lỗi khi xoá ${table}:`, error.message);
        } else {
            console.log(`- Đã dọn sạch bảng ${table}`);
        }
    }
    
    // Xoá account Auth
    const { error: delAuthErr } = await supabase.auth.admin.deleteUser(userId);
    if (delAuthErr) {
        console.error("- Lỗi khi xoá tài khoản Auth:", delAuthErr.message);
    } else {
        console.log("- Đã xoá tài khoản khỏi hệ thống Auth thành công!");
    }
    
    console.log(`[HOÀN TẤT] Toàn bộ dữ liệu của ${email} đã bốc hơi!`);
}

deleteUser('minhquang@gmail.com');
