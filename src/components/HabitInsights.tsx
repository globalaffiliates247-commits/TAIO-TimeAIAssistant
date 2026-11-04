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
    openDrilldown,
    palette
  } = useApp();

  const isCool = palette === 'cool';

  const [activeMetric, setActiveMetric] = useState<'completion' | 'deep' | 'interruptions' | 'bedtime'>('completion');

  // Trend data mock for 7 days
  const trendDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'Hôm nay'];
  const metricsData = {
    completion: {
      label: 'Tỷ lệ hoàn thành nhiệm vụ (%)',
      unit: '%',
      values: [72, 80, 88, 65, 84, 91, 86],
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      description: 'Trung bình đạt 81% kế hoạch đề ra, cao hơn 14% so với tuần trước.',
    },
    deep: {
      label: 'Thời gian làm việc sâu (Phút/ngày)',
      unit: 'phút',
      values: [135, 180, 210, 120, 195, 225, 190],
      color: isCool ? 'bg-blue-600' : 'bg-[#E0401F]',
      textColor: isCool ? 'text-blue-700' : 'text-[#E0401F]',
      description: 'Duy trì trên 180 phút tập trung sâu trong 5/7 ngày gần nhất.',
    },
    interruptions: {
      label: 'Phút gián đoạn thực tế vs Dự phòng (90p)',
      unit: 'phút',
      values: [45, 70, 35, 95, 50, 25, 40],
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      description: 'Chỉ có 1 ngày duy nhất (T5) vượt quỹ dự phòng 90 phút.',
    },
    bedtime: {
      label: 'Độ lệch giờ đi ngủ (phút trễ)',
      unit: 'phút trễ',
      values: [15, 30, 0, 45, 20, 0, 10],
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
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
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
            isCool ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-red-50 border-red-200 text-[#E0401F]'
          }`}>
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Dấu vết Thói quen (Habit Insights & Patterns)
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 font-semibold">
                B15
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh Kế hoạch vs Thực tế • Tìm ra quy luật tự nhiên của bạn để tối ưu bền vững, không phán xét.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
          <Moon className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
          <div className="text-xs">
            <span className="text-slate-500 block text-[10px]">Neo giấc ngủ cá nhân</span>
            <span className="font-bold text-slate-900">{profile.personalAnchors.windDownTime}</span>
          </div>
        </div>
      </div>

      {/* Plan vs Actual Comparative Timeline Visual */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
            <span>Kế hoạch vs Thực tế hôm nay (Plan vs Actual Timeline)</span>
          </h3>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Khớp 84% kế hoạch
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Xem sự khác biệt giữa các khối bạn đã lên lịch và dòng chảy thời gian thực tế diễn ra.
        </p>

        {/* Timeline Comparison Tracks */}
        <div className="pt-2 space-y-3 font-mono text-xs">
          {/* Plan Row */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-sans font-bold text-slate-700">Kế hoạch đã lập (Plan)</span>
              <span>08:00 - 18:00</span>
            </div>
            <div className="h-8 w-full bg-slate-100 rounded-xl overflow-hidden flex p-1 gap-1 border border-slate-200">
              <div style={{ width: '30%' }} className="h-full bg-blue-100 text-blue-800 border border-blue-200 rounded-lg flex items-center justify-center text-[10px] font-semibold truncate px-1">
                09:00 Việc sâu (90p)
              </div>
              <div style={{ width: '20%' }} className="h-full bg-purple-100 text-purple-800 border border-purple-200 rounded-lg flex items-center justify-center text-[10px] font-semibold truncate px-1">
                11:00 Họp tuần (60p)
              </div>
              <div style={{ width: '20%' }} className="h-full bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center justify-center text-[10px] font-semibold truncate px-1">
                14:00 Quỹ gián đoạn (60p)
              </div>
              <div style={{ width: '30%' }} className="h-full bg-blue-100 text-blue-800 border border-blue-200 rounded-lg flex items-center justify-center text-[10px] font-semibold truncate px-1">
                15:30 Hoàn thiện App (90p)
              </div>
            </div>
          </div>

          {/* Actual Row */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-sans font-bold text-slate-700">Thực tế diễn ra (Actual)</span>
              <span>Ghi nhận liên tục</span>
            </div>
            <div className="h-8 w-full bg-slate-100 rounded-xl overflow-hidden flex p-1 gap-1 border border-slate-200">
              <div style={{ width: '32%' }} className="h-full bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center justify-center text-[10px] font-bold truncate px-1">
                ✓ Xong việc sâu (95p)
              </div>
              <div style={{ width: '18%' }} className="h-full bg-purple-100 text-purple-800 border border-purple-200 rounded-lg flex items-center justify-center text-[10px] font-semibold truncate px-1">
                ✓ Họp tuần (50p)
              </div>
              <div style={{ width: '15%' }} className="h-full bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center justify-center text-[10px] font-bold truncate px-1">
                ⚡ Chen ngang (40p)
              </div>
              <div style={{ width: '35%' }} className="h-full bg-sky-100 text-sky-800 border border-sky-200 rounded-lg flex items-center justify-center text-[10px] font-semibold truncate px-1">
                ● Đang làm App (còn 38p)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Trend Lines (4 Metrics Switcher) */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Đường xu hướng hành vi 7 ngày (Behavior Trend Lines)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentMetricObj.description}</p>
          </div>

          {/* Metric Selector Chips */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveMetric('completion')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'completion' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoàn thành %
            </button>
            <button
              onClick={() => setActiveMetric('deep')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'deep' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Việc sâu (phút)
            </button>
            <button
              onClick={() => setActiveMetric('interruptions')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'interruptions' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gián đoạn
            </button>
            <button
              onClick={() => setActiveMetric('bedtime')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetric === 'bedtime' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lệch giờ ngủ
            </button>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-4 pb-2">
          <div className="h-36 flex items-end gap-2 sm:gap-4 px-2 border-b border-slate-200">
            {trendDays.map((day, idx) => {
              const val = currentMetricObj.values[idx];
              const maxVal = Math.max(...currentMetricObj.values, 100);
              const heightPct = Math.max(15, Math.round((val / maxVal) * 100));

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900 transition-colors font-medium">
                    {val}{activeMetric === 'completion' ? '%' : 'p'}
                  </div>
                  <div className="w-full bg-slate-100 rounded-t-lg h-28 flex items-end p-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full ${currentMetricObj.color} rounded-t transition-all group-hover:brightness-95`}
                      title={`${day}: ${val} ${currentMetricObj.unit}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slip Map (Bản đồ trượt) */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Bản đồ trượt trong ngày (Slip Map)</span>
          </h3>
          <span className="text-xs text-slate-500">Khám phá các khung giờ rủi ro cao</span>
        </div>
        <p className="text-xs text-slate-500">
          Xác định chính xác thời điểm bạn thường bị ngắt dòng chảy nhất để chuẩn bị tâm lý và đặt rào cản mềm.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {slipSpots.map((spot, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border transition-all ${
                spot.level === 'high'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : spot.level === 'medium'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs font-bold mb-1">
                <span>{spot.time}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-sans font-bold ${
                  spot.level === 'high' ? 'bg-rose-200/70 text-rose-800' :
                  spot.level === 'medium' ? 'bg-amber-200/70 text-amber-800' : 'bg-emerald-200/70 text-emerald-800'
                }`}>
                  {spot.level === 'high' ? 'Điểm nóng' : spot.level === 'medium' ? 'Cần chú ý' : 'An toàn'}
                </span>
              </div>
              <p className="text-xs mt-1 leading-snug font-medium">{spot.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Cards (Thẻ thói quen: Keep, Change, Suggestion) */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Thẻ Thói quen từ Dữ liệu thực (Habit Cards)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
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
                className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs transition-all ${
                  isKeep 
                    ? 'bg-white border-emerald-200' 
                    : isChange 
                    ? 'bg-white border-amber-200' 
                    : 'bg-white border-blue-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isKeep ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isChange ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {isKeep ? 'Thói quen nên giữ' : isChange ? 'Thói quen cần sửa' : 'Gợi ý tuần này'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Độ tự tin: <strong className="text-slate-800 font-bold">{card.confidence}%</strong>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">{card.title}</h4>
                  
                  <div className="space-y-1 text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <p><strong className="text-slate-500 font-medium">Minh chứng:</strong> {card.evidence}</p>
                    <p><strong className="text-slate-500 font-medium">Hành động gợi ý:</strong> {card.suggestedStep}</p>
                  </div>
                </div>

                {/* 1-tap Actions on Habit Card */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {card.status === 'trying' ? (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đang thử nghiệm tuần này
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleHabitAction(card.id, 'dismiss')}
                        className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Để sau
                      </button>
                      <button
                        onClick={() => handleHabitAction(card.id, 'inaccurate')}
                        className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Chưa chính xác
                      </button>
                      <button
                        onClick={() => handleHabitAction(card.id, 'try')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg text-white shadow-xs flex items-center gap-1 transition-colors ${
                          isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
                        }`}
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
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isCool ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-[#E0401F] border-red-200'
            }`}>
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vòng lặp Thử nghiệm Tuần (Weekly Experiment)</h3>
              <p className="text-xs text-slate-500">Mỗi tuần chọn tối đa 1 thay đổi nhỏ để kiểm nghiệm trước khi quyết định giữ lại.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{exp.habit}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    exp.status === 'kept' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {exp.status === 'kept' ? 'Đã giữ vĩnh viễn' : 'Đang thử nghiệm'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                  <span>Mốc ban đầu: <strong className="text-slate-700 font-bold">{exp.baseline}</strong></span>
                  <span>Kết quả hiện tại: <strong className="text-emerald-600 font-bold">{exp.result}</strong></span>
                </div>
              </div>

              {exp.status === 'running' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => keepExperiment(exp.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
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
