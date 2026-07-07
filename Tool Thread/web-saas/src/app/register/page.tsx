'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Tích hợp Supabase Auth
    setTimeout(() => {
      alert("Đang đăng ký vào Database!");
      setLoading(false);
    }, 1000);
  };

  return (
    <main className="container flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Mở Bát Tài Khoản</h2>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Tham gia hệ sinh thái Bot Auto</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
            <input 
              type="email" 
              className="input-glass" 
              placeholder="nhap_email_vao_day@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mật khẩu</label>
            <input 
              type="password" 
              className="input-glass" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
          Đã có tài khoản? <Link href="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>Đăng nhập</Link>
        </div>
      </div>
    </main>
  );
}
