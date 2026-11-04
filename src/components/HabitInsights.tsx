'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HabitCard, WeeklyExperiment } from '../types';
import { 
  TrendingUp, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  X, 
  Flame, 
  Calendar, 
  Compass, 
  Lightbulb, 
  ArrowUpRight, 
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Zap,
  Moon
} from 'lucide-react';

export const HabitInsights: React.FC = () => {
  const { 
    habitCards, 
    experiments, 
    handleHabitAction, 
    keepExperiment, 
    profile, 
    language,
    openDrilldown 
  } = useApp();

  const [activeMetric, setActiveMetric] = useState<'completion' | 'deep' | 'interruptions' | 'bedtime'>('completion');

  // Trend data mock for 7 days
  const trendDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'Hôm nay'];
  const metricsData = {
    completion: {
      label: 'Tỷ lệ hoàn thành nhiệm vụ (%)',
      unit: '%',
      values: [72, 80, 88, 65, 84, 91, 86],
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      description: 'Trung bình đạt 81% kế hoạch đề ra, cao hơn 14% so với tuần trước.',
    },
    deep: {
      label: 'Thời gian làm việc sâu (Phút/ngày)',
      unit: 'phút',
      values: [135, 180, 210, 120, 195, 225, 190],
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      description: 'Duy trì trên 180 phút tập trung sâu trong 5/7 ngày gần nhất.',
    },
    interruptions: {
      label: 'Phút gián đoạn thực tế vs Dự phòng (90p)',
      unit: 'phút',
      values: [45, 70, 35, 95, 50, 25, 40],
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      description: 'Chỉ có 1 ngày duy nhất (T5) vượt quỹ dự phòng 90 phút.',
    },
    bedtime: {
      label: 'Độ lệch giờ đi ngủ (phút trễ)',
      unit: 'phút trễ',
      values: [15, 30, 0, 45, 20, 0, 10],
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      description: 'Giờ đi ngủ trung bình lệch 17 phút so với neo cá nhân (23:00).',
    },
  };

  const currentMetricObj = metricsData[activeMetric];

  // Slip map data (heat spots of deviation)
  const slipSpots = [
    { time: '09:00 - 10:30', level: 'low', label: 'Vùng vàng: Tỷ lệ giữ lịch 94%', type: 'focus' },
    { time: '10:45 - 11:30', level: 'medium', label: 'Dễ trượt: Bắt đầu mệt, lướt tin tức & trao đổi lẻ', type: 'drift' },
    { time: '14:00 - 15:30', level: 'low', label: 'Vùng vàng: Buổi chiều bắt nhịp tốt', type: 'focus' },
    { time: '15:45 - 16:45', level: 'high', label: 'Điểm nóng chệch hướng: Khách gọi, họp phát sinh', type: 'interruption' },
    { time: '20:00 - 21:30', level: 'low', label: 'Cá nhân & Gia đình êm đềm', type: 'personal' },
    { time: '22:30 - 23:45', level: 'medium', label: 'Dễ trượt: Cố xem nốt màn hình gây chậm giờ ngủ', type: 'sleep_drift' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Overview Banner */}
      <div className="p-5 bg-gradient-to-r from-purple-950/60 via-gray-900 to-indigo-950/50 border border-purple-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Dấu vết Thói quen (Habit Insights & Patterns)
              <span className="text-[11px] font-mono bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                PRD v0.10 B15
              </span>
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              So sánh Kế hoạch vs Thực tế • Tìm ra quy luật tự nhiên của bạn để tối ưu bền vững, không phán xét.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 shrink-0">
          <Moon className="w-4 h-4 text-purple-400" />
          <div className="text-xs">
            <span className="text-gray-400 block text-[10px]">Neo giấc ngủ cá nhân</span>
            <span className="font-bold text-slate-900">{profile.personalAnchors.windDownTime}</span>
          </div>
        </div>
      </div>

      {/* Plan vs Actual Comparative Timeline Visual */}
      <div className="p-5 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Kế hoạch vs Thực tế hôm nay (Plan vs Actual Timeline)</span>
          </h3>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            Khớp 84% kế hoạch
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Xem sự khác biệt giữa các khối bạn đã lên lịch và dòng chảy thời gian thực tế diễn ra.
        </p>

        {/* Timeline Comparison Tracks */}
        <div className="pt-2 space-y-2.5 font-mono text-xs">
          {/* Plan Row */}
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span className="font-sans font-bold text-gray-300">Kế hoạch đã lập (Plan)</span>
              <span>08:00 - 18:00</span>
            </div>
            <div className="h-7 w-full bg-gray-950 rounded-xl overflow-hidden flex p-1 gap-1 border border-gray-800">
              <div style={{ width: '30%' }} className="h-full bg-indigo-600/80 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1">
                09:00 Việc sâu (90p)
              </div>
              <div style={{ width: '20%' }} className="h-full bg-purple-600/80 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1">
                11:00 Họp tuần (60p)
              </div>
              <div style={{ width: '20%' }} className="h-full bg-amber-600/80 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1">
                14:00 Quỹ gián đoạn (60p)
              </div>
              <div style={{ width: '30%' }} className="h-full bg-indigo-600/80 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1">
                15:30 Hoàn thiện App (90p)
              </div>
            </div>
          </div>

          {/* Actual Row */}
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span className="font-sans font-bold text-gray-300">Thực tế diễn ra (Actual)</span>
              <span>Ghi nhận liên tục</span>
            </div>
            <div className="h-7 w-full bg-gray-950 rounded-xl overflow-hidden flex p-1 gap-1 border border-gray-800">
              <div style={{ width: '32%' }} className="h-full bg-emerald-600/90 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1">
                ✓ Xong việc sâu (95p)
              </div>
              <div style={{ width: '18%' }} className="h-full bg-purple-600/90 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1">
                ✓ Họp tuần (50p)
              </div>
              <div style={{ width: '15%' }} className="h-full bg-amber-500/90 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1 font-bold">
                ⚡ Chen ngang (40p)
              </div>
              <div style={{ width: '35%' }} className="h-full bg-indigo-600/90 rounded flex items-center justify-center text-[10px] text-slate-900 truncate px-1">
                ● Đang làm App (còn 38p)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Trend Lines (4 Metrics Switcher) */}
      <div className="p-5 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Đường xu hướng hành vi 7 ngày (Behavior Trend Lines)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{currentMetricObj.description}</p>
          </div>

          {/* Metric Selector Chips */}
          <div className="flex items-center gap-1.5 flex-wrap bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveMetric('completion')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'completion' ? 'bg-emerald-600 text-slate-900' : 'text-gray-400 hover:text-slate-900'
              }`}
            >
              Hoàn thành %
            </button>
            <button
              onClick={() => setActiveMetric('deep')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'deep' ? 'bg-indigo-600 text-slate-900' : 'text-gray-400 hover:text-slate-900'
              }`}
            >
              Việc sâu (phút)
            </button>
            <button
              onClick={() => setActiveMetric('interruptions')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'interruptions' ? 'bg-amber-600 text-slate-900' : 'text-gray-400 hover:text-slate-900'
              }`}
            >
              Gián đoạn
            </button>
            <button
              onClick={() => setActiveMetric('bedtime')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'bedtime' ? 'bg-purple-600 text-slate-900' : 'text-gray-400 hover:text-slate-900'
              }`}
            >
              Lệch giờ ngủ
            </button>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-4 pb-2">
          <div className="h-36 flex items-end gap-2 sm:gap-4 px-2 border-b border-gray-800">
            {trendDays.map((day, idx) => {
              const val = currentMetricObj.values[idx];
              const maxVal = Math.max(...currentMetricObj.values, 100);
              const heightPct = Math.max(15, Math.round((val / maxVal) * 100));

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="text-[10px] font-mono text-gray-400 group-hover:text-slate-900 transition-colors">
                    {val}{activeMetric === 'completion' ? '%' : 'p'}
                  </div>
                  <div className="w-full bg-gray-950 rounded-t-lg h-28 flex items-end p-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full ${currentMetricObj.color} rounded-t transition-all group-hover:brightness-125`}
                      title={`${day}: ${val} ${currentMetricObj.unit}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 group-hover:text-slate-900">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slip Map (Bản đồ trượt) */}
      <div className="p-5 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Bản đồ trượt trong ngày (Slip Map)</span>
          </h3>
          <span className="text-xs text-gray-400">Khám phá các khung giờ rủi ro cao</span>
        </div>
        <p className="text-xs text-gray-400">
          Xác định chính xác thời điểm bạn thường bị ngắt dòng chảy nhất để chuẩn bị tâm lý và đặt rào cản mềm.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {slipSpots.map((spot, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border transition-all ${
                spot.level === 'high'
                  ? 'bg-red-950/30 border-red-800/50 text-red-200'
                  : spot.level === 'medium'
                  ? 'bg-amber-950/25 border-amber-800/40 text-amber-200'
                  : 'bg-emerald-950/20 border-emerald-800/30 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs font-bold mb-1">
                <span>{spot.time}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-sans ${
                  spot.level === 'high' ? 'bg-red-900/60 text-red-300' :
                  spot.level === 'medium' ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'
                }`}>
                  {spot.level === 'high' ? 'Điểm nóng' : spot.level === 'medium' ? 'Cần chú ý' : 'An toàn'}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 leading-snug">{spot.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Cards (Thẻ thói quen: Keep, Change, Suggestion) */}
      <div className="p-5 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Thẻ Thói quen từ Dữ liệu thực (Habit Cards)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Học tự động từ dữ liệu 1-2 tuần sử dụng • Đề xuất điều chỉnh vi mô không phán xét
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habitCards.map((card) => {
            const isKeep = card.type === 'keep';
            const isChange = card.type === 'change';

            return (
              <div
                key={card.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm transition-all ${
                  isKeep 
                    ? 'bg-emerald-950/20 border-emerald-500/40' 
                    : isChange 
                    ? 'bg-amber-950/20 border-amber-500/40' 
                    : 'bg-indigo-950/20 border-indigo-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isKeep ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      isChange ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {isKeep ? 'Thói quen nên giữ' : isChange ? 'Thói quen cần sửa' : 'Gợi ý tuần này'}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      Độ tự tin: <strong className="text-slate-900">{card.confidence}%</strong>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">{card.title}</h4>
                  
                  <div className="space-y-1 text-xs text-gray-300 mb-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <p><strong className="text-gray-400 font-normal">Minh chứng:</strong> {card.evidence}</p>
                    <p><strong className="text-gray-400 font-normal">Hành động gợi ý:</strong> {card.suggestedStep}</p>
                  </div>
                </div>

                {/* 1-tap Actions on Habit Card */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  {card.status === 'trying' ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đang thử nghiệm tuần này
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleHabitAction(card.id, 'dismiss')}
                        className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-slate-900 rounded-lg hover:bg-white/5"
                      >
                        Để sau
                      </button>
                      <button
                        onClick={() => handleHabitAction(card.id, 'inaccurate')}
                        className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5"
                      >
                        Chưa chính xác
                      </button>
                      <button
                        onClick={() => handleHabitAction(card.id, 'try')}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-900 shadow-sm flex items-center gap-1"
                      >
                        Thử tuần này <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Experiment Loop (Vòng lặp thử nghiệm tuần) */}
      <div className="p-5 bg-gradient-to-r from-indigo-950/40 via-gray-900 to-purple-950/40 border border-indigo-500/30 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vòng lặp Thử nghiệm Tuần (Weekly Experiment)</h3>
              <p className="text-xs text-gray-400">Mỗi tuần chọn tối đa 1 thay đổi nhỏ để kiểm nghiệm trước khi quyết định giữ lại.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{exp.habit}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    exp.status === 'kept' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                  }`}>
                    {exp.status === 'kept' ? 'Đã giữ vĩnh viễn' : 'Đang thử nghiệm'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                  <span>Mốc ban đầu: <strong className="text-gray-300">{exp.baseline}</strong></span>
                  <span>Kết quả hiện tại: <strong className="text-emerald-400">{exp.result}</strong></span>
                </div>
              </div>

              {exp.status === 'running' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => keepExperiment(exp.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-xs font-semibold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Giữ thói quen này
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
