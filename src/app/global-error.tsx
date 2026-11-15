// TAIO Time App — Global Error Boundary (PRD v0.3.39 Part A2.1)
'use client';

import React, { useEffect, useState } from 'react';
import { logAppError, formatErrorsForClipboard } from '../core/errorLogger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('beforeunload'));
    }

    logAppError({
      tab: 'global',
      message: error.message || 'Global Next.js App Error',
      stack: error.stack,
    });
  }, [error]);

  const handleCopy = async () => {
    try {
      const text = formatErrorsForClipboard();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '16px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', fontSize: '24px' }}>
              ⚠️
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
              Có lỗi khiến màn hình này không mở được
            </h3>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Có lỗi khiến màn hình này không mở được. Hãy báo lại cho TAIO kèm chi tiết lỗi.
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '11px', color: '#94a3b8' }}>
              Something went wrong and this screen could not open. Please report it with the error details.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopy}
                style={{ padding: '10px 16px', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#334155', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {copied ? '✓ Đã sao chép!' : '📋 Sao chép chi tiết lỗi'}
              </button>

              <button
                onClick={handleReload}
                style={{ padding: '10px 20px', borderRadius: '12px', background: '#E0401F', border: 'none', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🔄 Tải lại
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
