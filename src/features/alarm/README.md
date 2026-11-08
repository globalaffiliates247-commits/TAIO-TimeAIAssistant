# Block-Start Alarm Module (PRD v0.3.22 - B32)

Module quản lý báo thức tự động khi bắt đầu khối thời gian.

## Tính năng
- **Báo thức toàn màn hình**: Hiển thị lockscreen / full-screen banner kèm rung và chuông khi đến giờ bắt đầu khối việc.
- **Tuỳ chọn âm thanh người dùng**: Cho phép chọn file âm thanh cá nhân (MP3, M4A, WAV, AAC, MP4 audio) lưu trữ ngoại tuyến bằng base64 data.
- **Cơ chế Fallback an toàn**: Nếu file âm thanh bị xoá hoặc lỗi đọc, hệ thống tự động phát chuông mặc định (Web Audio oscillator chime) và hiển thị cảnh báo: *"Không tìm thấy file âm thanh ‹tên file› — đã dùng chuông mặc định. Chọn lại?"*.
- **Hỗ trợ đa nền tảng**:
  - iOS 26+: AlarmKit
  - iOS < 26: Time-sensitive local notification với chuông 30s
  - Android: AlarmManager + Full-screen Intent
  - Web/PWA: Thông báo chuông khi tab hoạt động kèm nhãn *"Chỉ có trên bản cài đặt"*
