'use client';
// PRD B24 v0.3.25: "Đồng bộ giữa các máy" in the Me screen.
import React, { useState } from 'react';
import { RefreshCw, Smartphone, Laptop, Copy, Eye, EyeOff, Link2Off } from 'lucide-react';
import { SYNC_ENABLED } from '../syncConfig';
import { useSyncState, updateSyncSettings } from '../syncStore';
import { createSyncSpace, joinSyncSpace, leaveSyncSpace } from '../syncEngine';
import { generateSyncCode } from '../syncCrypto';
import { requestSyncNow } from '../useSyncLoop';

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
  const [joinInput, setJoinInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [mode, setMode] = useState<'none' | 'join'>('none');
  const [error, setError] = useState<string | null>(null);

  if (!settings) return null;
  const card = 'p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3';
  const btn = 'h-10 px-3.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-800';
  const primary = 'h-10 px-3.5 rounded-xl text-xs font-semibold bg-slate-900 text-white';

  if (!SYNC_ENABLED) {
    return <div className={card}><p className="text-xs text-slate-600">Bản cài này chưa được cấu hình máy chủ đồng bộ.</p></div>;
  }

  if (!settings.code) {
    return (
      <div className={card}>
        <div>
          <p className="text-xs font-bold text-slate-900">Đồng bộ giữa các máy</p>
          <p className="text-[11px] text-slate-600">Dùng cùng một mã đồng bộ trên iPhone và Mac. Dữ liệu được mã hóa trên máy trước khi gửi đi; không có mã thì không ai đọc được.</p>
        </div>
        {mode === 'none' ? (
          <div className="flex flex-wrap gap-2">
            <button className={primary} onClick={async () => { await createSyncSpace(generateSyncCode()); setShowCode(true); requestSyncNow(); }}>
              Tạo mã mới trên máy này
            </button>
            <button className={btn} onClick={() => setMode('join')}>Nhập mã từ máy khác</button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={joinInput}
              onChange={e => { setJoinInput(e.target.value); setError(null); }}
              placeholder="TAIO-XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm font-mono tracking-wider"
            />
            <p className="text-[11px] text-slate-600">Lần đồng bộ đầu tiên sẽ <strong>thay dữ liệu trên máy này</strong> bằng dữ liệu của máy kia.</p>
            {error && <p className="text-[11px] text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button className={primary} onClick={async () => {
                if (await joinSyncSpace(joinInput)) { setMode('none'); requestSyncNow(); }
                else setError('Mã không đúng dạng TAIO-XXXX-XXXX-XXXX-XXXX.');
              }}>Kết nối</button>
              <button className={btn} onClick={() => setMode('none')}>Hủy</button>
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
          <p className="text-xs font-bold text-slate-900">Đồng bộ giữa các máy · đang bật</p>
          <p className="text-[11px] text-slate-600">
            {status.state === 'syncing' ? 'Đang đồng bộ…'
              : status.state === 'error' ? status.message
              : `Lần gần nhất: ${timeAgo(status.lastSyncAt)}`}
          </p>
        </div>
        <button className={btn} onClick={() => requestSyncNow()} aria-label="Đồng bộ ngay">
          <RefreshCw className={`w-4 h-4 ${status.state === 'syncing' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-[11px] text-slate-600 mb-1">Mã đồng bộ (nhập mã này trên máy kia)</p>
        <div className="flex items-center gap-2">
          <span className="flex-1 font-mono text-sm tracking-wider text-slate-900">{showCode ? settings.code : 'TAIO-••••-••••-••••-••••'}</span>
          <button className={btn} onClick={() => setShowCode(v => !v)} aria-label={showCode ? 'Ẩn mã' : 'Hiện mã'}>{showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          <button className={btn} onClick={() => navigator.clipboard?.writeText(settings.code || '')} aria-label="Sao chép mã"><Copy className="w-4 h-4" /></button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Giữ mã này như mật khẩu. Mất mã thì phải tạo mã mới.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-slate-600">Tên máy này</label>
        <input
          defaultValue={settings.deviceName}
          onBlur={e => updateSyncSettings({ deviceName: e.target.value.trim() || settings.deviceName })}
          className="w-full h-10 rounded-xl border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="space-y-1">
        <p className="text-[11px] text-slate-600">Máy khác đang dùng mã này</p>
        {otherDevices.length === 0 ? (
          <p className="text-xs text-slate-500">Chưa có. Mở TAIO Time trên máy kia → Cá nhân → Đồng bộ → Nhập mã.</p>
        ) : otherDevices.map(d => (
          <div key={d.id} className="flex items-center gap-2 text-xs text-slate-800">
            {/iPhone|iPad|Android/i.test(d.name) ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
            <span className="flex-1">{d.name}</span>
            <span className="text-slate-500">gửi lên {timeAgo(d.ts)}</span>
          </div>
        ))}
      </div>

      <button className={`${btn} w-full flex items-center justify-center gap-2`} onClick={() => leaveSyncSpace()}>
        <Link2Off className="w-4 h-4" /> Ngắt đồng bộ trên máy này
      </button>
    </div>
  );
};
