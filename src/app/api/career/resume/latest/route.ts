import { NextResponse } from "next/server";
import { getLatestResume } from "@/lib/career/resumes/repository";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ resume: await getLatestResume(user.id) });
}
