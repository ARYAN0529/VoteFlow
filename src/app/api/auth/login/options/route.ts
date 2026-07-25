import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getSession } from "@/lib/session";

const rpID = process.env.RP_ID as string;

export async function POST(req: NextRequest) {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });

  const session = await getSession();
  session.currentChallenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}