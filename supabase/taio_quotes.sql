-- TAIO Time App — Motivation Quote Bank & Admin Schema (PRD FEATURE v0.3.31 Part E)
-- Dán toàn bộ vào Supabase → SQL Editor → Run. An toàn khi chạy lại nhiều lần.

-- 1. Bảng quản trị viên (nếu chưa có từ v0.3.29)
create table if not exists public.taio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.taio_admins enable row level security;

create policy "Admins can read admin list"
  on public.taio_admins
  for select
  to authenticated
  using (auth.uid() = user_id or exists (select 1 from public.taio_admins where user_id = auth.uid()));

-- 2. Bảng kho câu truyền động lực
create table if not exists public.taio_quotes (
  id text primary key,
  text text not null,
  author text,
  lang text not null check (lang in ('vi', 'en')),
  contexts text[] not null default '{}',
  goal_keywords text[] default '{}',
  weight int not null default 1 check (weight between 1 and 3),
  active boolean not null default true,
  source text not null default 'taio',
  verified boolean not null default false,
  media jsonb,
  heart_count integer not null default 0,
  hide_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Thêm cột nếu bảng đã tồn tại từ trước (v0.3.35 Part B4)
alter table public.taio_quotes add column if not exists heart_count integer not null default 0;
alter table public.taio_quotes add column if not exists hide_count integer not null default 0;

-- Bật RLS
alter table public.taio_quotes enable row level security;

-- Mọi người (cả khách ẩn danh và người dùng đã đăng nhập) đều đọc được các câu đang kích hoạt
create policy "Anyone can read active quotes"
  on public.taio_quotes
  for select
  using (active = true);

-- Chỉ tài khoản có trong bảng taio_admins mới được thêm, sửa, tắt
create policy "Admins can manage quotes"
  on public.taio_quotes
  for all
  to authenticated
  using (exists (select 1 from public.taio_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.taio_admins where user_id = auth.uid()));

-- Index tối ưu truy vấn theo ngôn ngữ và trạng thái
create index if not exists idx_taio_quotes_lang_active on public.taio_quotes (lang, active);
create index if not exists idx_taio_quotes_hearts on public.taio_quotes (heart_count desc);
create index if not exists idx_taio_quotes_hides on public.taio_quotes (hide_count desc);

-- 3. Hàm nhận tương tác ẩn danh: thả tim / bỏ tim / ẩn câu (PRD v0.3.35 Part B4)
create or replace function public.taio_quote_react(
  quote_id text,
  reaction text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if reaction = 'heart' then
    update public.taio_quotes
    set heart_count = coalesce(heart_count, 0) + 1,
        updated_at = now()
    where id = quote_id;
  elsif reaction = 'unheart' then
    update public.taio_quotes
    set heart_count = greatest(0, coalesce(heart_count, 0) - 1),
        updated_at = now()
    where id = quote_id;
  elsif reaction = 'hide' then
    update public.taio_quotes
    set hide_count = coalesce(hide_count, 0) + 1,
        updated_at = now()
    where id = quote_id;
  end if;
end;
$$;

grant execute on function public.taio_quote_react(text, text) to anon, authenticated;
