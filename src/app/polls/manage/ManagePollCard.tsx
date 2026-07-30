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
        router.refresh();
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
    <div className="rounded-xl border border-[#2A2D36] bg-[#15171E] p-5">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/polls/${pollId}`} className="font-medium leading-snug text-[#F2F2F5] hover:underline">
          {title}
        </Link>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            closed ? "bg-[#2A2D36] text-[#8B8F9C]" : "bg-[#6366F1]/15 text-[#818CF8]"
          }`}
        >
          {closed ? "Closed" : "Live"}
        </span>
      </div>

      <p className="mt-2 text-sm text-[#5C5F6B]">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · {optionCount} options
      </p>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {!closed && (
          <button
            type="button"
            onClick={handleClose}
            disabled={loadingAction !== null}
            className="rounded-md border border-[#2A2D36] px-3 py-1.5 text-sm text-[#C8CAD3] transition hover:border-[#3A3D46] hover:text-[#F2F2F5] disabled:opacity-50"
          >
            {loadingAction === "close" ? "Closing..." : "Close"}
          </button>
        )}

        <button
          type="button"
          onClick={handleReset}
          disabled={loadingAction !== null}
          className="rounded-md border border-[#2A2D36] px-3 py-1.5 text-sm text-[#C8CAD3] transition hover:border-[#3A3D46] hover:text-[#F2F2F5] disabled:opacity-50"
        >
          {loadingAction === "reset" ? "Resetting..." : "Reset"}
        </button>

        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loadingAction !== null}
              className="rounded-md bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {loadingAction === "delete" ? "Deleting..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md border border-[#2A2D36] px-3 py-1.5 text-sm text-[#8B8F9C]"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={loadingAction !== null}
            className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}