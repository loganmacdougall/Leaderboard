import type { RequestHandler } from './$types';
import { getData } from '$lib/server/leaderboard/data';
import { addSubscriber, removeSubscriber } from '$lib/server/leaderboard/subscribers';

const createLeaderboardStream = (id: string) => {
  let subscribed: ReadableStreamDefaultController<string> | null = null;

  return new ReadableStream<string>({
    async start(controller) {
      const lb = await getData(id);
      controller.enqueue(`data: ${JSON.stringify({ lb })}\n\n`);

      subscribed = controller;
      addSubscriber(id, controller);
    },
    cancel() {
      if (subscribed) removeSubscriber(id, subscribed);
    }
  });
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
