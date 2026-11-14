// TAIO Time App — Anonymous Quote Reaction Client (PRD v0.3.35 Part B3)
import { SYNC_URL, SYNC_KEY, SYNC_ENABLED } from '@/features/sync/syncConfig';

/**
 * Sends anonymous reaction to server (fire-and-forget, zero user identity).
 * Rule B3.5: User custom quotes (id starts with 'usr-' or 'user-') are NEVER sent.
 */
export async function sendQuoteReaction(
  quoteId: string,
  reaction: 'heart' | 'unheart' | 'hide'
): Promise<void> {
  if (!quoteId || quoteId.startsWith('usr-') || quoteId.startsWith('user-')) {
    return;
  }
  if (!SYNC_ENABLED || !SYNC_URL) return;

  try {
    fetch(`${SYNC_URL}/rest/v1/rpc/taio_quote_react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SYNC_KEY,
        ...(SYNC_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SYNC_KEY}` } : {}),
      },
      body: JSON.stringify({ quote_id: quoteId, reaction }),
    }).catch(() => {});
  } catch {}
}
