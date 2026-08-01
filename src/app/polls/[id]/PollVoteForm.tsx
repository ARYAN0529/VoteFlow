"use client";

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
  isAdmin: boolean;
  isClosed: boolean;
  createdAt: string;
}

// One color per option, cycled by index — makes each bar visually distinct
// instead of every option looking identical.
const OPTION_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#38BDF8", "#A78BFA"];

function timeSince(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PollVoteForm({
  pollId,
  options,
  totalVotes,
  hasVoted,
  isLoggedIn,
  isCreator,
  isAdmin,
  isClosed,
  createdAt,
}: Props) {
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(hasVoted);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [liveOptions, setLiveOptions] = useState(options);
  const [liveTotalVotes, setLiveTotalVotes] = useState(totalVotes);

  // Anyone who can see results: the creator, or anyone who has voted
  // (submitted starts as hasVoted, and flips true right after a fresh vote).
  const canSeeResults = isCreator || submitted;

  // Only the creator or an admin can manage (close/delete) a poll —
  // seeing results and managing a poll are two separate permissions.
  const canManage = isCreator || isAdmin;

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
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`/api/polls/${pollId}`, { method: "DELETE" });

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

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/polls/${pollId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live results stream — open for the creator, or any voter, not just the creator.
  useEffect(() => {
    if (!canSeeResults) return;

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
  }, [canSeeResults, pollId]);

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-[#8B8F9C]">
        <Link href="/login" className="font-medium text-[#818CF8] hover:text-[#A5A8F5]">
          Log in
        </Link>{" "}
        to vote on this poll.
      </p>
    );
  }

  // Combined results view — shown to the creator, or to anyone right after
  // (or previously having) voted. Management controls (close/delete) are
  // gated separately by canManage, so a regular voter sees results but
  // never gets a delete button.
  if (canSeeResults) {
    const maxVotes = Math.max(...liveOptions.map((o) => o.votes), 0);
    const hasWinner = liveTotalVotes > 0;

    return (
      <div>
        {/* Header row: big number + live status */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-semibold text-[#F2F2F5]">{liveTotalVotes}</p>
              {!isClosed && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#10B981]/10 px-2 py-1 text-xs font-medium text-[#34D399]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                  </span>
                  Live
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-[#8B8F9C]">
              {liveTotalVotes === 1 ? "vote" : "votes"} · created {timeSince(createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="shrink-0 rounded-md border border-[#2A2D36] px-3 py-1.5 text-xs font-medium text-[#8B8F9C] transition hover:border-[#3A3D46] hover:text-[#F2F2F5]"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        {/* Result bars */}
        <div className="mt-6 space-y-4">
          {liveOptions.map((opt, i) => {
            const pct = liveTotalVotes > 0 ? Math.round((opt.votes / liveTotalVotes) * 100) : 0;
            const isWinner = hasWinner && opt.votes === maxVotes && maxVotes > 0;
            const color = OPTION_COLORS[i % OPTION_COLORS.length];

            return (
              <div
                key={opt.id}
                className={`rounded-lg p-3 transition ${
                  isWinner ? "bg-[#0A0B10] ring-1 ring-inset" : ""
                }`}
                style={isWinner ? { boxShadow: `inset 0 0 0 1px ${color}40` } : undefined}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-[#F2F2F5]">
                    {opt.text}
                    {isWinner && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        Leading
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-[#8B8F9C]">
                    {opt.votes} · {pct}%
                  </span>
                </div>

                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#2A2D36]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {!isCreator && (
          <p className="mt-4 text-xs text-[#5C5F6B]">
            You&apos;re seeing these results because you voted on this poll.
          </p>
        )}

        <Link
          href="/"
          className="mt-8 block w-full rounded-md border border-[#2A2D36] px-4 py-2.5 text-center text-sm font-medium text-[#F2F2F5] transition hover:border-[#6366F1]/50 hover:bg-[#6366F1]/10"
        >
          Go to dashboard
        </Link>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {/* Management controls — creator or admin only */}
        {canManage &&
          (showConfirm ? (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-md bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-md border border-[#2A2D36] px-4 py-2 text-sm text-[#8B8F9C] transition hover:border-[#3A3D46]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="mt-4 block w-full rounded-md border border-red-500/30 px-4 py-2.5 text-center text-sm text-red-400 transition hover:bg-red-500/10"
            >
              {isAdmin && !isCreator ? "Delete poll (admin)" : "Delete poll"}
            </button>
          ))}
      </div>
    );
  }

  if (isClosed) {
    return <p className="text-sm text-[#8B8F9C]">This poll is closed to new votes.</p>;
  }

  return (
    <div>
      <div className="space-y-2.5">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition ${
              selected === opt.id
                ? "border-[#6366F1]/70 bg-[#6366F1]/10"
                : "border-[#2A2D36] bg-[#0A0B10] hover:border-[#3A3D46]"
            }`}
          >
            <input
              type="radio"
              name="poll-option"
              value={opt.id}
              checked={selected === opt.id}
              onChange={() => setSelected(opt.id)}
              className="accent-[#6366F1]"
            />
            <span className="text-[#F2F2F5]">{opt.text}</span>
          </label>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleVote}
        disabled={isSubmitting}
        className="mt-8 block w-full rounded-md bg-[#6366F1] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#4F46E5] disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit vote"}
      </button>
    </div>
  );
}