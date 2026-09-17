import { NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const records = await prisma.jobDescription.findMany({
        orderBy: {
            createdAt: "desc",
        },
        take: 10,
    });

    return NextResponse.json(
        {
            records,
        },
        { status: 200 },
    );
}