"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh(); // re-runs server components so they see the cleared session
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:opacity-50"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}