# TAIO Time — Server API & Supabase Contract (PRD v0.3.38 Part F2.4)

Tài liệu hợp đồng giữa client (Web, macOS, iOS) và máy chủ Supabase.
Mọi bảng đều kích hoạt Row Level Security (RLS). Ứng dụng chỉ sử dụng `anon` public key, tuyệt đối **không bao giờ nhúng khóa `service_role`**.

---

## 1. Cơ sở dữ liệu & Bảng

### `public.taio_sync_snapshots`
Lưu trữ bản chụp dữ liệu đồng bộ mã hóa đầu cuối (E2E) giữa các thiết bị chung không gian mã (Space ID).
- `space_id`: text (SHA-256 64 hex chars) — Không gian đồng bộ
- `device_id`: text (8–64 chars) — Mã định danh thiết bị
- `device_name`: text — Tên thiết bị hiển thị
- `iv`: text — Khóa khởi tạo AES-GCM
- `ciphertext`: text (< 8MB) — Dữ liệu đã mã hóa AES-GCM
- `client_updated_at`: bigint — Epoch milliseconds từ client
- `server_updated_at`: timestamptz — Thời gian máy chủ nhận

### `public.taio_sync_pairings`
Lưu trữ mã ghép nối tạm thời (6 ký tự / pair ID) có hạn sử dụng ngắn (< 10 phút).
- `pair_id`: text (64 hex chars)
- `iv`: text
- `ciphertext`: text (< 4KB)
- `expires_at`: timestamptz

### `public.taio_quotes`
Kho câu truyền động lực đồng bộ với client.
- `id`: text (primary key)
- `text`: text (nội dung câu)
- `author`: text
- `lang`: 'vi' | 'en'
- `contexts`: text[] (các ngữ cảnh hiển thị)
- `goal_keywords`: text[] (từ khóa mục tiêu liên quan)
- `weight`: int (1-3)
- `active`: boolean
- `source`: text ('taio' | 'community')

---

## 2. Danh sách RPC (Remote Procedure Calls)

### `public.taio_sync_push`
Đẩy bản snapshot mã hóa của thiết bị lên server.
- **Quyền**: `security definer`, gọi được từ `anon`
- **Đầu vào**:
  - `p_space`: text (64 chars)
  - `p_device`: text
  - `p_name`: text
  - `p_iv`: text
  - `p_cipher`: text
  - `p_ts`: bigint
- **Đầu ra**: `void`
- **Lỗi**: Sai độ dài `space_id` hoặc payload vượt 8MB sẽ bị reject bởi check constraint.

### `public.taio_sync_pull`
Lấy danh sách các snapshot từ các thiết bị khác trong cùng `space_id`.
- **Quyền**: `security definer`, gọi được từ `anon`
- **Đầu vào**:
  - `p_space`: text (64 chars)
  - `p_exclude_device`: text
- **Đầu ra**: Table (`device_id`, `device_name`, `iv`, `ciphertext`, `client_updated_at`, `server_updated_at`)

### `public.taio_pair_create`
Tạo phiên ghép nối thiết bị tạm thời.
- **Đầu vào**: `p_id`, `p_iv`, `p_cipher`, `p_expires`
- **Đầu ra**: `void`

### `public.taio_pair_claim`
Lấy dữ liệu ghép nối và xóa ngay sau khi lấy (chỉ dùng 1 lần).
- **Đầu vào**: `p_id`
- **Đầu ra**: Table (`iv`, `ciphertext`)

---

## 3. Kế hoạch mở rộng v0.3.38 Part D (Tài khoản & Dữ liệu chung)
Phần D sẽ bổ sung:
- `public.taio_accounts`: Tài khoản dùng thử gắn với email/phone
- `public.taio_account_devices`: Quản lý danh sách thiết bị của tài khoản
- `public.taio_account_data`: Dữ liệu đồng bộ theo tài khoản (HTTPS thay vì chỉ E2E mã dài)
- Các hàm RPC: `taio_trial_open`, `taio_data_push`, `taio_data_pull`, `taio_account_claim`
