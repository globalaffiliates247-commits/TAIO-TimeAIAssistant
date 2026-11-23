'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROFILES } from '../data/mockData';
import { UserProfileType } from '../types';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  Target, 
  Briefcase, 
  Laptop, 
  Users, 
  Headphones, 
  Wrench, 
  Compass 
} from 'lucide-react';

const PROFILE_ICONS: Record<UserProfileType, any> = {
  owner: Briefcase,
  manager: Users,
  technical: Laptop,
  admin: Headphones,
  trade: Wrench,
  freelancer: Compass,
};

export const OnboardingModal: React.FC = () => {
  const { isOnboarded, setIsOnboarded, setProfile, profile, setCurrentTab, addNewBlock, importProfessionSeed } = useApp();
  const [selectedType, setSelectedType] = useState<UserProfileType>(profile.type);
  const [step, setStep] = useState<1 | 2>(1);
  const [weeklyTopFocus, setWeeklyTopFocus] = useState<string>('Hoàn thành bản nháp MVP cho TAIO Time App');
  const [seedSampleData, setSeedSampleData] = useState<boolean>(true);

  if (isOnboarded) return null;

  const currentSelectedProfile = PROFILES[selectedType];
  const IconComponent = PROFILE_ICONS[selectedType] || Briefcase;

  const handleFinishOnboarding = () => {
    setProfile(currentSelectedProfile);
    if (seedSampleData && importProfessionSeed) {
      importProfessionSeed(selectedType as any);
    }
    if (weeklyTopFocus.trim()) {
      addNewBlock({
        title: weeklyTopFocus,
        startTime: '16:00',
        endTime: '17:30',
        type: 'deep',
        status: 'planned',
        goalName: 'Ưu tiên số 1 tuần này',
      });
    }
    setIsOnboarded(true);
    setCurrentTab('now');
  };

  return (
    <div className="fixed app-overlay-safe z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl p-6 sm:p-8 text-slate-900">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thiết lập siêu tốc dưới 60 giây (Zero Jargon)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {step === 1 ? 'Mô tả nào giống bạn nhất?' : 'Xác nhận thông số mặc định'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 
              ? 'Chọn 1 trong 6 hồ sơ khởi đầu. TAIO sẽ tự động cấu hình lịch & khối tập trung.'
              : 'Mọi thông số đều được tính toán tự động từ hồ sơ của bạn. Có thể điều chỉnh bất kỳ lúc nào.'
            }
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(PROFILES).map((p) => {
                const Icon = PROFILE_ICONS[p.type] || Briefcase;
                const isSelected = selectedType === p.type;
                return (
                  <div
                    key={p.type}
                    onClick={() => setSelectedType(p.type)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900">{p.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Tập trung sâu: {p.split.deepWork}%</span>
                      <span>Dự phòng gián đoạn: {p.interruptionReserveMins}p</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
              >
                <span>Tiếp tục (Xem mặc định)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Profile Overview Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600 text-white">
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-slate-900">{currentSelectedProfile.title}</h4>
                  <button 
                    onClick={() => setStep(1)} 
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Đổi hồ sơ
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentSelectedProfile.description}</p>
              </div>
            </div>

            {/* Split Visualization */}
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Phân bổ thời gian mặc định mỗi ngày
              </h5>
              
              {/* Progress Bar Split */}
              <div className="h-4 rounded-full overflow-hidden flex bg-slate-100">
                <div 
                  style={{ width: `${currentSelectedProfile.split.deepWork}%` }} 
                  className="bg-indigo-500 h-full" 
                  title={`Tập trung sâu: ${currentSelectedProfile.split.deepWork}%`}
                />
                <div 
                  style={{ width: `${currentSelectedProfile.split.interruptions}%` }} 
                  className="bg-amber-500 h-full" 
                  title={`Dự phòng gián đoạn: ${currentSelectedProfile.split.interruptions}%`}
                />
                <div 
                  style={{ width: `${currentSelectedProfile.split.meetings}%` }} 
                  className="bg-purple-500 h-full" 
                  title={`Họp hành & trao đổi: ${currentSelectedProfile.split.meetings}%`}
                />
                {currentSelectedProfile.split.other > 0 && (
                  <div 
                    style={{ width: `${currentSelectedProfile.split.other}%` }} 
                    className="bg-gray-600 h-full" 
                    title={`Khác: ${currentSelectedProfile.split.other}%`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-600">Tập trung: {currentSelectedProfile.split.deepWork}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Gián đoạn: {currentSelectedProfile.split.interruptions}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-600">Họp hành: {currentSelectedProfile.split.meetings}%</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <p className="text-[11px] text-slate-500">Khối tập trung</p>
                <p className="text-lg font-bold text-indigo-400 mt-0.5">{currentSelectedProfile.focusBlockDurationMins} phút</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <p className="text-[11px] text-slate-500">Quỹ gián đoạn</p>
                <p className="text-lg font-bold text-amber-400 mt-0.5">{currentSelectedProfile.interruptionReserveMins} phút</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <p className="text-[11px] text-slate-500">Cường độ nhắc</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5 capitalize">{currentSelectedProfile.reminderIntensity}</p>
              </div>
            </div>

            {/* Weekly Top Focus Prompt */}
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <label className="block text-xs font-semibold text-indigo-700 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Một điều quan trọng nhất bạn muốn hoàn thành tuần này?</span>
              </label>
              <input
                type="text"
                value={weeklyTopFocus}
                onChange={(e) => setWeeklyTopFocus(e.target.value)}
                placeholder="Ví dụ: Hoàn tất tài liệu đặc tả, chốt hợp đồng lớn..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Unverified trial notice (PRD v0.3.39 Part D2.2) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Bản dùng thử lưu dữ liệu trên máy này. Khi chưa xác thực tài khoản, người khác có thể đăng nhập trên máy khác nếu trùng thông tin. Bạn có thể xác thực trong Cá nhân → Tài khoản bất kỳ lúc nào.
              </span>
            </div>

            {/* PRD v0.3.54 Part K: Seed Sample Data Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 cursor-pointer">
              <input
                type="checkbox"
                checked={seedSampleData}
                onChange={(e) => setSeedSampleData(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <div className="text-[11px]">
                <span className="font-bold text-slate-900">Khởi tạo dữ liệu mẫu thực tế theo nghề nghiệp (3 ngày)</span>
                <p className="text-slate-600 mt-0.5">
                  Tải sẵn công việc, khối tập trung và lịch biểu mẫu cho {currentSelectedProfile.title}. Bạn có thể xóa data mẫu bất kỳ lúc nào trong phần Cài đặt.
                </p>
              </div>
            </label>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-sm"
              >
                Quay lại
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
              >
                <span>Vào màn hình Bây giờ (Now)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
