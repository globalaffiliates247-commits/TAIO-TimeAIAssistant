# Test Vectors & Golden Results (PRD v0.3.38 Part F2.5)

Thư mục chứa các cặp input / golden output chuẩn hoá dạng JSON để xác thực tính đúng đắn của các hàm lõi thuần (domain pure functions) xuyên suốt các nền tảng (Web, macOS, iOS Swift, Android).
Mọi implementation native sau này phải chạy qua bộ test vectors này và cho ra kết quả đồng nhất.

- `workNode/`: Kiểm thử chuyển đổi cây phân rã WorkNode, kế thừa mục tiêu/dự án/mốc.
- `goalLedger/`: Kiểm thử số liệu EVM (PV, EV, AC, SPI, CPI), velocity, forecast ngày về đích.
- `clockState/`: Kiểm thử 3 trạng thái đồng hồ phổ quát.
