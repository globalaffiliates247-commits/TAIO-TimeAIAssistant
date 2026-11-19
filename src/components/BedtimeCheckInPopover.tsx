'use client';
// PRD B12 & B14 (v0.3.10): Bedtime Check-in Popover
// Answers the morning question: "Đêm qua bạn ngủ lúc mấy giờ? (Tính chi phí ngày hôm sau)"
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Moon, X, Clock, Check, Lightbulb, ArrowRight } from 'lucide-react';
import { getDeviceCalendarDate, timeToMinutes } from '../core/clock';

const QUICK_TIMES = [
  '21:30', '22:00', '22:30', '23:00',
  '23:30', '00:00', '00:30', '01:00',
  '01:30', '02:00',
];

export const BedtimeCheckInPopover: React.FC = () => {
  const {
    bedtimePopoverOpen,
    setBedtimePopoverOpen,
    setSocialAuditModalOpen,
    profile,
    setProfile,
    setCelebrationMsg,
    setNotifications,
    language,
  } = useApp();

  const windDownTime = profile.personalAnchors?.windDownTime || '22:30';
  const initialTime = profile.lastBedtime?.time || '23:30';
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);

  useEffect(() => {
    if (bedtimePopoverOpen) {
      if (profile.lastBedtime?.time) {
        setSelectedTime(profile.lastBedtime.time);
      } else {
        setSelectedTime('23:30');
      }
    }
  }, [bedtimePopoverOpen, profile.lastBedtime]);

  if (!bedtimePopoverOpen) return null;

  const close = () => setBedtimePopoverOpen(false);

  // Calculate sleep duration until default wake-up 07:00
  const bedtimeMins = timeToMinutes(selectedTime);
  const wakeUpMins = 7 * 60; // 07:00
  let sleepDurationMins = 0;
  if (bedtimeMins >= 12 * 60) {
    // Went to bed before midnight: from bedtime to midnight + from midnight to 07:00
    sleepDurationMins = (1440 - bedtimeMins) + wakeUpMins;
  } else {
    // Went to bed after midnight
    sleepDurationMins = Math.max(0, wakeUpMins - bedtimeMins);
  }
  const sleepHours = Math.round((sleepDurationMins / 60) * 10) / 10;

  // Comparison with planned wind-down
  const windDownMins = timeToMinutes(windDownTime);
  const isLate = bedtimeMins > windDownMins || (bedtimeMins < 12 * 60 && windDownMins >= 12 * 60);
  let delayMinutes = 0;
  if (isLate) {
    if (bedtimeMins >= 12 * 60) {
      delayMinutes = bedtimeMins - windDownMins;
    } else {
      delayMinutes = (1440 - windDownMins) + bedtimeMins;
    }
  }

  const handleSave = () => {
    const today = getDeviceCalendarDate();
    const updatedProfile = {
      ...profile,
      lastBedtime: {
        date: today,
        time: selectedTime,
        targetTime: windDownTime,
        sleepDurationHours: sleepHours,
        recordedAt: Date.now(),
      },
    };
    setProfile(updatedProfile);

    // Mark sleep notifications as read
    setNotifications(prev =>
      prev.map(n => (n.targetAction === 'sleep' ? { ...n, read: true } : n))
    );

    const msg =
      language === 'vi'
        ? `✓ Đã ghi nhận giờ ngủ: ${selectedTime} (~${sleepHours} giờ ngủ)`
        : `✓ Bedtime recorded: ${selectedTime} (~${sleepHours} hrs sleep)`;
    setCelebrationMsg(msg);
    close();
  };

  const handleOpenSocialAudit = () => {
    handleSave();
    setSocialAuditModalOpen(true);
  };

  return (
    <div className="fixed app-overlay-safe z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 sm:p-7 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Đêm qua bạn ngủ lúc mấy giờ?
              </h3>
              <p className="text-xs text-slate-500">
                Ghi nhận trung thực · không phán xét, không cấm đoán
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Đóng"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule anchor reference */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4">
          <span className="text-slate-600 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Mốc nghỉ ngơi theo lịch:
          </span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
            {windDownTime}
          </span>
        </div>

        {/* Quick Selection Chips */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-slate-700">Chọn nhanh giờ ngủ:</label>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_TIMES.map(t => {
              const isSelected = selectedTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom time picker */}
        <div className="flex items-center justify-between pt-1 pb-3 text-xs border-b border-slate-100 mb-4">
          <span className="text-slate-500">Hoặc chọn giờ chính xác:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 font-semibold text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Live insight calculation */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-900 font-bold flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              {delayMinutes > 0
                ? `Trễ ${Math.floor(delayMinutes / 60) > 0 ? `${Math.floor(delayMinutes / 60)} giờ ` : ''}${delayMinutes % 60 ? `${delayMinutes % 60}p` : ''} so với mốc ${windDownTime}`
                : `Đúng mốc nghỉ ngơi (${windDownTime})`}
            </span>
            <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
              ~{sleepHours} giờ ngủ
            </span>
          </div>
          <p className="text-[11px] text-amber-900/85 leading-relaxed">
            {sleepHours < 7
              ? 'Thời lượng ngủ dưới 7 giờ. Năng lượng đầu ngày có thể bị trũng nhẹ; nên dồn việc quan trọng vào giữa buổi sáng.'
              : 'Thời lượng ngủ đảm bảo chu kỳ phục hồi thể lực và tập trung tốt cho hôm nay.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleSave}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Lưu giờ ngủ đêm qua
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleOpenSocialAudit}
              type="button"
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition"
            >
              <span>Xem chi phí ngày hôm sau (PRD B12)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={close}
              type="button"
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
