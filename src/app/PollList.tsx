"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PollListItem {
  id: string;
  title: string;
  isClosed: boolean;
  optionCount: number;
  totalVotes: number | null; // null means "not visible to this viewer"
}

export default function PollList({ initialPolls }: { initialPolls: PollListItem[] }) {
  const [polls, setPolls] = useState(initialPolls);

  useEffect(() => {
    const eventSource = new EventSource("/api/polls/live");

    eventSource.onmessage = (event) => {
      setPolls(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      console.error("SSE connection lost, browser will retry");
    };

    return () => eventSource.close();
  }, []);

  if (polls.length === 0) {
    return <p className="text-neutral-500">No polls yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {polls.map((poll) => (
        <Link
          key={poll.id}
          href={`/polls/${poll.id}`}
          className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-md transition hover:border-white/20"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-white">{poll.title}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                poll.isClosed
                  ? "bg-neutral-800 text-neutral-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {poll.isClosed ? "Closed" : "Live"}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {poll.totalVotes !== null
              ? `${poll.totalVotes} vote${poll.totalVotes !== 1 ? "s" : ""} · ${poll.optionCount} options`
              : `${poll.optionCount} options`}
          </p>
        </Link>
      ))}
    </div>
  );
}   