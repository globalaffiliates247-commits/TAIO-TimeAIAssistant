// PRD B24 v0.3.25: Supabase RPC calls over plain fetch (no SDK, no extra dependency).
import { SYNC_KEY, SYNC_URL } from './syncConfig';

export interface RemoteSnapshot {
  device_id: string;
  device_name: string | null;
  iv: string;
  ciphertext: string;
  client_updated_at: number;
}

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: SYNC_KEY };
  if (SYNC_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SYNC_KEY}`; // legacy anon JWT
  const res = await fetch(`${SYNC_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text.slice(0, 200)}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const pushSnapshot = (p: { space: string; device: string; name: string; iv: string; cipher: string; ts: number }) =>
  rpc<void>('taio_sync_push', { p_space: p.space, p_device: p.device, p_name: p.name, p_iv: p.iv, p_cipher: p.cipher, p_ts: p.ts });

export const pullSnapshots = (space: string, device: string) =>
  rpc<RemoteSnapshot[]>('taio_sync_pull', { p_space: space, p_device: device });

export const forgetDevice = (space: string, device: string) =>
  rpc<void>('taio_sync_forget', { p_space: space, p_device: device });
