import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getCurrentUser();

  await connectDB();

  let lastSnapshot = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendUpdate = async () => {
        const polls = await Poll.find().sort({ createdAt: -1 }).lean();

        const payload = polls.map((poll) => {
          const isCreator = user ? poll.creator.toString() === user.userId : false;
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

          return {
            id: poll._id.toString(),
            title: poll.title,
            isClosed: poll.isClosed,
            optionCount: poll.options.length,
            totalVotes: isCreator ? totalVotes : null,
          };
        });

        const snapshot = JSON.stringify(payload);
        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot;
          controller.enqueue(encoder.encode(`data: ${snapshot}\n\n`));
        }
      };

      await sendUpdate();
      const interval = setInterval(sendUpdate, 2000);

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