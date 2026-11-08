export const FOUNDER_TAIO_EXPORT_V1 = {
  "format": "taio-time-export",
  "formatVersion": 1,
  "specVersion": "0.3.19",
  "exportedAt": "2026-11-08T20:00:00+07:00",
  "timezone": "Asia/Ho_Chi_Minh",
  "source": "Bảng quản lý thời gian tĩnh của TAIO-Lee (Claude) + dữ liệu ghi trong cuộc trò chuyện",
  "user": {
    "displayName": "TAIO-Lee",
    "profile": "business_owner",
    "defaultHomeScreen": "inbox"
  },
  "goals": [
    {
      "id": "g1",
      "name": "Kỹ năng AI",
      "progressType": "time_commitment",
      "commitment": {
        "minutesPerDay": 45,
        "days": 90,
        "start": "2026-10-31"
      },
      "description": "Mỗi ngày 45 phút luyện, phân tích, nghiên cứu. Kết quả mong muốn: một quy trình lặp lại trên 5 công cụ AI."
    },
    {
      "id": "g2",
      "name": "Xây ứng dụng AI",
      "progressType": "tasks",
      "deadline": "2027-01-09",
      "description": "Xây ứng dụng AI cho những người như mình, bắt đầu với TAIO Time App. MVP trước 9/1/2027."
    },
    {
      "id": "g3",
      "name": "Kênh AI",
      "progressType": "key_result",
      "keyResult": {
        "label": "clip đã đăng",
        "target": 30,
        "current": 0
      },
      "start": "2026-11-02",
      "deadline": "2026-12-01",
      "description": "30 clip trong 30 ngày. Mỗi ngày 30 phút chủ đề và kịch bản, 60 phút quay."
    }
  ],
  "projects": [
    {
      "id": "p-time-app",
      "name": "TAIO Time App",
      "goalId": "g2",
      "status": "active",
      "start": "2026-10-31",
      "deadline": "2027-01-09",
      "nextAction": "Gửi spec v0.3.19 cho đội tech; sửa lỗi mất dữ liệu trên bản cài iPhone"
    },
    {
      "id": "p-studio",
      "name": "TAIO Studio",
      "goalId": "g2",
      "status": "active",
      "start": "2026-11-03",
      "deadline": null,
      "nextAction": "Đặt hạn và việc kế tiếp"
    },
    {
      "id": "p-channel",
      "name": "Kênh AI: 30 clip",
      "goalId": "g3",
      "status": "active",
      "start": "2026-11-02",
      "deadline": "2026-12-01",
      "nextAction": "Quay clip hôm nay"
    }
  ],
  "lists": [
    {
      "id": "l-ideas",
      "name": "Ý tưởng TAIO.CLUB",
      "type": "idea",
      "items": [
        {
          "id": "i01",
          "text": "TAIO Rec: tiện ích Chrome quay màn hình và webcam kiểu Loom, chỉ cho thành viên TAIO.CLUB",
          "state": "new",
          "createdAt": "2026-11-03"
        },
        {
          "id": "i02",
          "text": "Nền tảng nghe nhạc cộng đồng cho dân văn phòng và nghệ sĩ Việt",
          "state": "new",
          "createdAt": "2026-11-02"
        },
        {
          "id": "i03",
          "text": "Trung tâm điều phối AI agent (bot Telegram, Claude Code, Gemini, Antigravity)",
          "state": "new",
          "createdAt": "2026-11-02"
        },
        {
          "id": "i04",
          "text": "AccountSwitch: một cửa sổ dùng AI, đổi tài khoản khi hết lượt mà giữ lịch sử",
          "state": "new",
          "createdAt": "2026-11-03"
        },
        {
          "id": "i05",
          "text": "SocialFootPrints: xem và quản lý dấu vết trên mạng xã hội",
          "state": "new",
          "createdAt": "2026-11-03"
        },
        {
          "id": "i06",
          "text": "App thuê bảo mẫu, người chăm sóc tại nhà, có xác minh uy tín",
          "state": "new",
          "createdAt": "2026-11-03"
        },
        {
          "id": "i07",
          "text": "TAIO Potential Match: app hẹn hò cho thành viên đã xác minh",
          "state": "new",
          "createdAt": "2026-11-04"
        },
        {
          "id": "i08",
          "text": "TAIO Đọc Lại – Dịch Lại: chép lời, dịch, lồng tiếng video",
          "state": "new",
          "createdAt": "2026-11-05"
        },
        {
          "id": "i09",
          "text": "TAIO Cover Studio: tự thêm lớp phủ, chú thích, logo cho video",
          "state": "new",
          "createdAt": "2026-11-05"
        },
        {
          "id": "i10",
          "text": "Luật Sư AI: nền tảng tư vấn pháp lý AI cùng Viện ILED",
          "state": "new",
          "createdAt": "2026-11-06"
        }
      ]
    },
    {
      "id": "l-projects",
      "name": "Dự án TAIO.CLUB",
      "type": "project",
      "items": [
        "p-time-app",
        "p-studio",
        "p-channel"
      ]
    }
  ],
  "tasks": [
    {
      "id": "mt-t1",
      "title": "Hoàn thiện chi tiết 6 hồ sơ mẫu cho spec",
      "goalId": "g2",
      "estimateMin": 120,
      "deadline": "2026-11-03T18:00",
      "createdAt": "2026-10-31",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "mt-t2",
      "title": "Chọn chủ đề bài đăng tuần này",
      "goalId": null,
      "estimateMin": 5,
      "deadline": "2026-11-02T08:30",
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "mt-t3",
      "title": "Viết và đăng bài #TAIOCLUB đầu tiên",
      "goalId": null,
      "estimateMin": 60,
      "deadline": "2026-11-06T17:30",
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "mt-t4",
      "title": "Luyện một quy trình trên 2 công cụ AI",
      "goalId": "g1",
      "estimateMin": 90,
      "deadline": "2026-11-14T23:00",
      "createdAt": "2026-10-31",
      "status": "open",
      "matrix": "schedule",
      "source": "matrix"
    },
    {
      "id": "mt-t5",
      "title": "Thêm lịch cuối tuần vào bảng cá nhân",
      "goalId": "g2",
      "estimateMin": 30,
      "deadline": "2026-11-08T23:00",
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "mt-t6",
      "title": "Kiểm tra trùng tên miền, App Store cho tên ứng viên",
      "goalId": null,
      "estimateMin": 30,
      "deadline": null,
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "schedule",
      "source": "matrix"
    },
    {
      "id": "mt-t7",
      "title": "Trả lời tin nhắn, cuộc gọi tồn đọng",
      "goalId": null,
      "estimateMin": 30,
      "deadline": "2026-11-01T21:00",
      "createdAt": "2026-10-30",
      "status": "open",
      "matrix": "delegate",
      "source": "matrix"
    },
    {
      "id": "mt-t8",
      "title": "Xem lại các ý tưởng tên app cũ",
      "goalId": null,
      "estimateMin": 20,
      "deadline": null,
      "createdAt": "2026-10-20",
      "status": "open",
      "matrix": "drop",
      "source": "matrix"
    },
    {
      "id": "mt-t9",
      "title": "Dọn thư mục tài liệu cũ",
      "goalId": null,
      "estimateMin": 40,
      "deadline": null,
      "createdAt": "2026-10-18",
      "status": "open",
      "matrix": "drop",
      "source": "matrix"
    },
    {
      "id": "mt-t10",
      "title": "Kênh AI: chọn nền tảng đăng và tên kênh",
      "goalId": "g3",
      "estimateMin": 30,
      "deadline": "2026-11-02T13:30",
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "mt-t11",
      "title": "Kênh AI: dựng góc quay, ánh sáng, mic",
      "goalId": "g3",
      "estimateMin": 45,
      "deadline": "2026-11-02T16:30",
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "mt-t12",
      "title": "Kênh AI: lập danh sách 30 chủ đề",
      "goalId": "g3",
      "estimateMin": 60,
      "deadline": "2026-11-04T13:00",
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "mt-t13",
      "title": "Kênh AI: quyết định ai dựng và đăng clip",
      "goalId": "g3",
      "estimateMin": 15,
      "deadline": "2026-11-03T18:00",
      "createdAt": "2026-11-01",
      "status": "open",
      "matrix": "do_now",
      "source": "matrix"
    },
    {
      "id": "wk-seed",
      "title": "Gieo thương hiệu: 1 bài hoặc clip về cách tôi quản lý thời gian",
      "goalId": null,
      "estimateMin": 60,
      "deadline": null,
      "status": "open",
      "matrix": "schedule",
      "source": "weekly_important_not_urgent",
      "note": "Thứ Bảy 09:00 đến 10:00 (chiều Thứ Sáu đã dành để quay clip kênh AI)"
    },
    {
      "id": "wk-names",
      "title": "Kiểm tra trùng tên miền, App Store, nhãn hiệu cho các tên ứng viên",
      "goalId": null,
      "estimateMin": 30,
      "deadline": null,
      "status": "open",
      "matrix": "schedule",
      "source": "weekly_important_not_urgent",
      "note": "30 phút, làm một lần, trong khung chen ngang"
    },
    {
      "id": "nx-2026-11-02-8",
      "title": "Cần lên kịch bản/ chọn kịch bản",
      "goalId": "g3",
      "estimateMin": null,
      "deadline": null,
      "createdAt": "2026-11-02",
      "status": "open",
      "matrix": "schedule",
      "source": "next_step",
      "carryFrom": "2026-11-02"
    },
    {
      "id": "nx-2026-11-04-5",
      "title": "Thực hiện 1 kịch bản content thực tế",
      "goalId": "g3",
      "estimateMin": null,
      "deadline": null,
      "createdAt": "2026-11-04",
      "status": "open",
      "matrix": "schedule",
      "source": "next_step",
      "carryFrom": "2026-11-04"
    },
    {
      "id": "nx-2026-11-04-6",
      "title": "Xây dựng AI Agent Nội dung cho TAIO",
      "goalId": "g1",
      "estimateMin": null,
      "deadline": null,
      "createdAt": "2026-11-04",
      "status": "open",
      "matrix": "schedule",
      "source": "next_step",
      "carryFrom": "2026-11-04"
    },
    {
      "id": "top-2026-11-04",
      "title": "Gửi đơn khiếu nại mới",
      "goalId": null,
      "estimateMin": null,
      "deadline": null,
      "createdAt": "2026-11-04",
      "status": "open",
      "matrix": "do_now",
      "source": "top_task_tomorrow"
    },
    {
      "id": "nx-2026-11-08-5",
      "title": "Edit clip",
      "goalId": "g3",
      "estimateMin": null,
      "deadline": null,
      "createdAt": "2026-11-08",
      "status": "open",
      "matrix": "schedule",
      "source": "next_step",
      "carryFrom": "2026-11-08"
    },
    {
      "id": "nx-2026-11-08-8",
      "title": "Editor, chỉnh sửa clip với Claude skill",
      "goalId": "g3",
      "estimateMin": null,
      "deadline": null,
      "createdAt": "2026-11-08",
      "status": "open",
      "matrix": "schedule",
      "source": "next_step",
      "carryFrom": "2026-11-08"
    }
  ],
  "dayTemplate": [
    {
      "start": "00:00",
      "end": "07:00",
      "kind": "sleep",
      "title": "Ngủ",
      "goalMinutes": {}
    },
    {
      "start": "07:00",
      "end": "08:00",
      "kind": "personal",
      "title": "Thức dậy, ăn sáng",
      "goalMinutes": {}
    },
    {
      "start": "08:00",
      "end": "08:30",
      "kind": "planning",
      "title": "Lập kế hoạch ngày: xem mục tiêu, chọn 3 việc",
      "goalMinutes": {}
    },
    {
      "start": "08:30",
      "end": "10:00",
      "kind": "goal_work",
      "title": "Khối sâu 1: xây app",
      "goalMinutes": {
        "g2": 90
      }
    },
    {
      "start": "10:00",
      "end": "12:00",
      "kind": "meeting",
      "title": "Họp và việc chen ngang",
      "goalMinutes": {}
    },
    {
      "start": "12:00",
      "end": "13:00",
      "kind": "personal",
      "title": "Ăn trưa, nghỉ",
      "goalMinutes": {}
    },
    {
      "start": "13:00",
      "end": "13:30",
      "kind": "goal_work",
      "title": "Kênh AI: tìm chủ đề, viết kịch bản",
      "goalMinutes": {
        "g3": 30
      }
    },
    {
      "start": "13:30",
      "end": "14:30",
      "kind": "goal_work",
      "title": "Khối sâu 2: 45 phút thử công cụ AI cho clip, 15 phút xây app",
      "goalMinutes": {
        "g1": 45,
        "g2": 15
      }
    },
    {
      "start": "14:30",
      "end": "16:30",
      "kind": "interruption_buffer",
      "title": "Khung chen ngang: gọi điện, quyết định nhanh",
      "goalMinutes": {}
    },
    {
      "start": "16:30",
      "end": "17:30",
      "kind": "goal_work",
      "title": "Kênh AI: quay clip",
      "goalMinutes": {
        "g3": 60
      }
    },
    {
      "start": "17:30",
      "end": "18:00",
      "kind": "planning",
      "title": "Tổng kết ngày, chọn việc số 1 cho ngày mai",
      "goalMinutes": {}
    },
    {
      "start": "18:00",
      "end": "22:00",
      "kind": "personal",
      "title": "Ăn tối, thời gian cá nhân",
      "goalMinutes": {}
    },
    {
      "start": "22:00",
      "end": "23:00",
      "kind": "personal",
      "title": "Thư giãn, chuẩn bị ngủ",
      "goalMinutes": {}
    },
    {
      "start": "23:00",
      "end": "24:00",
      "kind": "sleep",
      "title": "Ngủ",
      "goalMinutes": {}
    }
  ],
  "days": [
    {
      "date": "2026-11-01",
      "blockResults": [],
      "interruptions": []
    },
    {
      "date": "2026-11-02",
      "blockResults": [
        {
          "blockStart": "08:00",
          "blockEnd": "08:30",
          "title": "Lập kế hoạch ngày: xem mục tiêu, chọn 3 việc",
          "goalMinutes": {},
          "result": "done",
          "note": "Ghi trước khi lịch mẫu đổi ngày 2/11; tên khối có thể lệch"
        },
        {
          "blockStart": "08:30",
          "blockEnd": "10:00",
          "title": "Khối sâu 1: xây app",
          "goalMinutes": {
            "g2": 90
          },
          "result": "done",
          "note": "Ghi trước khi lịch mẫu đổi ngày 2/11; tên khối có thể lệch"
        },
        {
          "blockStart": "10:00",
          "blockEnd": "12:00",
          "title": "Họp và việc chen ngang",
          "goalMinutes": {},
          "result": "done",
          "note": "Ghi trước khi lịch mẫu đổi ngày 2/11; tên khối có thể lệch"
        },
        {
          "blockStart": "13:00",
          "blockEnd": "13:30",
          "title": "Kênh AI: tìm chủ đề, viết kịch bản",
          "goalMinutes": {
            "g3": 30
          },
          "result": "done",
          "note": "Ghi trước khi lịch mẫu đổi ngày 2/11; tên khối có thể lệch"
        },
        {
          "blockStart": "13:30",
          "blockEnd": "14:30",
          "title": "Khối sâu 2: 45 phút thử công cụ AI cho clip, 15 phút xây app",
          "goalMinutes": {
            "g1": 45,
            "g2": 15
          },
          "result": "done",
          "note": "Ghi trước khi lịch mẫu đổi ngày 2/11; tên khối có thể lệch"
        },
        {
          "blockStart": "16:30",
          "blockEnd": "17:30",
          "title": "Kênh AI: quay clip",
          "goalMinutes": {
            "g3": 60
          },
          "result": "partly_done",
          "note": "Ghi trước khi lịch mẫu đổi ngày 2/11; tên khối có thể lệch",
          "nextStep": "Cần lên kịch bản/ chọn kịch bản"
        }
      ],
      "interruptions": [
        {
          "time": "17:07",
          "minutes": 120,
          "category": "chat",
          "decision": "now",
          "note": ""
        }
      ],
      "dayClosedAt": "19:14",
      "backfill": [
        {
          "start": "20:00",
          "end": "20:30",
          "kind": "personal",
          "title": "Ăn tối",
          "goalId": null,
          "origin": "planned",
          "source": "chat_with_claude"
        },
        {
          "start": "20:30",
          "end": "21:00",
          "kind": "personal",
          "title": "Di chuyển",
          "goalId": null,
          "origin": "planned",
          "source": "chat_with_claude"
        },
        {
          "start": "21:00",
          "end": "22:00",
          "kind": "personal",
          "title": "Đi bộ (vận động)",
          "goalId": null,
          "origin": "planned",
          "source": "chat_with_claude"
        }
      ]
    },
    {
      "date": "2026-11-03",
      "blockResults": [],
      "interruptions": [],
      "backfill": [
        {
          "start": "12:05",
          "end": "19:00",
          "kind": "goal_work",
          "title": "Làm spec, mockup, kho ý tưởng marketing cho TAIO Time App với Claude",
          "goalId": "g2",
          "origin": "unplanned_on_goal",
          "source": "chat_with_claude"
        },
        {
          "start": "19:00",
          "end": "20:00",
          "kind": "personal",
          "title": "Di chuyển về nhà, ăn cơm, rửa chén",
          "goalId": null,
          "origin": "planned",
          "source": "chat_with_claude"
        },
        {
          "start": "20:00",
          "end": "01:00",
          "kind": "goal_work",
          "title": "Tiếp tục spec với Claude, xen kẽ (thời lượng chưa rõ)",
          "goalId": "g2",
          "origin": "unplanned_on_goal",
          "source": "chat_with_claude"
        }
      ],
      "displaced": [
        {
          "title": "Kênh AI: viết kịch bản",
          "minutes": 30
        },
        {
          "title": "Kênh AI: quay clip",
          "minutes": 60
        },
        {
          "title": "Khối sâu 2 (thử công cụ AI)",
          "minutes": 60
        },
        {
          "title": "Ăn trưa, nghỉ",
          "minutes": 55
        },
        {
          "title": "Tổng kết ngày",
          "minutes": 30
        }
      ],
      "notes": "Cả ngày gần như dành cho TAIO Time App và TAIO Studio; giờ làm TAIO Studio chưa rõ. Chưa quay clip."
    },
    {
      "date": "2026-11-04",
      "blockResults": [
        {
          "blockStart": "08:30",
          "blockEnd": "10:00",
          "title": "Khối sâu 1: xây app",
          "goalMinutes": {
            "g2": 90
          },
          "result": "done"
        },
        {
          "blockStart": "13:00",
          "blockEnd": "13:30",
          "title": "Kênh AI: tìm chủ đề, viết kịch bản",
          "goalMinutes": {
            "g3": 30
          },
          "result": "partly_done",
          "nextStep": "Thực hiện 1 kịch bản content thực tế"
        },
        {
          "blockStart": "13:30",
          "blockEnd": "14:30",
          "title": "Khối sâu 2: 45 phút thử công cụ AI cho clip, 15 phút xây app",
          "goalMinutes": {
            "g1": 45,
            "g2": 15
          },
          "result": "partly_done",
          "nextStep": "Xây dựng AI Agent Nội dung cho TAIO"
        },
        {
          "blockStart": "16:30",
          "blockEnd": "17:30",
          "title": "Kênh AI: quay clip",
          "goalMinutes": {
            "g3": 60
          },
          "result": "not_done",
          "timeUsedFor": "Làm tiếp: Khối sâu 2: 45 phút thử công cụ AI cho clip, 15 phút xây app",
          "movedTo": "tomorrow"
        }
      ],
      "interruptions": [],
      "dayClosedAt": "22:23",
      "topTaskTomorrow": "Gửi đơn khiếu nại mới",
      "undeclaredLabel": "Khác"
    },
    {
      "date": "2026-11-08",
      "blockResults": [
        {
          "blockStart": "08:30",
          "blockEnd": "10:00",
          "title": "Khối sâu 1: xây app",
          "goalMinutes": {
            "g2": 90
          },
          "result": "done"
        },
        {
          "blockStart": "13:00",
          "blockEnd": "13:30",
          "title": "Kênh AI: tìm chủ đề, viết kịch bản",
          "goalMinutes": {
            "g3": 30
          },
          "result": "partly_done",
          "nextStep": "Edit clip"
        },
        {
          "blockStart": "13:30",
          "blockEnd": "14:30",
          "title": "Khối sâu 2: 45 phút thử công cụ AI cho clip, 15 phút xây app",
          "goalMinutes": {
            "g1": 45,
            "g2": 15
          },
          "result": "not_done",
          "timeUsedFor": "Làm tiếp: Kênh AI: tìm chủ đề, viết kịch bản",
          "movedTo": "later_today"
        },
        {
          "blockStart": "16:30",
          "blockEnd": "17:30",
          "title": "Kênh AI: quay clip",
          "goalMinutes": {
            "g3": 60
          },
          "result": "partly_done",
          "nextStep": "Editor, chỉnh sửa clip với Claude skill"
        }
      ],
      "interruptions": []
    }
  ],
  "notes": [
    "ID trong file giữ ổn định: nhập lại nhiều lần không tạo bản trùng.",
    "Kết quả khối việc ngày 1/11 và 2/11 được ghi trước khi lịch mẫu đổi, tên khối có thể lệch.",
    "Bộ đếm clip Kênh AI để 0 vì chưa có clip nào được ghi nhận."
  ]
} as const;
