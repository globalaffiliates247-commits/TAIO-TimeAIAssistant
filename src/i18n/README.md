# Hệ thống ngôn ngữ và quốc tế hóa (TAIO Time i18n)

Kiến trúc ngôn ngữ được chia làm 3 lớp độc lập theo tài liệu đặc tả PRD v0.3.34 Phần C:

## Ba lớp chữ

| Lớp | Gồm những gì | Lấy từ đâu |
|---|---|---|
| **1. Từ điển của app** | Tên màn hình, nút, câu hướng dẫn, thông báo của app | File từ điển theo ngôn ngữ (`src/i18n/{lang}/*.json`), gọi qua `t()` |
| **2. Của hệ điều hành** | Ngày, giờ, thứ, tháng, số, đơn vị, "hôm qua / ngày mai", kiểu 12/24 giờ, ngày đầu tuần; bộ chọn ngày giờ; hộp thoại xin quyền; menu Mac | Bộ định dạng `Intl` (`src/i18n/format.ts`) theo ngôn ngữ đang chọn và thành phần gốc của iOS, macOS. App không tự dịch chuỗi ngày giờ |
| **3. Nội dung theo văn hóa** | Câu truyền động lực; ví dụ mẫu trong ô nhập; tên ngày lễ mà bộ đọc câu hiểu ("trước Tết") | Kho nội dung riêng cho từng ngôn ngữ (`src/features/motivation/model/`), không dịch máy móc từ tiếng Việt |

## Phân chia file từ điển (Lớp 1)

Mỗi ngôn ngữ (`src/i18n/{lang}/`) được chia thành các file JSON theo tính năng:
- `now.json`: Thẻ Đang làm, điểm quay lại, checkin
- `journal.json`: Nhật ký hôm nay, dòng việc, swipe, rổ công việc
- `clock.json`: Đồng hồ, báo thức, timebox, mini clock
- `goals.json`: Mục tiêu, mốc, cỡ mục tiêu T-shirt
- `dayclose.json`: Khép ngày, dời việc, báo cáo tổng kết
- `account.json`: Ghép đôi thiết bị, tài khoản, đồng bộ
- `settings.json`: Cài đặt hệ thống, tùy chọn giao diện
- `common.json`: Các chuỗi dùng chung, thanh điều hướng, thuật ngữ chung

## Công cụ cho người dịch

- `npm run i18n:export`: Xuất bảng đối chiếu (mã, ngữ cảnh, tiếng Việt, tiếng Anh, cột trống cho ngôn ngữ mới).
- `npm run i18n:import`: Nhập bảng đã dịch và tự động cập nhật/tạo thư mục từ điển.
- `npm run check:i18n`: Kiểm tra tính toàn vẹn 100% giữa các ngôn ngữ, kiểm tra không có chữ tiếng Anh trong ngoặc ở tiếng Việt và không có dấu tiếng Việt trong tiếng Anh.
