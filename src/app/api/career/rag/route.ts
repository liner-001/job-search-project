import { NextRequest, NextResponse } from "next/server";
import { answerWithCareerRag } from "@/lib/career/rag";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { query?: string; resumeId?: string };
        const query = body.query?.trim();

        if (!query) {
            return NextResponse.json(
                { error: "query is required" },
                { status: 400 },
            );
        }

        const ragResult = await answerWithCareerRag(query, {
            resumeId: body.resumeId,
        });

        const agentTrace = runCareerAgentRuntime({
            task: "agent.chat",
            input: query,
        });

        return NextResponse.json(
            {
                ...ragResult,
                agentTrace: {
                    ...agentTrace,
                    tools: [
                        ...agentTrace.tools,
                        {
                            name: "career_rag_retrieval",
                            status: "success",
                            latencyMs: 90,
                            summary: `命中 ${ragResult.retrievedDocs.length} 条求职知识库片段`,
                        },
                    ],
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Failed to run career RAG:", error);

        return NextResponse.json(
            { error: "Failed to run career RAG" },
            { status: 500 },
        );
    }
}
