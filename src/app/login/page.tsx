"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MeteorBackground from "@/components/MeteorBackground";
import { startAuthentication } from "@simplewebauthn/browser";



export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const optionsRes = await fetch("/api/auth/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        setError(options.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const authResponse = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResponse),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        setError(verifyData.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Passkey login was cancelled or failed");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#0A0B10] lg:grid-cols-2">
      {/* Left — meteor lines panel */}
      <div className="relative hidden overflow-hidden bg-black lg:block">
        <MeteorBackground />
        {/* Dark gradient overlay so text stays readable over the lines */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0B10] via-[#0A0B10]/40 to-[#0A0B10]/10" />

        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="20" height="20" rx="5" stroke="#5867f2" strokeWidth="1.6" />
              <path d="M6 11.5L9.5 15L16 7.5" stroke="#5867f2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-lg font-semibold tracking-tight text-white">Votify</span>
          </div>

          <div className="max-w-sm">
            <h1 className="text-3xl font-semibold leading-tight text-white">
              One path in. Sign in with your device, not a password.
            </h1>
            <p className="mt-3 text-sm text-[#B8BAC4]">
              Votify uses passkeys — your fingerprint, face, or PIN confirms it&apos;s you.
              Nothing to remember, nothing to leak.
            </p>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="20" height="20" rx="5" stroke="#6366F1" strokeWidth="1.6" />
              <path d="M6 11.5L9.5 15L16 7.5" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-base font-semibold tracking-tight text-[#F2F2F5]">Votify</span>
          </div>

          <h2 className="text-2xl font-semibold text-[#F2F2F5]">Log in</h2>
          <p className="mt-1 text-sm text-[#8B8F9C]">
            Enter your email, then confirm with your passkey.
          </p>

          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#C8CAD3]">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-[#2A2D36] bg-[#15171E] px-3 py-2.5 text-sm text-[#F2F2F5] outline-none transition placeholder:text-[#5C5F6B] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-[#6366F1] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4F46E5] disabled:opacity-50"
            >
              {loading ? "Verifying passkey..." : "Continue with passkey"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#8B8F9C]">
            No account yet?{" "}
            <a href="/register" className="font-medium text-[#818CF8] hover:text-[#A5A8F5]">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}