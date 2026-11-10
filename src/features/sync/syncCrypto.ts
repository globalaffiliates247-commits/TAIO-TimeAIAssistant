// PRD B24 v0.3.25: end-to-end encryption for sync. The sync code never leaves the device;
// the server sees only space_id = SHA-256(code) and AES-GCM ciphertext.
const enc = new TextEncoder();
const dec = new TextDecoder();
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

/** "TAIO-XXXX-XXXX-XXXX-XXXX" (~78 bits), easy to type on a phone. */
export function generateSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
  return `TAIO-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

export function normalizeSyncCode(raw: string): string | null {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = c.startsWith('TAIO') ? c.slice(4) : c;
  if (body.length !== 16 || [...body].some(ch => !ALPHABET.includes(ch))) return null;
  return `TAIO-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12, 16)}`;
}

export async function deriveSpaceId(code: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode('taio-sync-v1:space:' + code)));
}

const keyCache = new Map<string, Promise<CryptoKey>>();
function deriveKey(code: string): Promise<CryptoKey> {
  if (!keyCache.has(code)) {
    keyCache.set(code, (async () => {
      const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('taio-sync-v1:key'), iterations: 150_000, hash: 'SHA-256' },
        base,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    })());
  }
  return keyCache.get(code)!;
}

export async function encryptJson(code: string, value: unknown): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(code), enc.encode(JSON.stringify(value)));
  return { iv: toB64(iv), ciphertext: toB64(data) };
}

export async function decryptJson<T>(code: string, iv: string, ciphertext: string): Promise<T> {
  const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await deriveKey(code), fromB64(ciphertext));
  return JSON.parse(dec.decode(data)) as T;
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}
