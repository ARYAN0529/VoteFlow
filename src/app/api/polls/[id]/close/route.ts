import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const poll = await Poll.findById(id);
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.creator.toString() !== user.userId) {
    return NextResponse.json({ error: "Only the creator can close this poll" }, { status: 403 });
  }

  poll.isClosed = true;
  await poll.save();

  return NextResponse.json({ success: true }, { status: 200 });
}