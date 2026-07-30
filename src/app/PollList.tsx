"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PollListItem {
  id: string;
  title: string;
  isClosed: boolean;
  optionCount: number;
  totalVotes: number | null;
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
    return (
      <div className="rounded-lg border border-dashed border-[#2A2D36] px-6 py-14 text-center">
        <p className="text-sm text-[#8B8F9C]">No polls yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {polls.map((poll) => (
        <Link
          key={poll.id}
          href={`/polls/${poll.id}`}
          className="rounded-xl border border-[#2A2D36] bg-[#15171E] p-5 transition hover:border-[#3A3D46]"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-medium leading-snug text-[#F2F2F5]">{poll.title}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                poll.isClosed
                  ? "bg-[#2A2D36] text-[#8B8F9C]"
                  : "bg-[#6366F1]/15 text-[#818CF8]"
              }`}
            >
              {poll.isClosed ? "Closed" : "Live"}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#5C5F6B]">
            {poll.totalVotes !== null
              ? `${poll.totalVotes} vote${poll.totalVotes !== 1 ? "s" : ""} · ${poll.optionCount} options`
              : `${poll.optionCount} options`}
          </p>
        </Link>
      ))}
    </div>
  );
}