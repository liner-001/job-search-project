import { CareerNavigation } from "@/components/career/CareerNavigation";
import { AgentAssistPanel } from "@/components/career/AgentAssistPanel";
import { requireUser } from "@/lib/auth/session";

export default async function CareerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <CareerNavigation user={user} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </main>
      <AgentAssistPanel />
    </div>
  );
}
