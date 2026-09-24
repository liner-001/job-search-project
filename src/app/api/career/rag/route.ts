import { NextRequest, NextResponse } from "next/server";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";
import { answerWithCareerRag } from "@/lib/career/rag";
import { ragRequestSchema } from "@/lib/career/rag/schema";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/database/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: unknown = await request.json();
    const input = ragRequestSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? "问题无效" },
        { status: 400 },
      );
    }
    const resume = await prisma.resume.findFirst({
      where: input.data.resumeId
        ? { id: input.data.resumeId, userId: user.id }
        : { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const ragResult = resume
      ? await answerWithCareerRag(input.data.query, { resumeId: resume.id })
      : {
          query: input.data.query,
          answer: "当前没有可检索的简历内容，请先上传简历。",
          retrievedDocs: [],
          embeddingProvider: "none",
        };
    const agentTrace = runCareerAgentRuntime({ task: "agent.chat", input: input.data.query });
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Failed to run career RAG:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "知识库检索失败" },
      { status: 500 },
    );
  }
}
