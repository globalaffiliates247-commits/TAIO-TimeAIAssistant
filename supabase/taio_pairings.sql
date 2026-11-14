-- TAIO Time · Ghép máy bằng mã 6 ký tự (PRD B35.4 v0.3.27)
-- Dán vào Supabase → SQL Editor → Run (nếu muốn dùng bảng và RPC riêng thay vì snapshot sync).

create table if not exists public.taio_sync_pairings (
  pair_id    text primary key check (length(pair_id) = 64),
  iv         text not null,
  ciphertext text not null check (length(ciphertext) < 4000),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.taio_sync_pairings enable row level security;
revoke all on table public.taio_sync_pairings from anon, authenticated;

create or replace function public.taio_pair_create(p_id text, p_iv text, p_cipher text, p_expires timestamptz)
returns void language sql security definer set search_path = public as $$
  delete from taio_sync_pairings where expires_at < now();
  insert into taio_sync_pairings (pair_id, iv, ciphertext, expires_at)
  values (p_id, p_iv, p_cipher, least(p_expires, now() + interval '10 minutes'))
  on conflict (pair_id) do update set iv = excluded.iv, ciphertext = excluded.ciphertext, expires_at = excluded.expires_at;
$$;

-- Trả về đúng một lần rồi xóa; mã hết hạn thì trả rỗng
create or replace function public.taio_pair_claim(p_id text)
returns table (iv text, ciphertext text)
language sql security definer set search_path = public as $$
  delete from taio_sync_pairings
  where pair_id = p_id and expires_at >= now()
  returning taio_sync_pairings.iv, taio_sync_pairings.ciphertext;
$$;

revoke all on function public.taio_pair_create(text, text, text, timestamptz) from public;
revoke all on function public.taio_pair_claim(text) from public;
grant execute on function public.taio_pair_create(text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.taio_pair_claim(text) to anon, authenticated;
