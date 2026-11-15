'use client';
// PRD v0.3.37 Part G1: Modular Data Settings Panel (Sync, Import/Export, Reset)
// Exclusively hosted within tab "Kết nối TAIO" (under "Đồng bộ và dữ liệu").
import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { SyncSection } from '../sync/ui/SyncSection';
import { DataImportSection } from '../data-transfer';
import { Goal } from '@/types';
import { TaioImportSummary } from '../data-transfer/model/taioExportV1';
import { useT } from '@/i18n/useT';

interface DataSettingsPanelProps {
  importTaioData: (rawJson: string, mode: 'merge' | 'replace') => TaioImportSummary | null;
  exportTaioJsonV1: () => void;
  remainingSampleGoals?: Goal[];
  deleteGoal: (id: string) => void;
  resetAllUserData: (deleteServerCopy: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  language: string;
}

export const DataSettingsPanel: React.FC<DataSettingsPanelProps> = ({
  importTaioData,
  exportTaioJsonV1,
  remainingSampleGoals,
  deleteGoal,
  resetAllUserData,
  setIsProfileModalOpen,
  setExportModalOpen,
  language,
}) => {
  const { t } = useT();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteServerCopy, setDeleteServerCopy] = useState(false);

  return (
    <div className="pt-4 border-t border-slate-200 space-y-4">
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t('profile.sync_and_data', 'Đồng bộ và dữ liệu')}
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {t(
            'profile.sync_and_data_desc',
            'Đồng bộ giữa các thiết bị, sao lưu/khôi phục file JSON, và quản trị dữ liệu.'
          )}
        </p>
      </div>

      {/* 1. Device Sync (E2E Encrypted) */}
      <SyncSection />

      {/* 2. Import & Export JSON */}
      <DataImportSection
        onImport={importTaioData}
        onExportJson={exportTaioJsonV1}
      />

      {/* 3. Remaining sample data (if any) */}
      {remainingSampleGoals && remainingSampleGoals.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              {language === 'vi' ? 'Dữ liệu mẫu còn lại' : 'Remaining Sample Data'}
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-medium">
              {remainingSampleGoals.length} {language === 'vi' ? 'mục tiêu mẫu' : 'sample goals'}
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {language === 'vi'
              ? 'Các mục tiêu mẫu được giữ lại vì bạn đã chỉnh sửa hoặc có việc đang gắn vào. Bạn có thể xóa nếu không còn dùng.'
              : 'Sample goals retained because they were customized or have attached tasks. You can delete them if no longer needed.'}
          </p>
          <div className="space-y-1.5 pt-1">
            {remainingSampleGoals.map(g => (
              <div key={g.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-amber-200/80 text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 truncate">{g.name}</p>
                  <p className="text-[10px] text-slate-500">ID: {g.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteGoal(g.id)}
                  className="px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors shrink-0"
                >
                  {language === 'vi' ? 'Xóa' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Reset & Data Wipe (Rule G1.2: luôn là mục cuối cùng) */}
      {!showDeleteConfirm ? (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50/60 border border-red-200">
          <div>
            <p className="text-xs font-bold text-slate-900">Xóa dữ liệu cá nhân & Đặt lại từ đầu</p>
            <p className="text-[11px] text-slate-600">
              Xóa toàn bộ dữ liệu trên thiết bị này và quay lại màn hình thiết lập hồ sơ ban đầu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowDeleteConfirm(true);
              setDeleteConfirmText('');
              setDeleteServerCopy(false);
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-300 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa toàn bộ dữ liệu…</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-300 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                Xác nhận xóa toàn bộ dữ liệu cá nhân
              </h5>
              <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                Các dữ liệu sẽ bị xóa trên thiết bị này: lịch ngày và kết quả công việc, việc chen ngang, Rổ công việc, Danh sách, Ma trận ưu tiên, Thói quen, Thông báo và Cài đặt giao diện. Không thể hoàn tác sau bước này.
              </p>
            </div>
          </div>

          {/* Offer Export first */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[11px] font-medium text-slate-700">
              Bạn có muốn lưu bản sao Markdown trước khi xóa?
            </span>
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                setExportModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-bold"
            >
              Xuất dữ liệu trước
            </button>
          </div>

          {/* Optional server deletion checkbox */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteServerCopy}
              onChange={(e) => setDeleteServerCopy(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-0"
            />
            <div className="text-[11px]">
              <span className="font-bold text-slate-900">Xóa luôn bản sao trên máy chủ</span>{' '}
              <span className="text-red-600 font-semibold">(không khôi phục được)</span>
              <p className="text-slate-500 mt-0.5">
                Xóa hoàn toàn dữ liệu tài khoản trên máy chủ và bản sao lưu trong vòng 30 ngày.
              </p>
            </div>
          </label>

          {/* Type XÓA to enable */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Nhập chữ <span className="font-mono font-black text-red-600">XÓA</span> để mở khóa nút xác nhận:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Gõ XÓA tại đây..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteConfirmText.trim().toUpperCase() !== 'XÓA'}
              onClick={() => {
                resetAllUserData(deleteServerCopy);
                setShowDeleteConfirm(false);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all ${
                deleteConfirmText.trim().toUpperCase() === 'XÓA'
                  ? 'bg-red-600 hover:bg-red-700 shadow-sm cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Xác nhận xóa vĩnh viễn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
