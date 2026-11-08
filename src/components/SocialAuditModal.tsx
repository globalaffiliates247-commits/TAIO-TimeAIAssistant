'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wine, 
  Clock, 
  Activity, 
  Briefcase, 
  Heart, 
  X, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const SocialAuditModal: React.FC = () => {
  const { socialAuditModalOpen, setSocialAuditModalOpen, profile, setProfile } = useApp();
  const [userAgeBand, setUserAgeBand] = useState<'<45' | '>=45'>(profile.ageBand || '<45');
  const [socialDurationHours, setSocialDurationHours] = useState<number>(3.0);
  const [travelMinutes, setTravelMinutes] = useState<number>(60); // 30m each way

  if (!socialAuditModalOpen) return null;

  const totalSocialTimeHours = socialDurationHours + (travelMinutes / 60);
  const equivalentDeepBlocks = Math.round((totalSocialTimeHours * 60) / profile.focusBlockDurationMins);

  return (
    <div className="fixed app-overlay-safe z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl p-6 sm:p-7 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Kiểm toán chi phí giao lưu ngoài giờ</h3>
              <p className="text-xs text-slate-500">Minh bạch cái giá thực tế của hoạt động buổi tối • Không phán xét, không cấm đoán</p>
            </div>
          </div>
          <button 
            onClick={() => setSocialAuditModalOpen(false)}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          
          {/* Tone Principle Alert */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <p>
              💡 <strong>Nguyên tắc cốt lõi:</strong> Giọng điệu trung tính, thực tế. Không tô đỏ, không tạo cảm giác tội lỗi, không đạo đức hóa về rượu bia hay đời sống xã hội. Mục tiêu duy nhất là <em>nhận thức rõ ràng và chủ động lựa chọn</em>.
            </p>
          </div>

          {/* User Age Band Config (PRD B12) */}
          <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Nhóm độ tuổi ưu tiên đánh giá:</label>
              <p className="text-[11px] text-slate-500">
                Thứ tự ưu tiên cảnh báo hệ quả sáng hôm sau phụ thuộc vào mốc tuổi (mặc định 45).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUserAgeBand('<45')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  userAgeBand === '<45' 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-100 border-slate-300 text-slate-500'
                }`}
              >
                Dưới 45 tuổi
              </button>
              <button
                type="button"
                onClick={() => setUserAgeBand('>=45')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  userAgeBand === '>=45' 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-100 border-slate-300 text-slate-500'
                }`}
              >
                Từ 45 tuổi trở lên
              </button>
            </div>
          </div>

          {/* Simulation Case: Founder Pilot Trigger */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Tình huống thực tế (Founder Pilot Case):
              </span>
              <span className="text-[11px] text-amber-400">Giao lưu đột xuất lúc 20:00</span>
            </div>
            <p className="text-xs text-slate-700">
              Nhận cuộc gọi hẹn gặp từ bạn bè lúc 20:00. Thực tế kéo dài <strong>2 giờ tại quán + 1 giờ di chuyển/chuẩn bị</strong>, vượt quá mốc thư giãn nghỉ ngơi 22:00.
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500">Tổng thời gian tiêu tốn</span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">{totalSocialTimeHours} tiếng</p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500">Quy đổi khối tập trung sâu</span>
                <p className="text-lg font-bold text-indigo-400 mt-0.5">~{equivalentDeepBlocks} khối ({profile.focusBlockDurationMins}p/khối)</p>
              </div>
            </div>
          </div>

          {/* Next-Day Cost Breakdown by Priority (PRD B12) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hệ quả sáng hôm sau (Hiển thị theo thứ tự ưu tiên {userAgeBand === '<45' ? 'Dưới 45 tuổi' : 'Từ 45 tuổi'}):
            </h4>

            {userAgeBand === '<45' ? (
              /* Under 45: 1. Work delayed -> 2. Relationships -> 3. Health */
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-700 uppercase">Ưu tiên 1: Công việc bị trễ / dời lại</span>
                    <p className="text-xs text-slate-700 mt-1">
                      Sáng nay: Khối tập trung sâu số 1 bắt đầu trễ 50 phút; Báo cáo kế hoạch cho đối tác Minh phải dời sang ngày mai.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-700 uppercase">Ưu tiên 2: Mối quan hệ & Cam kết bị ảnh hưởng</span>
                    <p className="text-xs text-slate-700 mt-1">
                      Họp đồng bộ sáng cùng đội ngũ phải lùi lại 30 phút; buổi chạy bộ cam kết cùng bạn bị hủy.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase">Ưu tiên 3: Sức khỏe & Thể lực</span>
                    <p className="text-xs text-slate-700 mt-1">
                      Thời lượng ngủ thực tế dưới 6 tiếng; chỉ số năng lượng buổi sáng giảm sút nhẹ.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Over 45: 1. Health -> 2. Work delayed -> 3. Relationships */
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-700 uppercase">Ưu tiên 1: Sức khỏe & Thể trạng</span>
                    <p className="text-xs text-slate-700 mt-1">
                      Thời lượng ngủ bị hụt mất 1.5 giờ so với nhịp chuẩn; thể trạng và năng lượng phục hồi cần thêm 4 tiếng nghỉ ngơi.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-700 uppercase">Ưu tiên 2: Công việc bị dời lịch</span>
                    <p className="text-xs text-slate-700 mt-1">
                      Khối xử lý hợp đồng quan trọng sáng nay phải chuyển sang buổi chiều; dời lịch họp khách hàng.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-700 uppercase">Ưu tiên 3: Cam kết cá nhân</span>
                    <p className="text-xs text-slate-700 mt-1">
                      Các buổi tập thể dục buổi sáng bị hoãn lại.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Social Time Budget Tracker */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">Ngân sách giao lưu tuần (Social Budget):</span>
              <span className="text-amber-400 font-bold">1 / 2 buổi (Tối đa 3h/buổi)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '50%' }} />
            </div>
            <p className="text-[11px] text-gray-500">
              Bạn vẫn còn 1 buổi trong ngân sách tuần này mà không làm xáo trộn tiến độ mục tiêu chính.
            </p>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setSocialAuditModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
            >
              Đã hiểu & Đóng bảng
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
