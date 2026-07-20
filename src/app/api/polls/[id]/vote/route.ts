import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const voteSchema = z.object({
  optionId: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();
  const poll = await Poll.findById(id);
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.isClosed) {
    return NextResponse.json({ error: "This poll is closed" }, { status: 403 });
  }

  if (poll.creator.toString() === user.userId) {
    return NextResponse.json({ error: "Creators can't vote on their own poll" }, { status: 403 });
  }

  const alreadyVoted = poll.voters.some((v) => v.toString() === user.userId);
  if (alreadyVoted) {
    return NextResponse.json({ error: "You've already voted" }, { status: 409 });
  }

const option = poll.options.find(
  (opt) => opt._id.toString() === parsed.data.optionId
);

  await Poll.updateOne(
    { _id: id, "options._id": parsed.data.optionId },
    {
      $inc: { "options.$.votes": 1 },
      $push: { voters: user.userId },
    }
  );

  return NextResponse.json({ success: true }, { status: 200 });
}