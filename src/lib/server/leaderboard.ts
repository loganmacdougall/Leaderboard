type Leaderboard = {
    data: string;
    subscribers: Set<ReadableStreamDefaultController<string>>;
}

const leaderboards =  new Map<string, Leaderboard>();
const edit_ids = new Map<string, string>();

export function createLeaderboard() {
    const id = crypto.randomUUID();
    const edit_id = crypto.randomUUID();
    leaderboards.set(id, { data: "", subscribers: new Set() });
    edit_ids.set(edit_id, id);
    return { id, edit_id };
}

export function deleteLeaderboardFromEditID(edit_id: string) {
    const id = edit_ids.get(edit_id);
    if (!id) {
        throw new Error("Invalid edit ID");
    }
    leaderboards.delete(id);
    edit_ids.delete(edit_id);
    return id;
}

export function getIdFromEditId(edit_id: string) {
    const id = edit_ids.get(edit_id);
    if (!id) {
        throw new Error("Invalid edit ID");
    }
    return id;
}

export function getLeaderboard(id: string) {
    const leaderboard = leaderboards.get(id);
    if (!leaderboard) {
        throw new Error("Leaderboard not found");
    }
    return leaderboard;
}

export function leaderboardExists(id: string) {
    return leaderboards.has(id);
}

export function getLeaderboardData(id: string) {
    return getLeaderboard(id).data;
}

export function updateLeaderboard(edit_id: string, data: string) {
    const id = edit_ids.get(edit_id);
    if (!id) {
        throw new Error("Invalid edit ID");
    }
    const leaderboard = leaderboards.get(id);
    if (!leaderboard) {
        throw new Error("Leaderboard not found");
    }
    leaderboard.data = data;

    const update_id = crypto.randomUUID();
    broadcast(id, update_id, data);

    return id;
}

function broadcast(leaderboard_id: string, update_id: string, data: string) {
  const lb = leaderboards.get(leaderboard_id);
  if (!lb) return;

  let closed_controllers: ReadableStreamDefaultController<string>[] = [];

  lb.subscribers.forEach(controller => {
    if (controller.desiredSize === 0) {
      closed_controllers.push(controller);
      return;
    }

    controller.enqueue(`data: ${JSON.stringify({lb: data, id: update_id})}\n\n`);
  });

  closed_controllers.forEach(controller => {
    lb.subscribers.delete(controller);
  });
}

export function subscribeToLeaderboard(id: string, controller: ReadableStreamDefaultController<string>) {
    const leaderboard = leaderboards.get(id);
    if (!leaderboard) {
        throw new Error("Leaderboard not found");
    }

    leaderboard.subscribers.add(controller);
    
    return () => {
        leaderboard.subscribers.delete(controller);
    };
}