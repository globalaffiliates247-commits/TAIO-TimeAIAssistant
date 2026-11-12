// TAIO Time App — Device Pairing via 6-char code (PRD B35.4 / v0.3.27)
// Alphabet without 0/O/1/I/L; pair_id = SHA-256("taio-pair-v1:" + code);
// encrypt sync key with PBKDF2→AES-GCM derived from 6-char code.
import { encryptJson, decryptJson, generateSyncCode } from './syncCrypto';
import { SYNC_URL, SYNC_KEY, SYNC_ENABLED } from './syncConfig';

const enc = new TextEncoder();
const PAIR_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

/** Generate a random 6-character pairing code */
export function generatePairCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, b => PAIR_ALPHABET[b % PAIR_ALPHABET.length]).join('');
}

/** Normalize user input: uppercase, strip non-alpha-numeric, validate length & alphabet */
export function normalizePairCode(raw: string): string | null {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 6) return null;
  if ([...clean].some(ch => !PAIR_ALPHABET.includes(ch))) return null;
  return clean;
}

/** Derive pair_id = SHA-256("taio-pair-v1:" + code) */
export async function derivePairId(code: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode('taio-pair-v1:' + code)));
}

/** Derive an AES-GCM key from the 6-char code (PBKDF2) */
async function derivePairKey(code: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('taio-pair-v1:key'), iterations: 100_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

/** Encrypt the full sync code with the 6-char pairing code */
async function encryptSyncCode(pairCode: string, syncCode: string): Promise<{ iv: string; ciphertext: string }> {
  const key = await derivePairKey(pairCode);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(syncCode));
  return { iv: toB64(iv), ciphertext: toB64(data) };
}

/** Decrypt the full sync code with the 6-char pairing code */
async function decryptSyncCode(pairCode: string, iv: string, ciphertext: string): Promise<string> {
  const key = await derivePairKey(pairCode);
  const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ciphertext));
  return new TextDecoder().decode(data);
}

/** Call Supabase RPC to create a pairing entry (10 min TTL, one-time use) */
export async function publishPairing(pairCode: string, syncCode: string): Promise<void> {
  if (!SYNC_ENABLED) throw new Error('Sync not configured');

  const pairId = await derivePairId(pairCode);
  const { iv, ciphertext } = await encryptSyncCode(pairCode, syncCode);
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const res = await fetch(`${SYNC_URL}/rest/v1/rpc/taio_pair_create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SYNC_KEY,
      Authorization: `Bearer ${SYNC_KEY}`,
    },
    body: JSON.stringify({ p_id: pairId, p_iv: iv, p_cipher: ciphertext, p_expires: expires }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Pairing publish failed: ${res.status} ${body}`);
  }
}

/** Claim a pairing entry (one-time, deletes after read) → returns the full sync code */
export async function claimPairing(pairCode: string): Promise<string | null> {
  if (!SYNC_ENABLED) throw new Error('Sync not configured');

  const pairId = await derivePairId(pairCode);

  const res = await fetch(`${SYNC_URL}/rest/v1/rpc/taio_pair_claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SYNC_KEY,
      Authorization: `Bearer ${SYNC_KEY}`,
    },
    body: JSON.stringify({ p_id: pairId }),
  });

  if (!res.ok) return null;
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const { iv, ciphertext } = rows[0];
  try {
    return await decryptSyncCode(pairCode, iv, ciphertext);
  } catch {
    return null; // wrong code or tampered data
  }
}
