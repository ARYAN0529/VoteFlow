import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/session";

const rpID = process.env.RP_ID as string;
const origin = process.env.ORIGIN as string;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const session = await getSession();
  const expectedChallenge = session.currentChallenge;
  const username = session.username;

  if (!expectedChallenge || !username) {
    return NextResponse.json({ error: "No registration in progress" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Registration could not be verified" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  await connectDB();

  const newUser = await User.create({
    username,
    displayName: username,
    authenticators: [
      {
        credentialID: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports ?? [],
      },
    ],
  });

  // Registration successful — log the user in immediately.
  session.userId = newUser._id.toString();
  session.username = newUser.username;
  session.currentChallenge = undefined;
  await session.save();

  return NextResponse.json({ verified: true });
}