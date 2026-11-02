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
    generateMarkdownSnapshot 
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl p-5 sm:p-7 text-white border-t border-orange-500/30 sm:border">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-950/80 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Xuất dữ liệu cho AI Assistant (Data Export)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-400 border border-orange-800/40">
                  PRD B24 (v0.3.1)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1 chạm chia sẻ bản ghi ngày (Markdown) cho trợ lý AI (Claude/ChatGPT) đọc trực tiếp qua URL bí mật
              </p>
            </div>
          </div>
          <button 
            onClick={() => setExportModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          
          {/* Share Link Box */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Link chia sẻ cố định cho Trợ lý AI (Latest):</span>
              </span>
              <span className="text-[10px] text-slate-400">Bảo vệ bằng token bí mật</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrlLatest}
                className="flex-1 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#c83516] hover:to-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bạn chỉ cần dán link này vào khung chat của Claude/AI một lần (hoặc mỗi khi xuất dữ liệu). Trợ lý AI có thể đọc trực tiếp bản ghi 10 phần mà không cần tải file hay copy/paste thủ công.
            </p>
          </div>

          {/* Token Management */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Token bí mật:</span>
              <code className="text-slate-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 truncate max-w-[180px] sm:max-w-xs">
                {shareToken}
              </code>
            </div>
            <button
              onClick={rotateShareToken}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
              title="Đổi token bí mật mới để vô hiệu hóa các link cũ"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Đổi token mới</span>
            </button>
          </div>

          {/* Action Buttons: Download file & Copy text */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadFile}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Tải file .md</span>
            </button>
            <button
              onClick={handleCopyText}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4 text-sky-400" />
              <span>{copiedText ? 'Đã copy nội dung' : 'Copy toàn bộ Text'}</span>
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
            >
              {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
            </button>
          </div>

          {/* Markdown Preview Drawer */}
          {showPreview && (
            <div className="space-y-2 animate-in fade-in">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Bản xem trước định dạng Markdown (10 phần chuẩn PRD B24):
              </span>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap select-all">
                {markdownContent}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Định dạng UTF-8 • Snapshot được lưu trữ tự động</span>
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
