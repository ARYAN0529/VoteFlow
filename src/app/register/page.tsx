"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import MeteorBackground from "@/components/MeteorBackground";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const optionsRes = await fetch("/api/auth/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        setError(options.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const registrationResponse = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationResponse),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        setError(verifyData.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Passkey registration was cancelled or failed");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#0A0B10] lg:grid-cols-2">
      {/* Left — meteor lines panel, matches login */}
      <div className="relative hidden overflow-hidden bg-black lg:block">
        <MeteorBackground />
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
              A fresh start. Set up your passkey in seconds.
            </h1>
            <p className="mt-3 text-sm text-[#B8BAC4]">
              No password to create or forget. Your device confirms it&apos;s you,
              every time you come back.
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

          <h2 className="text-2xl font-semibold text-[#F2F2F5]">Create your account</h2>
          <p className="mt-1 text-sm text-[#8B8F9C]">
            Enter your details, then set up your passkey.
          </p>

          <form onSubmit={handleRegister} className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#C8CAD3]">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-[#2A2D36] bg-[#15171E] px-3 py-2.5 text-sm text-[#F2F2F5] outline-none transition placeholder:text-[#5C5F6B] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
              />
            </div>

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
              {loading ? "Setting up passkey..." : "Continue with passkey"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#8B8F9C]">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-[#818CF8] hover:text-[#A5A8F5]">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}