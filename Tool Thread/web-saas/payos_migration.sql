-- Bảng lưu trữ đơn hàng thanh toán qua PayOS
create table if not exists public.payment_orders (
  order_code bigint primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tier text not null,
  amount integer not null,
  status text default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELLED')),
  created_at timestamptz default now()
);

-- Bảo mật (RLS)
alter table public.payment_orders enable row level security;

-- Cho phép user xem đơn hàng của chính mình
create policy "Users view own payment orders" on public.payment_orders for select using (auth.uid() = user_id);

-- Chỉ backend (Service Role) mới được tạo hoặc update payment_orders. Client KHÔNG có quyền insert/update.
