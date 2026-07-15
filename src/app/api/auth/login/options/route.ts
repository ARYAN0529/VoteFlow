import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/session";

const rpID = process.env.RP_ID as string;

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.authenticators.length === 0) {
    return NextResponse.json({ error: "No account found for that email" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: user.authenticators.map((auth) => ({
      id: auth.credentialID,
      transports: auth.transports as any,
    })),
  });

  const session = await getSession();
  session.currentChallenge = options.challenge;
  session.email = email.toLowerCase();
  await session.save();

  return NextResponse.json(options);
}