import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

// interface -> just a checklist of what fields live inside the session cookie.
// Nothing here talks to the database — this is only what gets encrypted
// and stored in the browser's cookie for THIS logged-in visitor.
export interface SessionData {
  userId?: string;       // set once the user logs in
  username?: string;     // set once the user logs in
  currentChallenge?: string; // temporary, only used during passkey login/register
}

// these are the settings iron-session uses to encrypt/decrypt the cookie
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string, // the secret key that locks/unlocks the cookie
  cookieName: "votify_session",                    // name of the cookie in the browser

  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    // secure: true means "only send this cookie over https"
    // we're on localhost (http) during development, so this is false in dev
    // and automatically true once deployed to production

    httpOnly: true,
    // httpOnly: true means client-side JavaScript can NEVER read this cookie.
    // Only the server can read it. This blocks a common attack (XSS token theft).

    sameSite: "lax",
    // stops other random websites from silently using this cookie
    // to make requests on your site pretending to be the logged-in user

    maxAge: 60 * 60 * 24 * 7,
    // how long the cookie lasts before it expires: 7 days
    // (60 seconds * 60 minutes * 24 hours * 7 days)
  },
};

// getSession() -> the ONE function you call anywhere you need to read
// or write "who is currently logged in" for this request.
//
// Think of it like this: every time a browser makes a request, this
// function unlocks that browser's cookie and gives you a normal-looking
// JS object you can read from and write to.
//
// Example usage inside an API route:
//   const session = await getSession();
//   session.userId = someUser._id.toString();
//   await session.save();   // <-- re-encrypts and saves back into the cookie
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies(); // grabs the raw cookies from this request
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

// getCurrentUser() -> a shortcut for the most common question you'll ask:
// "Is anyone logged in right now, and if so, who are they?"
//
// Returns null if nobody is logged in.
// Returns { userId, username } if they are.
//
// You'll use this to protect pages like /polls/new and /polls/manage,
// and to check "is this person allowed to close/reset THIS poll?"
export async function getCurrentUser(): Promise<{ userId: string; username: string } | null> {
  const session = await getSession();

  if (!session.userId || !session.username) {
    return null; // nobody logged in
  }

  return { userId: session.userId, username: session.username };
}