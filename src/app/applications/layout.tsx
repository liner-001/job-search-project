import { AgentAssistPanel } from "@/components/career/AgentAssistPanel";
import { CareerNavigation } from "@/components/career/CareerNavigation";
import { requireUser } from "@/lib/auth/session";

export default async function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <CareerNavigation user={user} />
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      <AgentAssistPanel />
    </div>
  );
}
