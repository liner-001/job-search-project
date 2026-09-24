import { NextResponse } from "next/server";
import { fetchThreadHistory } from "@/services/agentService";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // In Next.js 15 dynamic route handlers, params is now async.
  const { threadId } = await params;

  const messages = await fetchThreadHistory(user.id, threadId);
  return NextResponse.json(messages, { status: 200 });
}
