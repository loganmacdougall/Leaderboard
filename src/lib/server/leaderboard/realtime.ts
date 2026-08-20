import type { leaderboardCellTable, leaderboardHeaderCellTable, leaderboardMetadataTable, leaderboardRowTable } from '../schema/leaderboard';
import { notifySubscribers } from './subscribers';

type Cell = typeof leaderboardCellTable.$inferSelect;
type Row = typeof leaderboardRowTable.$inferSelect & { cells: Cell[] };
type Header = typeof leaderboardHeaderCellTable.$inferSelect;
type Metadata = typeof leaderboardMetadataTable.$inferSelect;

export type LeaderboardPatch =
  | { type: 'metadata'; metadata: Metadata }
  | { type: 'header_created'; header: Header; cells: Cell[] }
  | { type: 'header_updated'; header: Header }
  | { type: 'header_deleted'; header_id: number }
  | { type: 'row_created'; row: Row }
  | { type: 'row_deleted'; row_id: number }
  | { type: 'cell_updated'; cell: Cell };

// Pushes just what changed to live viewers, instead of refetching and resending the
// entire board on every mutation (which gets expensive as rounds/players grow).
export function broadcastPatch(leaderboard_id: string, patch: LeaderboardPatch) {
  notifySubscribers(leaderboard_id, `data: ${JSON.stringify({ patch })}\n\n`);
}
