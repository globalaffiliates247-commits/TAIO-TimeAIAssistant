-- TAIO Time · đồng bộ giữa các máy (PRD B24 v0.3.25)
-- Dán toàn bộ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần vẫn an toàn.
-- Máy chủ chỉ lưu bản dữ liệu ĐÃ MÃ HÓA; không có mã đồng bộ thì không đọc được.

create table if not exists public.taio_sync_snapshots (
  space_id          text   not null check (length(space_id) = 64),
  device_id         text   not null check (length(device_id) between 8 and 64),
  device_name       text,
  iv                text   not null,
  ciphertext        text   not null check (length(ciphertext) < 8000000),
  client_updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  primary key (space_id, device_id)
);

-- Không ai đọc/ghi bảng trực tiếp; chỉ qua 2 hàm bên dưới.
alter table public.taio_sync_snapshots enable row level security;
revoke all on table public.taio_sync_snapshots from anon, authenticated;

create or replace function public.taio_sync_push(
  p_space text, p_device text, p_name text, p_iv text, p_cipher text, p_ts bigint
) returns void
language sql security definer set search_path = public as $$
  insert into taio_sync_snapshots (space_id, device_id, device_name, iv, ciphertext, client_updated_at)
  values (p_space, p_device, p_name, p_iv, p_cipher, p_ts)
  on conflict (space_id, device_id) do update
    set device_name = excluded.device_name,
        iv = excluded.iv,
        ciphertext = excluded.ciphertext,
        client_updated_at = excluded.client_updated_at,
        server_updated_at = now()
    where taio_sync_snapshots.client_updated_at < excluded.client_updated_at;
$$;

create or replace function public.taio_sync_pull(p_space text, p_device text)
returns table (device_id text, device_name text, iv text, ciphertext text, client_updated_at bigint)
language sql security definer set search_path = public as $$
  select s.device_id, s.device_name, s.iv, s.ciphertext, s.client_updated_at
  from taio_sync_snapshots s
  where s.space_id = p_space and s.device_id <> p_device;
$$;

create or replace function public.taio_sync_forget(p_space text, p_device text)
returns void
language sql security definer set search_path = public as $$
  delete from taio_sync_snapshots where space_id = p_space and device_id = p_device;
$$;

revoke all on function public.taio_sync_push(text, text, text, text, text, bigint) from public;
revoke all on function public.taio_sync_pull(text, text) from public;
revoke all on function public.taio_sync_forget(text, text) from public;
grant execute on function public.taio_sync_push(text, text, text, text, text, bigint) to anon, authenticated;
grant execute on function public.taio_sync_pull(text, text) to anon, authenticated;
grant execute on function public.taio_sync_forget(text, text) to anon, authenticated;
