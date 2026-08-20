import { db } from '../db';
import { leaderboardMetadataTable, leaderboardTable } from '../schema/leaderboard';

const VIEW_ID_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export async function createLeaderboard() {
    const MAX_RETRIES = 5;

    let cached_error: Error | null = null;
    for (let _ = 0; _ < MAX_RETRIES; _++) {
        const id = crypto.randomUUID();
        const edit_id = crypto.randomUUID();
        const view_id = Array.from({ length: 8 }, () => VIEW_ID_POOL[Math.floor(Math.random() * VIEW_ID_POOL.length)]).join("");
        
        try {
            await db.transaction(async (tx) => {
                await tx.insert(leaderboardTable).values({
                    id,
                    edit_id,
                    view_id
                });
                await tx.insert(leaderboardMetadataTable).values({
                    leaderboard_id: id,
                    updated_id: 0
                });
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
                cached_error = error;
                continue; // Retry on unique constraint violation
            } else {
                throw error; // Rethrow other errors
            }
        }

        return { id, edit_id, view_id };
    }

    throw cached_error || new Error("Failed to create leaderboard after multiple attempts");    
}