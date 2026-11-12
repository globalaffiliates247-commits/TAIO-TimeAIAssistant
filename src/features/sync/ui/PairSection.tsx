// TAIO Time App — Pairing UI Section (PRD B35.4 / v0.3.27)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { useT } from '../../../i18n/useT';
import { generatePairCode, normalizePairCode, publishPairing, claimPairing } from '../pairing';
import { generateSyncCode, normalizeSyncCode } from '../syncCrypto';
import { Link2, Unlink, Copy, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PairSection: React.FC = () => {
  const { palette, showToast } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool';

  const [myCode, setMyCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, expiresAt - Date.now());
      if (diff <= 0) {
        setMyCode(null);
        setExpiresAt(null);
        setRemaining('');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(t('pairing.codeExpiresIn', { minutes: mins, seconds: secs }));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt, t]);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const pairCode = generatePairCode();
      // Get or create current sync code
      let syncCode = typeof window !== 'undefined' ? localStorage.getItem('taio_sync_code') : null;
      if (!syncCode) {
        syncCode = generateSyncCode();
        localStorage.setItem('taio_sync_code', syncCode);
      }
      await publishPairing(pairCode, syncCode);
      setMyCode(pairCode);
      setExpiresAt(Date.now() + 10 * 60 * 1000);
    } catch (e: any) {
      setError(e.message || t('pairing.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    const normalized = normalizePairCode(inputCode);
    if (!normalized) {
      setError(t('pairing.errorInvalidOrExpired'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const syncCode = await claimPairing(normalized);
      if (!syncCode) {
        setError(t('pairing.errorInvalidOrExpired'));
        return;
      }
      // Save the received sync code
      localStorage.setItem('taio_sync_code', syncCode);
      setSuccess(true);
      showToast(t('pairing.successConnected'));
      setInputCode('');
    } catch (e: any) {
      setError(t('pairing.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(myCode).catch(() => {});
      showToast(myCode);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
        <div>
          <h3 className="text-sm font-bold text-slate-900">{t('pairing.title')}</h3>
          <p className="text-[11px] text-slate-500">{t('pairing.subtitle')}</p>
        </div>
      </div>

      {/* Generate code */}
      {!myCode ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 ${
            isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c83515]'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('pairing.generateCodeBtn')}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">{t('pairing.yourCodeIs')}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-black tracking-[0.3em] text-slate-900 select-all">
              {myCode}
            </span>
            <button onClick={copyCode} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-center text-amber-600 font-medium">{remaining}</p>
          <p className="text-[10px] text-center text-slate-400">{t('pairing.oneTimeNotice')}</p>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] text-slate-400 uppercase font-semibold">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Enter code from another device */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700">{t('pairing.enterCodeTitle')}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={e => { setInputCode(e.target.value.toUpperCase()); setError(null); setSuccess(false); }}
            placeholder={t('pairing.codePlaceholder')}
            maxLength={6}
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-sm font-mono font-bold tracking-[0.2em] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 uppercase"
          />
          <button
            onClick={handleClaim}
            disabled={loading || inputCode.length < 6}
            className={`px-4 rounded-xl text-xs font-bold text-white disabled:opacity-40 ${
              isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('pairing.pairBtn')}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{t('pairing.successConnected')}</span>
        </div>
      )}
    </div>
  );
};
