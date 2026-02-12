import type { RequestHandler } from '../$types';
import { getLeaderboardData, subscribeToLeaderboard } from "$lib/server/leaderboard";

let createLeaderboardStream = (id: string) => {
  let lb: string;

  try {
    lb = getLeaderboardData(id);
  } catch (e) {
    throw new Error("Leaderboard not found");
  }

  const stream = new ReadableStream<string>({
    start(controller) {
      const unsubscribe = subscribeToLeaderboard(id, controller);
      controller.enqueue(`data: ${JSON.stringify({lb})}\n\n`);

      return unsubscribe;
    },
    cancel() {}
  });

  return stream;
}

export const GET: RequestHandler = ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response('Missing id parameter', { status: 400 });
  }

  const stream = createLeaderboardStream(id);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}