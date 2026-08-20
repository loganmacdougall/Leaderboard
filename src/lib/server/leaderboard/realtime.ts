import { getData } from './data';
import { notifySubscribers } from './subscribers';

export async function broadcastLeaderboard(id: string) {
  // Best-effort push to live viewers. The mutation that triggered this has already
  // committed, so a broadcast failure must never surface as a failed response.
  try {
    const lb = await getData(id);
    const update_id = crypto.randomUUID();
    notifySubscribers(id, `data: ${JSON.stringify({ lb, id: update_id })}\n\n`);
    return update_id;
  } catch (e) {
    console.error('Failed to broadcast leaderboard update:', e);
    return null;
  }
}
