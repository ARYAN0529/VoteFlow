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
    userName: email,
    userDisplayName: name,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  const session = await getSession();
  session.currentChallenge = options.challenge;
  session.email = email.toLowerCase();
  session.pendingDisplayName = name;
  await session.save();

  return NextResponse.json(options);
}