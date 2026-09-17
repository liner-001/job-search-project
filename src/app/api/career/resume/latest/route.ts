import { NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const resume = await prisma.resume.findFirst({
        orderBy: {
            createdAt: "desc",
        },
    });

    return NextResponse.json(
        {
            resume,
        },
        { status: 200 },
    );
}