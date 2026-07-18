import Link from "next/link";
import { connectDB } from "@/lib/db";

import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

// This runs on the SERVER, before the page is sent to the browser.
// That's why we can just call getCurrentUser() and query the database
// directly here, instead of fetching an API route.
export default async function HomePage() {
  const user = await getCurrentUser();

  await connectDB();

  // .lean() returns plain JS objects instead of full Mongoose documents —
  // faster, and we don't need any of the document methods here, just the data.
  const polls = await Poll.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Grid background, same as login/register */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#000",
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10 min-h-screen px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Top bar: shows who's logged in, or login/register links */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">Votify</h1>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">{user.email}</span>
                <LogoutButton />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm text-neutral-300 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-neutral-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Create poll button — only shown if logged in */}
          {user && (
            <Link
              href="/polls/new"
              className="mb-6 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              + Create Poll
            </Link>
          )}

          {/* Poll list */}
          <div className="flex flex-col gap-3">
            {polls.length === 0 && (
              <p className="text-neutral-500">
                No polls yet. {user ? "Create the first one!" : "Login to create one."}
              </p>
            )}

            {polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

              return (
                <Link
                  key={poll._id.toString()}
                  href={`/polls/${poll._id.toString()}`}
                  className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-md transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-white">{poll.title}</h2>
                    {poll.isClosed && (
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        Closed
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · {poll.options.length} options
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}