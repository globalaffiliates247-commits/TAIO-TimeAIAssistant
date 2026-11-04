#!/usr/bin/env python3
"""
Fix 4 groups of UI issues:
1. Header/Footer safe-area padding
2. Remove all PRD/dev references from user-facing text
3. Version badge: keep v0.3.9, remove APPROVED
4. Fix color contrast issues
"""
import os
import re

PROJECT = "/Users/abc/.gemini/antigravity/scratch/taio-time-app/src"

def fix_file(filepath, replacements):
    """Apply a list of (old, new) replacements to a file."""
    if not os.path.exists(filepath):
        print(f"  SKIP {filepath} (not found)")
        return 0
    with open(filepath, 'r') as f:
        content = f.read()
    count = 0
    for old, new in replacements:
        c = content.count(old)
        if c > 0:
            content = content.replace(old, new)
            count += c
    if count > 0:
        with open(filepath, 'w') as f:
            f.write(content)
    return count

total = 0

# ==========================================
# 1. NAVBAR: Remove "Approved" from version, fix PRD comments visible as text
# ==========================================
print("\n📌 1. Navbar.tsx — Remove 'Approved', PRD refs")
c = fix_file(f"{PROJECT}/components/Navbar.tsx", [
    ("v0.3.9 Approved", "v0.3.9"),
    ('title="Rổ công việc (Inbox - GTD B20)"', 'title="Rổ công việc (Inbox)"'),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 2. PAGE.TSX: Fix footer text, metadata title
# ==========================================
print("\n📌 2. page.tsx — Footer text, metadata")
c = fix_file(f"{PROJECT}/app/page.tsx", [
    ("TAIO Time App v0.3.9 Approved • Quản trị thời gian kết hợp AI • Thương hiệu TAIO (TAIO.CLUB)",
     "TAIO Time App v0.3.9 • Quản trị thời gian kết hợp AI • TAIO.CLUB"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 3. LAYOUT.TSX: Fix title metadata
# ==========================================
print("\n📌 3. layout.tsx — Remove 'Approved' from title")
c = fix_file(f"{PROJECT}/app/layout.tsx", [
    ("TAIO Time App | MVP v0.3.9 Approved", "TAIO Time App | v0.3.9"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 4. INTERRUPTION MODAL: Remove PRD badge
# ==========================================
print("\n📌 4. InterruptionModal.tsx — Remove PRD badge")
c = fix_file(f"{PROJECT}/components/InterruptionModal.tsx", [
    ("PRD v0.3.9 B5", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 5. REMINDER QUESTIONS MODAL: Remove B29 badge
# ==========================================
print("\n📌 5. ReminderQuestionsModal.tsx — Remove B29")
c = fix_file(f"{PROJECT}/components/ReminderQuestionsModal.tsx", [
    ("B29", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 6. CLOSE DAY MODAL: Remove B25 badge
# ==========================================
print("\n📌 6. CloseDayModal.tsx — Remove B25")
c = fix_file(f"{PROJECT}/components/CloseDayModal.tsx", [
    ("B25", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 7. LISTS MODAL: Remove B26, PRD refs
# ==========================================
print("\n📌 7. ListsModal.tsx — Remove B26, PRD refs")
c = fix_file(f"{PROJECT}/components/ListsModal.tsx", [
    ("Mini App B26", ""),
    ("Chọn 1 trong 3 mẫu cố định theo PRD B26 để giữ trọn vẹn tốc độ đơn giản:",
     "Chọn 1 trong 3 mẫu cố định để giữ trọn vẹn tốc độ đơn giản:"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 8. SWIPE REVIEW MODAL: Remove B28
# ==========================================
print("\n📌 8. SwipeReviewModal.tsx — Remove B28")
c = fix_file(f"{PROJECT}/components/SwipeReviewModal.tsx", [
    ("B28", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 9. PROFILE MODAL: Remove B13 ref
# ==========================================
print("\n📌 9. ProfileModal.tsx — Remove B13")
c = fix_file(f"{PROJECT}/components/ProfileModal.tsx", [
    ("Tông giọng nhắc nhở (Adaptive Tone - B13)", "Tông giọng nhắc nhở (Adaptive Tone)"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 10. ADMIN PORTAL: Remove PRD C6, C3 refs
# ==========================================
print("\n📌 10. AdminPortal.tsx — Remove PRD refs")
c = fix_file(f"{PROJECT}/components/AdminPortal.tsx", [
    ("AI Cải tiến (PRD C6)", "AI Cải tiến"),
    ("Xuất báo cáo CSV thành công (PRD C3)!", "Xuất báo cáo CSV thành công!"),
    ("PRD C6", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 11. EXPORT DATA MODAL: Remove PRD B24
# ==========================================
print("\n📌 11. ExportDataModal.tsx — Remove PRD B24")
c = fix_file(f"{PROJECT}/components/ExportDataModal.tsx", [
    ("PRD B24 (v0.3.1)", ""),
    ("Bản xem trước định dạng Markdown (10 phần chuẩn PRD B24):",
     "Bản xem trước định dạng Markdown (10 phần chuẩn):"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 12. HABIT INSIGHTS: Remove B15
# ==========================================
print("\n📌 12. HabitInsights.tsx — Remove B15")
c = fix_file(f"{PROJECT}/components/HabitInsights.tsx", [
    ("B15", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 13. NOW TAB: Remove PRD ref from interruption button
# ==========================================
print("\n📌 13. NowTab.tsx — Remove PRD refs")
c = fix_file(f"{PROJECT}/components/NowTab.tsx", [
    ('PRD v0.3.9: 2 tình huống (Tức thì vs Xem lại) • Mặc định "Để sau" vào Rổ việc • 1 chạm',
     '2 tình huống (Tức thì vs Xem lại) • Mặc định "Để sau" vào Rổ việc • 1 chạm'),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 14. METHOD LIBRARY MODAL: Remove B22
# ==========================================
print("\n📌 14. MethodLibraryModal.tsx — Remove B22")
c = fix_file(f"{PROJECT}/components/MethodLibraryModal.tsx", [
    ("B22 Scientific Basis", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 15. PRIORITY MATRIX: Remove PRD ref
# ==========================================
print("\n📌 15. PriorityMatrix.tsx — Remove PRD ref")
c = fix_file(f"{PROJECT}/components/PriorityMatrix.tsx", [
    ("PRD v0.11 B16", ""),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 16. ACHIEVEMENTS TAB: Remove PRD version from header
# ==========================================
print("\n📌 16. AchievementsTab.tsx — Remove PRD v0.22 B21")
c = fix_file(f"{PROJECT}/components/AchievementsTab.tsx", [
    ("Hiệu quả & Dấu vết (Efficiency - PRD v0.22 B21)",
     "Hiệu quả & Dấu vết (Efficiency)"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 17. ACTIVE CAPTURE MODAL: Remove B30, B25, B28/B29/B30 refs
# ==========================================
print("\n📌 17. ActiveCaptureModal.tsx — Remove dev refs")
c = fix_file(f"{PROJECT}/components/ActiveCaptureModal.tsx", [
    ("B30", ""),
    ("Tập trung giải quyết code tính năng B28, B29, B30",
     "Tập trung giải quyết code tính năng"),
    ("Nguồn gốc thời gian (Origin - B25)", "Nguồn gốc thời gian (Origin)"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 18. DAILY CARD VIEW: Remove PRD badges
# ==========================================
print("\n📌 18. DailyCardView.tsx — Remove PRD badges")
c = fix_file(f"{PROJECT}/components/DailyCardView.tsx", [
    ("PRD v0.3.1 B25", ""),
    ('title="Mở Thẻ nhắc việc (Lướt rổ backlog - B28)"',
     'title="Mở Thẻ nhắc việc (Lướt rổ backlog)"'),
    ("Nguồn gốc công việc (Origin B25):", "Nguồn gốc công việc (Origin):"),
])
print(f"   ✅ {c} fixes")
total += c

# ==========================================
# 19. GOALS TAB: Remove PRD ref
# ==========================================
print("\n📌 19. GoalsTab.tsx — Remove PRD ref")
c = fix_file(f"{PROJECT}/components/GoalsTab.tsx", [
    ("PRD D3: Red Accent", ""),
])
print(f"   ✅ {c} fixes")
total += c

print(f"\n🎯 Grand Total: {total} PRD/dev reference removals")
