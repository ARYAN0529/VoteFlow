"use client";

// result page showing poll result.
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Option {
  id: string;
  text: string;
  votes: number;
}

interface Props {
  pollId: string;
  options: Option[];
  totalVotes: number;
  hasVoted: boolean;
  isLoggedIn: boolean;
  isCreator: boolean;
  isClosed: boolean;
}

export default function PollVoteForm({
  pollId,
  options,
  totalVotes,
  hasVoted,
  isLoggedIn,
  isCreator,
  isClosed,
}: Props) {
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(hasVoted);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live results for poll creator
  const [liveOptions, setLiveOptions] = useState(options);
  const [liveTotalVotes, setLiveTotalVotes] = useState(totalVotes);

  const handleVote = async () => {
    if (!selected) {
      setError("Pick an option first");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId: selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Couldn't submit your vote. Try again.");
        return;
      }

      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error ?? "Couldn't delete this poll");
        setIsDeleting(false);
      }
    } catch {
      setError("Something went wrong deleting this poll");
      setIsDeleting(false);
    }
  };

  // Subscribe to live poll updates (creator only)
  useEffect(() => {
    if (!isCreator) return;

    const eventSource = new EventSource(`/api/polls/${pollId}/results`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveOptions(data.options);
      setLiveTotalVotes(data.totalVotes);
    };

    eventSource.onerror = () => {
      console.error("SSE connection lost, browser will retry");
    };

    return () => eventSource.close();
  }, [isCreator, pollId]);

  // Creator sees live results instead of the voting interface.
  if (isCreator) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {liveTotalVotes} {liveTotalVotes === 1 ? "vote" : "votes"} total
        </p>

        <div className="mt-4 space-y-3">
          {liveOptions.map((opt) => {
            const pct =
              liveTotalVotes > 0
                ? Math.round((opt.votes / liveTotalVotes) * 100)
                : 0;

            return (
              <div key={opt.id}>
                <div className="flex justify-between text-sm text-[#F5F3EE]">
                  <span>{opt.text}</span>
                  <span className="text-zinc-500">
                    {opt.votes} · {pct}%
                  </span>
                </div>

                <div className="mt-1 h-2 w-full rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/"
          className="mt-8 block w-full rounded-lg border border-zinc-700 px-4 py-3 text-center font-medium text-[#F5F3EE] transition hover:border-amber-400/50 hover:bg-amber-400/10"
        >
          Go to dashboard
        </Link>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {showConfirm ? (
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </button>

            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="mt-4 block w-full rounded-lg border border-red-500/30 px-4 py-3 text-center text-sm text-red-400 transition hover:bg-red-500/10"
          >
            Delete poll
          </button>
        )}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-zinc-400">
        <Link href="/login" className="text-amber-400 underline">
          Log in
        </Link>{" "}
        to vote on this poll.
      </p>
    );
  }

  if (submitted) {
    return (
      <p className="text-sm text-[#F5F3EE]">
        ✓ Your vote has been recorded. Only the poll creator can see results.
      </p>
    );
  }

  if (isClosed) {
    return (
      <p className="text-sm text-zinc-400">
        This poll is closed to new votes.
      </p>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
              selected === opt.id
                ? "border-amber-400/70 bg-amber-400/10"
                : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-600"
            }`}
          >
            <input
              type="radio"
              name="poll-option"
              value={opt.id}
              checked={selected === opt.id}
              onChange={() => setSelected(opt.id)}
              className="accent-amber-400"
            />
            <span className="text-[#F5F3EE]">{opt.text}</span>
          </label>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleVote}
        disabled={isSubmitting}
        className="mt-8 block w-full rounded-lg bg-amber-400 px-4 py-3 text-center font-semibold text-black transition hover:bg-amber-300 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit vote"}
      </button>
    </div>
  );
}