-- One-time setup for auto-deleting leaderboards untouched for 24 hours.
-- Requires shared_preload_libraries=pg_cron (set via docker-compose's `command:` on the
-- db service) and a restart of the postgres server before this can run.
-- Safe to re-run: CREATE EXTENSION IF NOT EXISTS is a no-op if already installed, and
-- cron.schedule() upserts by job name instead of creating duplicates.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delete-stale-leaderboards',
  '0 * * * *', -- top of every hour
  $$
    DELETE FROM leaderboard
    WHERE id IN (
      SELECT leaderboard_id
      FROM leaderboard_metadata
      WHERE updated_at < now() - interval '24 hours'
    )
  $$
);
