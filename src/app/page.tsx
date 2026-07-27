import Link from "next/link";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import PollList from "./PollList";

export default async function HomePage() {
  const user = await getCurrentUser();

  await connectDB();
  const polls = await Poll.find().sort({ createdAt: -1 }).lean();

  const initialPolls = polls.map((poll) => {
    const isCreator = user ? poll.creator.toString() === user.userId : false;
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    return {
      id: poll._id.toString(),
      title: poll.title,
      isClosed: poll.isClosed,
      optionCount: poll.options.length,
      totalVotes: isCreator ? totalVotes : null,
    };
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
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
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">Votify</h1>

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/polls/manage" className="text-sm text-neutral-300 hover:text-white">
                  Manage polls
                </Link>
                <span className="text-sm text-neutral-400">{user.email}</span>
                <LogoutButton />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-neutral-300 hover:text-white">
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

          {user && (
            <Link
              href="/polls/new"
              className="mb-6 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              + Create Poll
            </Link>
          )}

          <PollList initialPolls={initialPolls} />
        </div>
      </div>
    </div>
  );
}