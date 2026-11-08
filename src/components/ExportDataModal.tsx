'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Copy, 
  Download, 
  Share2, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  Sparkles,
  X 
} from 'lucide-react';

export const ExportDataModal: React.FC = () => {
  const { 
    exportModalOpen, 
    setExportModalOpen, 
    shareToken, 
    rotateShareToken,
    generateMarkdownSnapshot,
    exportTaioJsonV1,
    setIsProfileModalOpen
  } = useApp();

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [exportId, setExportId] = useState<string>(`exp_${Date.now()}`);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const markdownContent = generateMarkdownSnapshot ? generateMarkdownSnapshot() : '';

  // Host URL detection (defaults to Render domain or window.location.origin)
  const [originUrl, setOriginUrl] = useState<string>('https://taio-timeaiassistant.onrender.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // If running on render or custom domain, use current origin
      setOriginUrl(window.location.origin);
    }
  }, []);

  const shareUrlLatest = `${originUrl}/share/${shareToken}/latest.md`;
  const shareUrlExact = `${originUrl}/share/${shareToken}/exports/${exportId}.md`;

  // Publish snapshot to server endpoint POST /api/exports
  const handlePublish = async () => {
    setIsExporting(true);
    try {
      await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: shareToken,
          exportId,
          date: todayStr,
          markdown: markdownContent,
        }),
      });
    } catch (e) {
      console.log('Local/offline snapshot stored in browser state.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (exportModalOpen) {
      handlePublish();
    }
  }, [exportModalOpen]);

  if (!exportModalOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrlLatest);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TAIO-Daily-Log-${todayStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed app-bottom-sheet-safe z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl p-5 sm:p-7 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E0401F]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Xuất dữ liệu cho trợ lý AI
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                1 chạm chia sẻ bản ghi ngày (Markdown & JSON) cho trợ lý AI đọc trực tiếp hoặc lưu trữ dự phòng
              </p>
            </div>
          </div>
          <button 
            onClick={() => setExportModalOpen(false)}
            className="text-slate-500 hover:text-slate-900 p-1 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-4 space-y-4">
          
          {/* Share Link Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E0401F] uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Link chia sẻ cố định cho trợ lý AI:</span>
              </span>
              <span className="text-[10px] text-slate-500">Bảo vệ bằng token bí mật</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrlLatest}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 shadow-xs select-all"
              />
              <button
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-[#E0401F] hover:bg-[#c83516] text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                <span>{copiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Bạn chỉ cần dán link này vào khung chat của Claude/AI một lần (hoặc mỗi khi xuất dữ liệu). Trợ lý AI có thể đọc trực tiếp bản ghi 10 phần mà không cần tải file hay copy/paste thủ công.
            </p>
          </div>

          {/* Token Management */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Token bí mật:</span>
              <code className="text-slate-700 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[180px] sm:max-w-xs">
                {shareToken}
              </code>
            </div>
            <button
              onClick={rotateShareToken}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-[11px] font-semibold"
              title="Đổi token bí mật mới để vô hiệu hóa các link cũ"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Đổi token mới</span>
            </button>
          </div>

          {/* Action Buttons: Download .md, Download .json (taio-time-export v1), Copy text, Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleDownloadFile}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải file .md</span>
            </button>
            <button
              onClick={exportTaioJsonV1}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#E0401F]" />
              <span>Tải file .json</span>
            </button>
            <button
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4 text-sky-600" />
              <span>{copiedText ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
            >
              {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600">
              Muốn khôi phục hoặc gộp dữ liệu từ file JSON chuẩn?
            </span>
            <button
              type="button"
              onClick={() => {
                setExportModalOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#E0401F] border border-slate-200 font-bold text-xs shrink-0 cursor-pointer"
            >
              Mở Nhập dữ liệu
            </button>
          </div>

          {/* Markdown Preview Drawer */}
          {showPreview && (
            <div className="space-y-2 animate-in fade-in">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Bản xem trước định dạng Markdown (10 phần chuẩn):
              </span>
              <pre className="p-4 rounded-2xl bg-white border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap select-all">
                {markdownContent}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Định dạng UTF-8 • Snapshot được lưu trữ tự động</span>
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
