import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
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
              votes: isCreator ? opt.votes : 0,
            }))}
            totalVotes={isCreator ? totalVotes : 0}
            hasVoted={hasVoted}
            isLoggedIn={!!user}
            isCreator={isCreator}
            isClosed={poll.isClosed}
            createdAt={poll.createdAt.toISOString()}
          />
        </div>
      </div>
    </AppShell>
  );
}