import type { RequestHandler } from './$types';
import { getData } from '$lib/server/leaderboard/data';
import { addSubscriber, removeSubscriber } from '$lib/server/leaderboard/subscribers';

// SSE comment lines (a line starting with ":") are silently ignored by EventSource but
// still count as traffic — without this, an idle connection with nothing to broadcast
// can sit there for a long time with neither side aware it's actually dead (a NAT/proxy
// timing out an idle connection, a laptop sleeping, etc.), so the client's onerror never
// fires and the page just looks frozen until a manual refresh. A period well under
// typical idle-connection timeouts (most sit around 60s) makes a genuinely dead
// connection surface quickly instead.
const HEARTBEAT_INTERVAL_MS = 25000;

const createLeaderboardStream = (id: string) => {
  let subscribed: ReadableStreamDefaultController<string> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream<string>({
    async start(controller) {
      const lb = await getData(id);
      controller.enqueue(`data: ${JSON.stringify({ lb })}\n\n`);

      subscribed = controller;
      addSubscriber(id, controller);

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(': heartbeat\n\n');
        } catch {
          // The connection is already gone — cancel() will run and clean this up.
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
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
