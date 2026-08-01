import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";

// main SSE file
// it sends data to pollVoteForm, which is the SSE client
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    return new Response("Not authenticated", { status: 401 });
  }

  await connectDB();

  const poll = await Poll.findById(id).lean();

  if (!poll) {
    return new Response("Poll not found", { status: 404 });
  }

  // Allow the poll creator OR a user who has already voted
  // to receive the real-time poll results.
  const hasVoted = poll.voters.some(
    (v) => v.toString() === user.userId
  );

  if (poll.creator.toString() !== user.userId && !hasVoted) {
    return new Response("Forbidden", { status: 403 });
  }

  // Track the last snapshot we sent as a JSON string.
  // This lets us detect whether anything actually changed.
  let lastSnapshot = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendUpdate = async () => {
        const current = await Poll.findById(id).lean();

        if (!current) return; // poll got deleted mid-stream

        const payload = {
          options: current.options.map((opt) => ({
            id: opt._id.toString(),
            text: opt.text,
            votes: opt.votes,
          })),
          totalVotes: current.options.reduce(
            (sum, opt) => sum + opt.votes,
            0
          ),
          isClosed: current.isClosed,
        };

        const snapshot = JSON.stringify(payload);

        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot;

          // SSE wire format:
          // data: <json>\n\n
          controller.enqueue(
            encoder.encode(`data: ${snapshot}\n\n`)
          );
        }
      };

      // Send current state immediately on connection
      await sendUpdate();

      // Check for changes every 2 seconds
      const interval = setInterval(sendUpdate, 2000);

      // Clean up when the client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}