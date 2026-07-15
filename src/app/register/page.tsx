"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

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
      // Step 1: ask the server for a challenge (registration options)
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

      // Step 2: this triggers the actual OS passkey prompt
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // Step 3: send the signed response back to the server to verify
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
  <div className="relative min-h-screen overflow-hidden bg-black">
    {/* Grid Background */}
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#000",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "56px 56px",
      }}
    />

    {/* Content */}
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/70 p-8 backdrop-blur-md">
        <h1 className="mb-6 text-2xl font-semibold text-white">
          Create your Votify account
        </h1>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none transition focus:border-blue-500 placeholder:text-neutral-500"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none transition focus:border-blue-500 placeholder:text-neutral-500"
          />

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-white px-4 py-2 font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? "Setting up passkey..." : "Register with passkey"}
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-white underline hover:text-neutral-300"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  </div>
);
}