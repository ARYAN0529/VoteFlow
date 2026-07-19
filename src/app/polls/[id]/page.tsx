import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Poll from "@/models/poll";
import { getCurrentUser } from "@/lib/session";
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
    <div className="min-h-screen bg-[#0B0C0F] px-6 py-15">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/80">
          Votify
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#F5F3EE]">
          {poll.title}
        </h1>

        <div className="mt-10 rounded-2xl border border-zinc-800 bg-[#15171C] p-6 sm:p-8">
          <PollVoteForm
            pollId={poll._id.toString()}
            options={poll.options.map((opt) => ({
              id: opt._id.toString(),
              text: opt.text,
              // Only send real vote numbers if this viewer is the creator —
              // everyone else gets 0, so results can never leak client-side
              // via React DevTools or a network tab inspection.
              votes: isCreator ? opt.votes : 0,
            }))}
            totalVotes={isCreator ? totalVotes : 0}
            hasVoted={hasVoted}
            isLoggedIn={!!user}
            isCreator={isCreator}
            isClosed={poll.isClosed}
          />
        </div>
      </div>
    </div>
  );
}