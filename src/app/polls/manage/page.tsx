import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
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
    <AppShell
      user={user}
      activePath="/polls/manage"
      pageTitle="Manage polls"
      pageSubtitle="Close, reset, or delete polls you've created."
    >
      {polls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#2A2D36] px-6 py-14 text-center">
          <p className="text-sm text-[#8B8F9C]">
            You haven&apos;t created any polls yet.{" "}
            <Link href="/polls/new" className="font-medium text-[#818CF8] hover:text-[#A5A8F5]">
              Create one
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      )}
    </AppShell>
  );
}