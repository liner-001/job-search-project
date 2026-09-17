import { NextRequest, NextResponse } from "next/server";
import { runJobPilotAgent } from "@/lib/career/agentCore";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q") || "帮我优化这段项目经历";

    const trace = runJobPilotAgent(query);

    return NextResponse.json({
        success: true,
        trace,
    });
}