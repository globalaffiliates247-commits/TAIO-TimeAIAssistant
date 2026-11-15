'use client';
// PRD B24 v0.3.25 & v0.3.37 Part G2: End-to-end encrypted device sync.
// Single sync code with AirDrop/Share button, auto-normalized paste, and security disclaimer.
import React, { useState, useEffect } from 'react';
import { RefreshCw, Smartphone, Laptop, Copy, Eye, EyeOff, Link2Off, Share2, Check, ShieldAlert } from 'lucide-react';
import { SYNC_ENABLED } from '../syncConfig';
import { useSyncState, updateSyncSettings } from '../syncStore';
import { createSyncSpace, joinSyncSpace, leaveSyncSpace } from '../syncEngine';
import { generateSyncCode } from '../syncCrypto';
import { requestSyncNow } from '../useSyncLoop';
import { useT } from '@/i18n/useT';

const timeAgo = (ts?: number) => {
  if (!ts) return 'chưa có';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`;
};

export const SyncSection: React.FC = () => {
  const { settings, status } = useSyncState();
  const { t } = useT();
  const [joinInput, setJoinInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [mode, setMode] = useState<'none' | 'join'>('none');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Clean legacy 6-char pairing key if any
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('taio_sync_code');
      } catch {}
    }
  }, []);

  if (!settings) return null;
  const card = 'p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5';
  const btn = 'h-9 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer';
  const primary = 'h-9 px-3.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer shadow-xs';

  if (!SYNC_ENABLED) {
    return (
      <div className={card}>
        <p className="text-xs text-slate-600">Bản cài này chưa được cấu hình máy chủ đồng bộ.</p>
      </div>
    );
  }

  const handleShareCode = async () => {
    if (!settings.code) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'TAIO Time Sync Code',
          text: settings.code,
        });
        return;
      } catch {
        // Fallback to clipboard if share modal is closed/unsupported
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(settings.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    if (!settings.code || !navigator.clipboard) return;
    await navigator.clipboard.writeText(settings.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!settings.code) {
    return (
      <div className={card}>
        <div>
          <p className="text-xs font-bold text-slate-900">{t('sync.title', 'Đồng bộ giữa các máy')}</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            {t(
              'sync.desc',
              'Dùng cùng một mã đồng bộ trên iPhone và Mac. Dữ liệu được mã hóa trên máy trước khi gửi đi; không có mã thì không ai đọc được.'
            )}
          </p>
        </div>
        {mode === 'none' ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className={primary}
              onClick={async () => {
                await createSyncSpace(generateSyncCode());
                setShowCode(true);
                requestSyncNow();
              }}
            >
              {t('sync.create_code', 'Tạo mã mới trên máy này')}
            </button>
            <button className={btn} onClick={() => setMode('join')}>
              {t('sync.enter_code', 'Nhập mã từ máy khác')}
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <input
              value={joinInput}
              onChange={e => {
                setJoinInput(e.target.value);
                setError(null);
              }}
              placeholder="TAIO-XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm font-mono tracking-wider focus:outline-none focus:border-slate-800"
            />
            <p className="text-[11px] text-slate-600">
              {t('sync.join_warning', 'Lần đồng bộ đầu tiên sẽ thay dữ liệu trên máy này bằng dữ liệu của máy kia.')}
            </p>
            {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
            <div className="flex gap-2">
              <button
                className={primary}
                onClick={async () => {
                  if (await joinSyncSpace(joinInput)) {
                    setMode('none');
                    requestSyncNow();
                  } else {
                    setError('Mã không đúng định dạng. Hãy kiểm tra lại mã đồng bộ.');
                  }
                }}
              >
                {t('sync.connect', 'Kết nối')}
              </button>
              <button className={btn} onClick={() => setMode('none')}>
                {t('sync.cancel', 'Hủy')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const otherDevices = settings.devices;
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-slate-900">
              {t('sync.active_title', 'Đồng bộ giữa các máy · đang bật')}
            </p>
            {status.isMismatched && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                ● Hai máy chưa khớp
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {status.state === 'syncing'
              ? 'Đang đồng bộ…'
              : status.state === 'error'
              ? status.message
              : `Lần gần nhất: ${timeAgo(status.lastSyncAt)}`}
            {typeof status.sentJournal === 'number' && typeof status.receivedJournal === 'number' && (
              <span className="block text-[10px] text-slate-500 mt-0.5">
                Đã gửi {status.sentJournal} việc nhật ký, nhận {status.receivedJournal}
              </span>
            )}
          </p>
        </div>
        <button className={btn} onClick={() => requestSyncNow()} aria-label="Đồng bộ ngay">
          <RefreshCw className={`w-3.5 h-3.5 ${status.state === 'syncing' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sync Code Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-700">
            {t('sync.your_code_label', 'Mã đồng bộ (nhập hoặc gửi mã này sang máy kia)')}
          </p>
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            Mã hóa E2E
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex-1 min-w-[200px] font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all">
            {showCode ? settings.code : 'TAIO-••••-••••-••••-••••'}
          </span>
          <button
            className={btn}
            onClick={() => setShowCode(v => !v)}
            aria-label={showCode ? 'Ẩn mã' : 'Hiện mã'}
            title={showCode ? 'Ẩn mã' : 'Hiện mã'}
          >
            {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            className={btn}
            onClick={handleCopyCode}
            aria-label="Sao chép mã"
            title="Sao chép mã"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            className={`${btn} bg-slate-900 text-white hover:bg-black border-slate-900 flex items-center gap-1.5`}
            onClick={handleShareCode}
            aria-label="Gửi mã qua AirDrop / Chia sẻ"
            title="Gửi mã qua AirDrop / Chia sẻ"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t('sync.share_btn', 'Gửi mã')}</span>
          </button>
        </div>

        {/* Security Warning (Rule G2.3) */}
        <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {t(
              'sync.security_note',
              'Mã này mở khóa dữ liệu của bạn; không chia sẻ cho người khác.'
            )}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-700">Tên máy này</label>
        <input
          defaultValue={settings.deviceName}
          onBlur={e => updateSyncSettings({ deviceName: e.target.value.trim() || settings.deviceName })}
          className="w-full h-9 rounded-xl border border-slate-300 px-3 text-xs focus:outline-none focus:border-slate-800"
        />
      </div>

      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-semibold text-slate-700">Máy khác đang dùng mã này</p>
        {otherDevices.length === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            Chưa có. Mở TAIO Time trên máy kia → Cá nhân → Kết nối TAIO → Nhập mã.
          </p>
        ) : (
          otherDevices.map(d => (
            <div key={d.id} className="flex items-center gap-2 text-xs text-slate-800 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
              {/iPhone|iPad|Android/i.test(d.name) ? <Smartphone className="w-4 h-4 text-slate-600" /> : <Laptop className="w-4 h-4 text-slate-600" />}
              <span className="flex-1 font-medium">{d.name}</span>
              <span className="text-[11px] text-slate-500">gửi lên {timeAgo(d.ts)}</span>
            </div>
          ))
        )}
      </div>

      <button
        className={`${btn} w-full flex items-center justify-center gap-2 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200 mt-2`}
        onClick={() => leaveSyncSpace()}
      >
        <Link2Off className="w-3.5 h-3.5" />
        <span>{t('sync.disconnect', 'Ngắt đồng bộ trên máy này')}</span>
      </button>
    </div>
  );
};
