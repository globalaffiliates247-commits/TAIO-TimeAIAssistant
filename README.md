# TAIO Time App (MVP v0.7) - Prototype nháp đầu tiên

Phiên bản ứng dụng mẫu đầu tiên được phát triển bám sát toàn diện tài liệu đặc tả **TAIO Time App Product Spec (PRD) v0.7** từ thương hiệu **TAIO (TAIO.CLUB)**.

---

## 🎯 Cấu trúc & Tính năng đã hiện thực hoá

### 1. Triết lý 3 câu hỏi cốt lõi (Part A1 & B5 - Màn hình "Now")
Người dùng trả lời được 3 câu hỏi chỉ trong vòng chưa đầy 2 giây:
1. **Bạn đang làm gì ngay lúc này?** Tên khối công việc, phân loại màu (Tập trung sâu, Họp, Dự phòng gián đoạn, Cá nhân, Lập kế hoạch).
2. **Phục vụ mục tiêu lớn nào?** Tên mục tiêu, kết quả đo lường cụ thể (Measurable Result), % tiến độ và hạn chót.
3. **Hạn chót cứng kế tiếp là gì & còn bao nhiêu phút trong khối đã định?** Đồng hồ đếm ngược tương tác (+15p, Tạm dừng, Xong sớm) kèm thẻ Hạn chót cứng kế tiếp (Hard Deadline) đồng bộ từ lịch hoặc cài đặt thủ công.

### 2. Nút bấm nổi bật: "Có việc đột xuất!" (Interruption Workflow - PRD B5 & B12)
- Nhập nhanh việc phát sinh bằng giọng nói (Mic simulation) hoặc văn bản.
- **Lưu điểm quay lại (Return Point)** trong 3 giây để khi quay lại khối tập trung cũ không mất dấu.
- Chọn mục tiêu phục vụ hoặc gắn nhãn "Ngoài mục tiêu chính" (Outside my goals).
- **Chọn 1 trong các quyết định (At most 3 taps):**
  - **Làm ngay (Do now):** Bật timer việc phát sinh, giảm trừ vào quỹ dự phòng hôm nay.
  - **Lên lịch (Schedule):** Đề xuất khung giờ trống tiếp theo.
  - **Ủy quyền (Delegate) / Từ chối (Decline):** Ghi nhận số phút bảo vệ tập trung (Protected focus minutes).
  - **Đi việc ngoài / Giao lưu có giờ về (Social Interruption - PRD B12):** Đặt giờ về, tự động cộng 30 phút đệm di chuyển mỗi chiều và tạo lời nhắc nhẹ giờ về.

### 3. Quy trình Onboarding theo 6 hồ sơ khởi đầu (PRD B3)
- Chỉ 1 câu hỏi duy nhất: *"Mô tả nào giống bạn nhất?"*
- 6 hồ sơ được thiết lập sẵn đầy đủ thông số:
  1. **Chủ doanh nghiệp (Business Owner)** - Hồ sơ của Founder: 50% Deep Work, 30% Gián đoạn, 20% Họp hành; 90p khối tập trung; 90p quỹ gián đoạn.
  2. **Quản lý đa nhiệm (Multitasking Manager):** 25% Deep Work, 35% Gián đoạn, 35% Họp hành; quỹ gián đoạn lớn (120p).
  3. **Chuyên gia kỹ thuật (Technical Specialist):** 70% Deep Work, khối tập trung dài 120p, quỹ gián đoạn 45p.
  4. **Hành chính & Hỗ trợ (Admin & Support):** 20% Deep Work, 30% Gián đoạn, 35% Việc định kỳ cố định.
  5. **Thương mại & Dịch vụ (Trade & Service):** Lịch hẹn & ca trực, ưu tiên giọng nói.
  6. **Làm việc tự do (Freelancer):** Phục vụ nhiều khách hàng, đo thời gian theo từng khách.
- Nhập **Một điều quan trọng nhất tuần này** và vào thẳng màn hình Now trong **dưới 60 giây**.

### 4. Bốn Tab cốt lõi (PRD B4):
- **Bây giờ (Now):** 3 câu hỏi cốt lõi, Soft Nudges Widget, Return Point Banner, Nút "Có việc đột xuất", Bộ đếm thời gian.
- **Kế hoạch (Plan - PRD B6):** Dòng thời gian trực quan theo mã màu từng khối; Theo dõi ngân sách tuần (Weekly Budget); Danh sách việc quan trọng, không khẩn cấp (Important, Not Urgent) với 1 chạm "Làm tuần này".
- **Thành tựu & Đóng ngày (Achievements - PRD B10):** Tiến độ ngày, thời gian hoàn thành theo từng mục tiêu, thống kê gián đoạn, khoảng thời gian chưa khai báo (Gaps 15p+) với chip gắn nhãn 1 chạm (Nghỉ ngơi, Ăn uống, Di chuyển, Việc vặt, Xao nhãng, Khác), danh mục Đang chờ bạn (Waiting for you), và **Chế độ Đóng ngày trong 2 phút (Close the day)** với chọn việc số 1 ngày mai.
- **Mục tiêu (Goals - PRD B7):** Bao quát cả Bề rộng (4 mảng việc: Product, Business, Operations, Personal) và Bề sâu (Cột mốc - Milestones); **Công cụ lập mục tiêu ngược (Back-planning)** tự động đề xuất mốc phân kỳ từ tầm nhìn và ngân sách thời gian mỗi ngày.

### 5. Kiểm toán chi phí giao lưu ngoài giờ & Ảnh hưởng sáng hôm sau (PRD B12)
- Phân tích chi phí thực tế của các buổi tụ tập / đi nhậu buổi tối mà không phán xét, không cấm đoán.
- Quy đổi tổng thời gian ra số khối tập trung sâu bị mất.
- **Thứ tự ưu tiên hệ quả theo nhóm tuổi:**
  - **Dưới 45 tuổi:** 1. Công việc bị trễ/dời -> 2. Cam kết & Mối quan hệ -> 3. Sức khỏe & Giấc ngủ.
  - **Từ 45 tuổi trở lên:** 1. Sức khỏe & Thể trạng -> 2. Công việc bị trễ/dời -> 3. Cam kết cá nhân.
- Theo dõi ngân sách giao lưu trong tuần (Social Budget).

### 6. Giọng điệu thích ứng (Adaptive Tone of Voice - PRD B13)
- 3 cấp độ: **Mức 1 (Nhẹ nhàng - Gentle)**, **Mức 2 (Rõ ràng - Clear)**, **Mức 3 (Dứt khoát - Firm)**, hoặc **Tự thích ứng (AI)**.
- Lời nhắc và thông báo check-in thay đổi sống động theo cấp độ được chọn.

### 7. Trang quản trị Admin Back-end (Part C)
- Nhấn nút **Admin** trên thanh điều hướng để mở portal:
  - **Quản lý tài khoản (C2):** Danh sách người dùng, tìm kiếm/lọc theo hồ sơ, trạng thái hoạt động, tạm ngưng/kích hoạt, xuất CSV.
  - **Thống kê (C3):** Tỷ lệ Onboarding < 60s, tỷ lệ phản hồi Check-in, tỷ lệ Đóng ngày, biểu đồ phân bổ 6 hồ sơ, tỷ lệ phản hồi theo từng cấp độ giọng điệu.
  - **Cấu hình giọng điệu (B13):** Quản lý mẫu câu Constants theo từng hồ sơ.

---

## 🚀 Hướng dẫn khởi chạy & Trải nghiệm

Thư mục dự án: `/Users/abc/.gemini/antigravity/scratch/taio-time-app`

1. Ứng dụng hiện đang chạy trên cổng `http://localhost:3000`. Mở trình duyệt và truy cập ngay để trải nghiệm!
2. Bạn có thể:
   - Thử bấm **"CÓ VIỆC ĐỘT XUẤT!"** để trải nghiệm luồng ghi nhận gián đoạn và lưu điểm quay lại (Return Point).
   - Thử bấm **"Chi phí giao lưu"** để xem cơ chế phân tích hệ quả ngày hôm sau theo độ tuổi (B12).
   - Thử chuyển đổi giữa 3 cấp độ **Giọng điệu (Tone)** hoặc đổi giữa 6 **Hồ sơ (Profile)** để xem giao diện và câu từ tự động thay đổi.
   - Thử chuyển sang tab **Kế hoạch (Plan)**, **Thành tựu (Achievements)** (thử bấm Đóng ngày), **Mục tiêu (Goals)** (thử tạo mục tiêu với Back-planning), hoặc mở trang **Admin**.
