"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  pollId: string;
  title: string;
  totalVotes: number;
  optionCount: number;
  isClosed: boolean;
}

export default function ManagePollCard({
  pollId,
  title,
  totalVotes,
  optionCount,
  isClosed,
}: Props) {
  const router = useRouter();
  const [closed, setClosed] = useState(isClosed);
  const [loadingAction, setLoadingAction] = useState<"close" | "reset" | "delete" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = async () => {
    setLoadingAction("close");
    setError(null);
    try {
      const res = await fetch(`/api/polls/${pollId}/close`, { method: "POST" });
      if (res.ok) {
        setClosed(true);
      } else {
        const data = await res.json();
        setError(data.error ?? "Couldn't close this poll");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction("reset");
    setError(null);
    try {
      const res = await fetch(`/api/polls/${pollId}/reset`, { method: "POST" });
      if (res.ok) {
        router.refresh(); // re-fetch server data so vote counts show 0 immediately
      } else {
        const data = await res.json();
        setError(data.error ?? "Couldn't reset this poll");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    setLoadingAction("delete");
    setError(null);
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Couldn't delete this poll");
        setLoadingAction(null);
      }
    } catch {
      setError("Something went wrong");
      setLoadingAction(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <Link href={`/polls/${pollId}`} className="font-medium text-white hover:underline">
          {title}
        </Link>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            closed ? "bg-neutral-800 text-neutral-400" : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {closed ? "Closed" : "Live"}
        </span>
      </div>

      <p className="mt-1 text-sm text-neutral-500">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · {optionCount} options
      </p>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        {!closed && (
          <button
            type="button"
            onClick={handleClose}
            disabled={loadingAction !== null}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-white/30 disabled:opacity-50"
          >
            {loadingAction === "close" ? "Closing..." : "Close poll"}
          </button>
        )}

        <button
          type="button"
          onClick={handleReset}
          disabled={loadingAction !== null}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-white/30 disabled:opacity-50"
        >
          {loadingAction === "reset" ? "Resetting..." : "Reset votes"}
        </button>

        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loadingAction !== null}
              className="rounded-lg bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {loadingAction === "delete" ? "Deleting..." : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-400"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={loadingAction !== null}
            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}