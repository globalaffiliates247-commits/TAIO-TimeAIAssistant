'use client';

import React, { useState } from 'react';
import { Footprints, ShieldCheck, X, ChevronRight, Sparkles } from 'lucide-react';
import { requestMotionPermission } from '../motionBridge';
import { setMotionPermissionCardDismissed } from '../motionStore';

interface MotionPermissionCardProps {
  onPermissionChanged?: (granted: boolean) => void;
}

export const MotionPermissionCard: React.FC<MotionPermissionCardProps> = ({ onPermissionChanged }) => {
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    setMotionPermissionCardDismissed(true);
  };

  const handleRequest = async () => {
    const res = await requestMotionPermission();
    setShowExplanationModal(false);
    setDismissed(true);
    setMotionPermissionCardDismissed(true);
    onPermissionChanged?.(res.ok);
  };

  return (
    <>
      <div
        onClick={() => setShowExplanationModal(true)}
        className="p-4 rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-white border border-orange-200/80 shadow-xs flex items-center justify-between gap-3 cursor-pointer group hover:border-orange-300 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <Footprints className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-950 transition-colors">
              Tự đếm bước và gợi ý thời gian di chuyển
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              App tự nhận ra các đoạn đi bộ để gợi ý lấp khoảng thời gian quên ghi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-orange-600 hidden sm:inline">Khám phá</span>
          <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors ml-1"
            title="Đóng thẻ này"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Point Pre-permission Explanation Modal (spec B4.3) */}
      {showExplanationModal && (
        <div className="fixed app-overlay-safe z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-base text-slate-900">Cảm biến chuyển động</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Trước khi cấp quyền trên iPhone, TAIO Time cam kết 3 nguyên tắc rõ ràng:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
                <span className="font-bold text-orange-600 shrink-0">1.</span>
                <span className="text-slate-700">
                  <strong>Dùng để làm gì:</strong> Tự nhận ra các đoạn đi bộ, di chuyển và đếm bước chân để gợi ý trong &ldquo;AI đoán sẵn&rdquo;, bạn xác nhận 1 chạm mới lưu.
                </span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-slate-700">
                  <strong>Bảo mật thiết bị:</strong> Dữ liệu chuyển động thô chỉ nằm trên máy bạn, không đưa lên máy chủ và không đưa vào đồng bộ.
                </span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-500 shrink-0">3.</span>
                <span className="text-slate-700">
                  <strong>Toàn quyền tắt:</strong> Bạn có thể bật hoặc tắt bất cứ lúc nào trong mục <strong>Cá nhân</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={handleRequest}
                className="py-2.5 px-5 rounded-xl bg-[#E0401F] hover:bg-[#c93517] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Tiếp tục & Cấp quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
