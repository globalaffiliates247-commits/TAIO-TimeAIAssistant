'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import {
  parseAndValidateTaioExport,
  TaioImportPreview,
  TaioImportSummary
} from '../model/taioExportV1';
import { FOUNDER_TAIO_EXPORT_V1 } from '../data/founderSampleData';

interface DataImportSectionProps {
  onImport: (rawJson: string, mode: 'merge' | 'replace') => TaioImportSummary | null;
  onExportJson: () => void;
}

export const DataImportSection: React.FC<DataImportSectionProps> = ({
  onImport,
  onExportJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [preview, setPreview] = useState<TaioImportPreview | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [replaceConfirmText, setReplaceConfirmText] = useState<string>('');
  const [lastSummary, setLastSummary] = useState<TaioImportSummary | null>(null);

  const loadJsonContent = (jsonStr: string, fileName: string) => {
    setRawJsonText(jsonStr);
    setSelectedFileName(fileName);
    const parsedPreview = parseAndValidateTaioExport(jsonStr);
    setPreview(parsedPreview);
    setLastSummary(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      loadJsonContent(content, file.name);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleLoadFounderSample = () => {
    const sampleStr = JSON.stringify(FOUNDER_TAIO_EXPORT_V1, null, 2);
    loadJsonContent(sampleStr, 'taio-lee-data-v1.json');
  };

  const handleExecuteImport = () => {
    if (!preview || !preview.isValidFormat || !rawJsonText) return;
    if (importMode === 'replace' && replaceConfirmText.trim().toUpperCase() !== 'XÓA') {
      return;
    }
    const result = onImport(rawJsonText, importMode);
    if (result) {
      setLastSummary(result);
      setReplaceConfirmText('');
    }
  };

  const canConfirmImport =
    Boolean(preview?.isValidFormat) &&
    (importMode === 'merge' || replaceConfirmText.trim().toUpperCase() === 'XÓA');

  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h5 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-[#E0401F]" />
            <span>Nhập dữ liệu</span>
          </h5>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            Đọc file JSON định dạng chuẩn (mục tiêu, dự án, danh sách, công việc, lịch mẫu, kết quả ngày). Nhập lại nhiều lần không tạo bản trùng.
          </p>
        </div>
        <button
          type="button"
          onClick={onExportJson}
          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          title="Tải dữ liệu hiện tại ra file JSON cùng định dạng"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Xuất file JSON</span>
        </button>
      </div>

      {/* Step 1: Pick file or load founder real data */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-xl bg-[#E0401F] hover:bg-[#c83516] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-white" />
          <span>Chọn file JSON…</span>
        </button>

        <button
          type="button"
          onClick={handleLoadFounderSample}
          className="px-3 py-2 rounded-xl bg-white hover:bg-red-50/60 text-[#E0401F] border border-[#E0401F]/30 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E0401F]" />
          <span>Nạp dữ liệu thật TAIO-Lee (file đính kèm)</span>
        </button>
      </div>

      {/* Step 2: Preview counts */}
      {preview && (
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">File đã chọn:</span>
                <span className="text-xs font-bold text-slate-900 font-mono">{selectedFileName}</span>
              </div>
              {preview.userDisplayName && (
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Người dùng: <span className="font-semibold text-slate-900">{preview.userDisplayName}</span>
                  {preview.exportedAt ? ` • Xuất lúc ${preview.exportedAt.replace('T', ' ').slice(0, 16)}` : ''}
                </p>
              )}
              {preview.source && (
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  Nguồn: {preview.source}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setRawJsonText('');
                setSelectedFileName('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="Đóng xem trước"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!preview.isValidFormat ? (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{preview.errorMessage}</span>
            </div>
          ) : (
            <>
              {/* Main preview count badge in spec format: "3 mục tiêu, 3 dự án, 21 việc, 5 ngày" */}
              <div className="p-3 rounded-xl bg-red-50/50 border border-[#E0401F]/25">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Xem trước nội dung sẽ nhập
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {preview.previewLine}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium">
                    {preview.listsCount} danh sách ({preview.ideaItemsCount} ý tưởng)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium">
                    {preview.dayTemplateCount} khung giờ mẫu trong ngày
                  </span>
                </div>
              </div>

              {/* Invalid records warning (non-blocking) */}
              {preview.invalidRecords.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Phát hiện {preview.invalidRecords.length} bản ghi lỗi (sẽ tự động bỏ qua, không dừng quá trình nhập):</span>
                  </p>
                  <ul className="list-disc list-inside text-[10px] space-y-0.5">
                    {preview.invalidRecords.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 3: Mode selection: Gộp (default) vs Thay thế */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Chọn chế độ nhập:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportMode('merge');
                      setReplaceConfirmText('');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      importMode === 'merge'
                        ? 'bg-[#E0401F] border-[#E0401F] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className={`text-xs font-bold ${importMode === 'merge' ? 'text-white' : 'text-slate-900'}`}>
                      Gộp (Mặc định)
                    </p>
                    <p className={`text-[11px] mt-0.5 leading-snug ${importMode === 'merge' ? 'text-white/90' : 'text-slate-500'}`}>
                      Giữ dữ liệu hiện có, thêm mục mới và chỉ cập nhật mục trùng mã khi file mới hơn.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      importMode === 'replace'
                        ? 'bg-[#E0401F] border-[#E0401F] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className={`text-xs font-bold ${importMode === 'replace' ? 'text-white' : 'text-slate-900'}`}>
                      Thay thế toàn bộ
                    </p>
                    <p className={`text-[11px] mt-0.5 leading-snug ${importMode === 'replace' ? 'text-white/90' : 'text-slate-500'}`}>
                      Xóa dữ liệu cũ trên máy và thay hoàn toàn bằng dữ liệu trong file.
                    </p>
                  </button>
                </div>

                {/* Replace mode asks to type XÓA */}
                {importMode === 'replace' && (
                  <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200 space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Chế độ Thay thế sẽ ghi đè toàn bộ dữ liệu hiện tại. Nhập chữ{' '}
                      <span className="font-mono font-black text-red-600">XÓA</span> để xác nhận:
                    </label>
                    <input
                      type="text"
                      value={replaceConfirmText}
                      onChange={(e) => setReplaceConfirmText(e.target.value)}
                      placeholder="Gõ XÓA tại đây..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={!canConfirmImport}
                  onClick={handleExecuteImport}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    canConfirmImport
                      ? 'bg-[#E0401F] hover:bg-[#c83516] text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {importMode === 'merge' ? 'Thực hiện Nhập (Gộp)' : 'Thực hiện Nhập (Thay thế)'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Summary of what was added, updated or skipped */}
      {lastSummary && (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <h6 className="text-xs font-bold text-slate-900">
              Hoàn tất nhập dữ liệu ({lastSummary.mode === 'merge' ? 'Chế độ Gộp' : 'Chế độ Thay thế'})
            </h6>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white border border-emerald-200/80">
              <p className="text-sm font-black text-emerald-700">+{lastSummary.added}</p>
              <p className="text-[10px] font-semibold text-slate-600">Đã thêm mới</p>
            </div>
            <div className="p-2 rounded-lg bg-white border border-blue-200/80">
              <p className="text-sm font-black text-blue-700">{lastSummary.updated}</p>
              <p className="text-[10px] font-semibold text-slate-600">Đã cập nhật</p>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <p className="text-sm font-black text-slate-700">{lastSummary.skippedUnchanged}</p>
              <p className="text-[10px] font-semibold text-slate-600">Giữ nguyên (trùng mã)</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-700 leading-relaxed">
            Chi tiết: Mục tiêu (+{lastSummary.breakdown.goals.added} / cập nhật {lastSummary.breakdown.goals.updated} / giữ nguyên {lastSummary.breakdown.goals.skipped}) · Dự án (+{lastSummary.breakdown.projects.added} / cập nhật {lastSummary.breakdown.projects.updated} / giữ nguyên {lastSummary.breakdown.projects.skipped}) · Việc (+{lastSummary.breakdown.tasks.added} / cập nhật {lastSummary.breakdown.tasks.updated} / giữ nguyên {lastSummary.breakdown.tasks.skipped}) · Ngày (+{lastSummary.breakdown.days.added} / cập nhật {lastSummary.breakdown.days.updated} / giữ nguyên {lastSummary.breakdown.days.skipped}).
          </p>

          {lastSummary.skippedInvalid > 0 && (
            <p className="text-[11px] text-amber-800 font-medium">
              Đã bỏ qua {lastSummary.skippedInvalid} bản ghi lỗi: {lastSummary.invalidDetails.join('; ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
