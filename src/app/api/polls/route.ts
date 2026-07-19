import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { createPollSchema } from "@/lib/validations/poll";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createPollSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await connectDB();

  const poll = await Poll.create({
    title: parsed.data.title,
    options: parsed.data.options.map((text) => ({ text, votes: 0 })),
    creator: user.userId,
  });

  return NextResponse.json({ id: poll._id.toString() }, { status: 201 });
}   