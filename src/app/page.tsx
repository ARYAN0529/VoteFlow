import Link from "next/link";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
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

  const liveCount = polls.filter((p) => !p.isClosed).length;
  const closedCount = polls.filter((p) => p.isClosed).length;

  return (
    <AppShell
      user={user}
      activePath="/"
      pageTitle="Dashboard"
      pageSubtitle="All polls, live and closed."
      stats={[
        { label: "Total polls", value: polls.length },
        { label: "Live", value: liveCount, accent: "#6366F1" },
        { label: "Closed", value: closedCount },
      ]}
      headerAction={
        user ? (
          <Link
            href="/polls/new"
            className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4F46E5]"
          >
            New poll
          </Link>
        ) : undefined
      }
    >
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#8B8F9C]">All polls</h2>
      <PollList initialPolls={initialPolls} />
    </AppShell>
  );
}