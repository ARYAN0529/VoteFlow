import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/session";

const rpID = process.env.RP_ID as string;
const rpName = process.env.RP_NAME as string;

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();

  if (!email || !name) {
    return NextResponse.json({ error: "email and name are required" }, { status: 400 });
  }

  await connectDB();

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: email,       // WebAuthn's internal "userName" field — email works well here
    userDisplayName: name, // shown in the OS passkey prompt (e.g. "Save passkey for Aryan?")
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Stash the challenge + pending registration info in the session cookie.
  // We can't save this on a User document yet because the User doesn't
  // exist until registration is verified.
  const session = await getSession();
  session.currentChallenge = options.challenge;
  session.email = email.toLowerCase();
  session.pendingDisplayName = name;
  await session.save();

  return NextResponse.json(options);
}