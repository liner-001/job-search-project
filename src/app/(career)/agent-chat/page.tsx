import type { Metadata } from "next";
import { AgentChatPanel } from "@/components/career/AgentChatPanel";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Agent 对话" };
export default async function AgentChatPage() {
  const user = await requireUser();
  return <AgentChatPanel threadId={`jobpilot-${user.id}`} />;
}
