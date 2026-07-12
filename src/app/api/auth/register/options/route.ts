import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/session";

const rpID = process.env.RP_ID as string;
const rpName = process.env.RP_NAME as string;

export async function POST(req: NextRequest) {
  const { username, displayName } = await req.json();

  if (!username || !displayName) {
    return NextResponse.json({ error: "username and displayName are required" }, { status: 400 });
  }

  await connectDB();

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
    userDisplayName: displayName,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Stash the challenge + pending user info in the session cookie.
  // We can't save this on a User document yet because the User doesn't
  // exist until registration is verified.
  const session = await getSession();
  session.currentChallenge = options.challenge;
  session.username = username;
  await session.save();

  return NextResponse.json(options);
}