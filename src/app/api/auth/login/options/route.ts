import {NextRequest , NextResponse} from "next/server"
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { connectDB } from "@/lib/db";
import User from "@/models/user";
import { getSession } from "@/lib/session";

// if it is website -> https://nextvote.com
 // then rpid is nextvote.com

 const rpID = process.env.RP_ID as string;

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }


  await connectDB();
 // checking if user exists in database
  const user = await User.findOne({ username });
  if (!user || user.authenticators.length === 0) {
    return NextResponse.json({ error: "No account found for that username" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    // Only let credentials this user actually registered attempt login
    allowCredentials: user.authenticators.map((auth) => ({
      id: auth.credentialID,
      transports: auth.transports as any,
    })),
  });

  const session = await getSession();
  session.currentChallenge = options.challenge;
  session.username = username;
  await session.save();

  return NextResponse.json(options);
}