import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import PollVoteForm from "./PollVoteForm";

export default async function PollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();
  const poll = await Poll.findById(id).lean();

  if (!poll) {
    notFound();
  }

  const user = await getCurrentUser();
  const isCreator = user ? poll.creator.toString() === user.userId : false;
  const hasVoted = user
    ? poll.voters.some((voterId) => voterId.toString() === user.userId)
    : false;

  // Results are visible to the creator, or to anyone who has voted —
  // matches the same rule enforced in PollVoteForm and the SSE results route.
  const canSeeResults = isCreator || hasVoted;

  // isAdmin is looked up fresh from the DB on every load — never trust
  // a client-sent value for a permission check like this.
  const currentUser = user ? await User.findById(user.userId) : null;
  const isAdmin = currentUser?.isAdmin ?? false;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <AppShell
      user={user}
      activePath={`/polls/${id}`}
      pageTitle={poll.title}
      pageSubtitle={poll.isClosed ? "This poll is closed." : "Vote below, or watch live results if you created it."}
    >
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-[#2A2D36] bg-[#15171E] p-6 sm:p-8">
          <PollVoteForm
            pollId={poll._id.toString()}
            options={poll.options.map((opt) => ({
              id: opt._id.toString(),
              text: opt.text,
              votes: canSeeResults ? opt.votes : 0,
            }))}
            totalVotes={canSeeResults ? totalVotes : 0}
            hasVoted={hasVoted}
            isLoggedIn={!!user}
            isCreator={isCreator}
            isAdmin={isAdmin}
            isClosed={poll.isClosed}
            createdAt={poll.createdAt.toISOString()}
          />
        </div>
      </div>
    </AppShell>
  );
}