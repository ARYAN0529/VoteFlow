import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
import User from "@/models/User";

// delete existing poll by id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { id } = await params;
  await connectDB();

  const poll = await Poll.findById(id);

  if (!poll) {
    return NextResponse.json(
      { error: "Poll not found" },
      { status: 404 }
    );
  }

  // Check if current user is an admin
  const currentUser = await User.findById(user.userId);
  const isAdmin = currentUser?.isAdmin ?? false;

  // Allow creator or admin to delete the poll
  if (poll.creator.toString() !== user.userId && !isAdmin) {
    return NextResponse.json(
      { error: "Only the creator or an admin can delete this poll" },
      { status: 403 }
    );
  }

  await Poll.deleteOne({ _id: id });

  return NextResponse.json(
    { success: true },
    { status: 200 }
  );
}