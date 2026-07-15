import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/session";

const rpID = process.env.RP_ID as string;
const origin = process.env.ORIGIN as string;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const session = await getSession();
  const expectedChallenge = session.currentChallenge;
  const email = session.email;

  if (!expectedChallenge || !email) {
    return NextResponse.json({ error: "No login in progress" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const authenticator = user.authenticators.find((a) => a.credentialID === body.id);
  if (!authenticator) {
    return NextResponse.json({ error: "Credential not recognized" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: authenticator.credentialID,
        publicKey: Uint8Array.from(authenticator.credentialPublicKey),
        counter: authenticator.counter,
        transports: authenticator.transports as any,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Login could not be verified" }, { status: 400 });
  }

  authenticator.counter = verification.authenticationInfo.newCounter;
  await user.save();

  session.userId = user._id.toString();
  session.email = user.email;
  session.currentChallenge = undefined;
  await session.save();

  return NextResponse.json({ verified: true });
}