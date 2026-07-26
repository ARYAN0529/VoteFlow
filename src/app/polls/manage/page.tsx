import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
import ManagePollCard from "./ManagePollCard";

export default async function ManagePollsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const polls = await Poll.find({ creator: user.userId })
    .sort({ createdAt: -1 })
    .lean();

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
            <h1 className="text-2xl font-semibold text-white">Manage your polls</h1>
            <Link href="/" className="text-sm text-neutral-300 hover:text-white">
              ← Back home
            </Link>
          </div>

          {polls.length === 0 && (
            <p className="text-neutral-500">
              You haven&apos;t created any polls yet.{" "}
              <Link href="/polls/new" className="text-white underline">
                Create one
              </Link>
              .
            </p>
          )}

          <div className="flex flex-col gap-3">
            {polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
              return (
                <ManagePollCard
                  key={poll._id.toString()}
                  pollId={poll._id.toString()}
                  title={poll.title}
                  totalVotes={totalVotes}
                  optionCount={poll.options.length}
                  isClosed={poll.isClosed}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}