"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPollSchema } from "@/lib/validations/poll";

export default function NewPollForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const addOption = () => setOptions((prev) => [...prev, ""]);

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    const parsed = createPollSchema.safeParse({ title, options });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Something went wrong. Try again.");
        return;
      }

      const { id } = await res.json();
      router.push(`/polls/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-10 rounded-2xl border border-zinc-800 bg-[#15171C] p-6 sm:p-8">
      <div>
        <label
          htmlFor="poll-title"
          className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
        >
          Question
        </label>
        <input
          id="poll-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What should we build next?"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-[#F5F3EE] placeholder:text-zinc-600 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      <div className="mt-8">
        <span className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Options
        </span>

        <div className="mt-3 space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-sm font-medium text-zinc-500">
                {index + 1}
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-[#F5F3EE] placeholder:text-zinc-600 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  aria-label={`Remove option ${index + 1}`}
                  className="shrink-0 rounded-lg border border-zinc-800 px-3 py-3 text-zinc-600 transition hover:border-red-400/40 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addOption}
          className="mt-4 flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-400/20"
        >
          <span className="text-base leading-none">+</span> Add option
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-10 block w-full rounded-lg bg-amber-400 px-4 py-3 text-center font-semibold text-black transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:ring-offset-2 focus:ring-offset-[#15171C] disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create poll"}
      </button>
    </div>
  );
}