import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import NewPollForm from "./NewPollForm";

export default async function NewPollPage() {
  const user = await getCurrentUser();

  // No cookie read happens on the client at all — by the time any HTML
  // reaches the browser, we already know whether this user is allowed here.
  if (!user) {
    redirect("/login"); // adjust to whatever your actual login route is
  }

  return (
    <div className="min-h-screen bg-[#0B0C0F] px-6 py-15">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/80">
          Votify
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#F5F3EE]">
          Create a poll
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Give your poll a clear question and at least two options.
        </p>

        <NewPollForm />
      </div>
    </div>
  );
}