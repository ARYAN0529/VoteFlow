import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";

    // get poll results by id 
    // this endpoint is only accessible to the poll creator, and returns the current vote counts for each option in the poll

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

  // Only the creator ever receives real vote numbers — same rule enforced
  // everywhere else in the app. A non-creator hitting this endpoint directly
  // (e.g. via devtools) still gets nothing useful back.
  if (poll.creator.toString() !== user.userId) {
    return new Response("Forbidden", { status: 403 });
  }

  // Track the last snapshot we sent as a JSON string — cheap way to detect
  // "did anything actually change" without diffing objects field by field.
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
          totalVotes: current.options.reduce((sum, opt) => sum + opt.votes, 0),
          isClosed: current.isClosed,
        };

        const snapshot = JSON.stringify(payload);
        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot;
          // SSE wire format: "data: <json>\n\n" — the double newline marks
          // the end of one event, the browser's EventSource parses this for us.
          controller.enqueue(encoder.encode(`data: ${snapshot}\n\n`));
        }
      };

      // Send the current state immediately on connect, then poll every 2s
      await sendUpdate();
      const interval = setInterval(sendUpdate, 2000);

      // Clean up when the client disconnects (closes tab, navigates away) —
      // without this the interval would keep running forever on the server.
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