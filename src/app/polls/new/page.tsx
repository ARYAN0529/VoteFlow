import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import NewPollForm from "./NewPollForm";

export default async function NewPollPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      user={user}
      activePath="/polls/new"
      pageTitle="New poll"
      pageSubtitle="Ask a question, add your options."
    >
      <div className="mx-auto max-w-xl">
        <NewPollForm />
      </div>
    </AppShell>
  );
}