import { NextResponse } from "next/server";
import { getRecentJDMatches } from "@/lib/career/jd/repository";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ records: await getRecentJDMatches(user.id) });
}
