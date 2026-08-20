const subscribers = new Map<string, Set<ReadableStreamDefaultController<string>>>();

export function setupSubscribers(leaderboard_id: string) {
    if (!subscribers.has(leaderboard_id)) {
        subscribers.set(leaderboard_id, new Set());
    }
}

export function addSubscriber(leaderboard_id: string, controller: ReadableStreamDefaultController<string>) {
    setupSubscribers(leaderboard_id);
    const leaderboardSubscribers = subscribers.get(leaderboard_id);
    if (leaderboardSubscribers) {
        leaderboardSubscribers.add(controller);
    }
}

export function removeSubscriber(leaderboard_id: string, controller: ReadableStreamDefaultController<string>) {
    setupSubscribers(leaderboard_id);
    const leaderboardSubscribers = subscribers.get(leaderboard_id);
    if (leaderboardSubscribers) {
        leaderboardSubscribers.delete(controller);
    }
}

export function notifySubscribers(leaderboard_id: string, data: string) {
    setupSubscribers(leaderboard_id);
    const leaderboardSubscribers = subscribers.get(leaderboard_id);
    if (leaderboardSubscribers) {
        for (const controller of leaderboardSubscribers) {
            try {
                controller.enqueue(data);
            } catch {
                // Controller belongs to a stream that closed without a clean cancel (e.g. a
                // refreshed/closed tab); drop it so it doesn't poison future broadcasts.
                leaderboardSubscribers.delete(controller);
            }
        }
    }
}