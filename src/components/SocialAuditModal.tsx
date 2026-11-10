'use client';
// PRD B12 (v0.3.24): shows the user's own social evenings and their next-day cost.
// Numbers come from socialAuditModel.ts; no sample scenario is ever shown as if it were real.
import React from 'react';
import { useApp } from '../context/AppContext';
import { Wine, X, CalendarClock } from 'lucide-react';
import {
  buildSocialAudit,
  formatHours,
  SOCIAL_BUDGET,
} from '../features/social-audit/socialAuditModel';

export const SocialAuditModal: React.FC = () => {
  const { socialAuditModalOpen, setSocialAuditModalOpen, profile, setProfile, interruptions, blocks } = useApp();
  if (!socialAuditModalOpen) return null;

  const ageBand = profile.ageBand || '<45';
  const audit = buildSocialAudit(interruptions, blocks, profile.focusBlockDurationMins);
  const close = () => setSocialAuditModalOpen(false);
  const { latest, nextDay } = audit;

  const workItem = nextDay && nextDay.missedWork.length > 0 && (
    <CostRow key="work" title="Công việc bị trễ hoặc dời" lines={nextDay.missedWork} />
  );
  const relationItem = nextDay && nextDay.movedMeetings.length > 0 && (
    <CostRow key="rel" title="Hẹn và cam kết bị ảnh hưởng" lines={nextDay.movedMeetings} />
  );
  // Spec B12 order: health first for 45+, then work, then relationships. The app has no sleep or
  // health data yet, so health is not shown (facts only, never inferred) and work/relationships keep their order.
  const ordered = [workItem, relationItem].filter(Boolean);

  return (
    <div className="fixed app-overlay-safe z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl p-6 sm:p-7 text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><Wine className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Giao lưu ngoài giờ</h3>
              <p className="text-xs text-slate-500">Thời gian thật của các buổi tối · không phán xét, không cấm đoán</p>
            </div>
          </div>
          <button onClick={close} aria-label="Đóng" className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
        </div>

        {!latest ? (
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 space-y-2">
            <p className="font-semibold">Chưa có buổi giao lưu nào được ghi nhận.</p>
            <p>Khi có ai rủ đi, mở thẻ chen ngang và chọn <strong>“Đi, có giờ về”</strong>. App sẽ cộng thời gian di chuyển, nhắc giờ về, và sáng hôm sau cho bạn thấy việc nào bị ảnh hưởng.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800">Buổi gần nhất{latest.date ? ` · ${latest.date.split('-').reverse().slice(0, 2).join('/')}` : ''}</span>
                <span className="text-amber-800">Bắt đầu {latest.startTime}{latest.endTime ? ` · hẹn về ${latest.endTime}` : ''}</span>
              </div>
              <p className="text-sm text-slate-700">{latest.title}</p>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Tổng thời gian" value={formatHours(latest.totalMinutes)} sub={`${formatHours(latest.outMinutes)} ở ngoài + ${formatHours(latest.travelMinutes)} di chuyển`} />
                <Stat label="Bằng số khối tập trung" value={`${audit.deepBlocksEquivalent} khối`} sub={`mỗi khối ${profile.focusBlockDurationMins} phút`} />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Sáng hôm sau</h4>
              {!nextDay ? (
                <p className="text-xs text-slate-500">Sáng hôm sau buổi giao lưu, mục này sẽ hiện những việc buổi sáng bị trễ hoặc dời.</p>
              ) : ordered.length > 0 ? ordered : (
                <p className="text-xs text-slate-600">Sáng nay chưa có khối việc nào bị lỡ. Giờ ngủ thật sẽ hiện ở đây khi bạn ghi nhận giờ ngủ.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-semibold flex items-center gap-1.5"><CalendarClock className="w-4 h-4" />Ngân sách giao lưu tuần này</span>
            <span className="font-bold text-slate-800">{audit.weekCount} / {SOCIAL_BUDGET.eveningsPerWeek} buổi · tối đa {SOCIAL_BUDGET.maxHoursEach} giờ mỗi buổi</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (audit.weekCount / SOCIAL_BUDGET.eveningsPerWeek) * 100)}%` }} />
          </div>
          {audit.weekOverLimit > 0 && (
            <p className="text-[11px] text-slate-600">{audit.weekOverLimit} buổi tuần này dài hơn {SOCIAL_BUDGET.maxHoursEach} giờ.</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Thứ tự ưu tiên theo tuổi:</span>
            {(['<45', '>=45'] as const).map(b => (
              <button key={b} type="button" onClick={() => setProfile({ ...profile, ageBand: b })}
                className={`px-2.5 py-1 rounded-lg border font-semibold ${ageBand === b ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-600'}`}>
                {b === '<45' ? 'Dưới 45' : 'Từ 45'}
              </button>
            ))}
          </div>
          <button onClick={close} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs">Đóng</button>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
    <span className="text-[11px] text-slate-500">{label}</span>
    <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
    <span className="text-[11px] text-slate-500">{sub}</span>
  </div>
);

const CostRow: React.FC<{ title: string; lines: string[] }> = ({ title, lines }) => (
  <div className="p-3.5 rounded-xl bg-white border border-slate-200">
    <span className="text-xs font-bold text-slate-800">{title}</span>
    <ul className="mt-1 text-xs text-slate-700 list-disc pl-4">{lines.map(l => <li key={l}>{l}</li>)}</ul>
  </div>
);
