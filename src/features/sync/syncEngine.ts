// PRD B24 v0.3.25: one sync round = pull other devices' encrypted snapshots, merge, then push ours.
import type { TaioExportV1, TaioImportSummary } from '../data-transfer';
import { SYNC_ENABLED } from './syncConfig';
import { decryptJson, encryptJson, deriveSpaceId, normalizeSyncCode } from './syncCrypto';
import { forgetDevice, pullSnapshots, pushSnapshot } from './syncClient';
import { getSyncSettings, setSyncStatus, updateSyncSettings } from './syncStore';
import { dropOlderThanLocal, payloadFingerprint, stampPayload } from './snapshot';

export interface SyncDeps {
  getPayload: () => TaioExportV1;
  applyPayload: (payload: TaioExportV1, mode: 'merge' | 'replace') => TaioImportSummary | null;
}

let running = false;

/** Returns true when remote data was applied (caller should run again shortly to push the merged state). */
export async function runSyncRound(deps: SyncDeps): Promise<boolean> {
  const s = getSyncSettings();
  if (!SYNC_ENABLED) { setSyncStatus({ state: 'off', message: 'Bản này chưa cấu hình máy chủ đồng bộ.' }); return false; }
  if (!s.code || !s.spaceId) { setSyncStatus({ state: 'off' }); return false; }
  if (running) return false;
  running = true;
  setSyncStatus({ state: 'syncing', lastSyncAt: undefined });
  let applied = false;
  let receivedJournalCount = 0;
  let isMismatched = false;
  try {
    // 0. Record local edits made since the last round (their time = now), so a pull cannot overwrite them
    if (!s.joinPending) stampPayload(deps.getPayload());

    // 1. Pull
    const rows = (await pullSnapshots(s.spaceId, s.deviceId)) || [];
    const seen = { ...s.seen };
    const sorted = [...rows].sort((a, b) => a.client_updated_at - b.client_updated_at);
    const newest = sorted[sorted.length - 1];
    let latestRemoteSummary: { date: string; count: number; hash: string } | undefined;

    for (const row of sorted) {
      const replace = !!s.joinPending && row === newest;
      if (!replace && (seen[row.device_id] ?? 0) >= row.client_updated_at) continue;
      let payload: TaioExportV1;
      try {
        payload = await decryptJson<TaioExportV1>(s.code, row.iv, row.ciphertext);
      } catch {
        throw new Error('Không giải mã được dữ liệu từ máy khác. Kiểm tra lại mã đồng bộ.');
      }
      if (payload.todayJournalSummary && typeof payload.todayJournalSummary === 'object') {
        latestRemoteSummary = payload.todayJournalSummary;
      }
      const summary = deps.applyPayload(replace ? payload : dropOlderThanLocal(payload), replace ? 'replace' : 'merge');
      if (summary) {
        if (replace || summary.added + summary.updated > 0) applied = true;
        const jBreakdown = (summary.breakdown as any)?.journalItems;
        if (jBreakdown) {
          receivedJournalCount += (jBreakdown.added || 0) + (jBreakdown.updated || 0);
        }
      }
      seen[row.device_id] = row.client_updated_at;
    }
    updateSyncSettings({
      seen,
      joinPending: false,
      devices: rows.map(r => ({ id: r.device_id, name: r.device_name || 'Thiết bị', ts: r.client_updated_at })),
    });

    const currentLocalPayload = deps.getPayload();
    const sentJournalCount = currentLocalPayload.journalItems?.length || 0;

    // Check verification hash (PRD v0.3.36 Part F2.7)
    if (latestRemoteSummary && currentLocalPayload.todayJournalSummary) {
      if (latestRemoteSummary.date === currentLocalPayload.todayJournalSummary.date) {
        if (latestRemoteSummary.hash !== currentLocalPayload.todayJournalSummary.hash) {
          isMismatched = true;
        }
      }
    }

    // 2. Push (skipped right after applying remote data: React state updates on the next render)
    if (!applied) {
      const stamped = stampPayload(currentLocalPayload);
      const fp = payloadFingerprint(stamped);
      if (fp !== getSyncSettings().lastPushHash) {
        const { iv, ciphertext } = await encryptJson(s.code, stamped);
        await pushSnapshot({ space: s.spaceId, device: s.deviceId, name: s.deviceName, iv, cipher: ciphertext, ts: Date.now() });
        updateSyncSettings({ lastPushHash: fp });
      }
    }
    setSyncStatus({
      state: 'idle',
      lastSyncAt: Date.now(),
      sentJournal: sentJournalCount,
      receivedJournal: receivedJournalCount,
      isMismatched,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const offline = /Failed to fetch|NetworkError|Load failed/i.test(msg);
    const notInstalled = /PGRST202|404|Could not find the function/i.test(msg);
    setSyncStatus({
      state: 'error',
      message: offline ? 'Không có mạng. App sẽ thử lại sau.'
        : notInstalled ? 'Máy chủ đồng bộ chưa được cài đặt (chạy taio_sync.sql trong Supabase).'
        : msg,
    });
  } finally {
    running = false;
  }
  return applied;
}

/** Start a new sync space on this device (this device's data becomes the first copy). */
export async function createSyncSpace(code: string) {
  updateSyncSettings({ code, spaceId: await deriveSpaceId(code), joinPending: false, lastPushHash: undefined, seen: {}, devices: [] });
}

/** Join with a code from another device; the first pull replaces this device's data. */
export async function joinSyncSpace(rawCode: string): Promise<boolean> {
  const code = normalizeSyncCode(rawCode);
  if (!code) return false;
  updateSyncSettings({ code, spaceId: await deriveSpaceId(code), joinPending: true, lastPushHash: undefined, seen: {}, devices: [] });
  return true;
}

export async function leaveSyncSpace() {
  const s = getSyncSettings();
  if (s.spaceId) { try { await forgetDevice(s.spaceId, s.deviceId); } catch { /* offline: server copy stays encrypted */ } }
  updateSyncSettings({ code: undefined, spaceId: undefined, joinPending: false, lastPushHash: undefined, seen: {}, devices: [] });
  setSyncStatus({ state: 'off' });
}
