import { NextRequest, NextResponse } from "next/server";
import { createApplication, getApplications } from "@/lib/career/applications/repository";
import {
  applicationFiltersSchema,
  createApplicationSchema,
} from "@/lib/career/applications/schema";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const filters = applicationFiltersSchema.parse({
    status: request.nextUrl.searchParams.get("status") ?? "全部",
    query: request.nextUrl.searchParams.get("query") ?? "",
    page: request.nextUrl.searchParams.get("page") ?? "1",
  });
  const result = await getApplications(user.id, filters, 100);

  return NextResponse.json({
    applications: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: unknown = await request.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const created = await createApplication(user.id, parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create application:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
