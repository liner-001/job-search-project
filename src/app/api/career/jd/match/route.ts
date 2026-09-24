import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { NextRequest, NextResponse } from "next/server";
import { parseStructuredOutput, toStringArray } from "@/lib/agent/structured-output";
import { createChatModel } from "@/lib/agent/util";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";
import { jdAnalysisSchema, jdMatchInputSchema } from "@/lib/career/jd/schema";
import { searchCareerKnowledge } from "@/lib/career/rag";
import prisma from "@/lib/database/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: unknown = await request.json();
    const input = jdMatchInputSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? "岗位描述无效" },
        { status: 400 },
      );
    }
    const { jdText } = input.data;
    const latestResume = await prisma.resume.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const resumeSkills = toStringArray(latestResume?.skills);
    const resumeHighlights = toStringArray(latestResume?.projectHighlights);
    const resumeSuggestions = toStringArray(latestResume?.suggestions);
    const ragDocs = latestResume
      ? await searchCareerKnowledge(
          `检索与岗位要求相关的技能、项目和业务经历：${jdText}`,
          5,
          latestResume.id,
        )
      : [];
    const ragContext = ragDocs.length
      ? ragDocs.map((doc, index) => `[${index + 1}] ${doc.citation}\n${doc.content}`).join("\n\n")
      : "暂无可用的简历原文片段";

    const agentTrace = runCareerAgentRuntime({
      task: "jd.match",
      input: jdText,
      userContext: { resumeId: latestResume?.id ?? null },
    });
    const llm = createChatModel({
      provider: process.env.RAG_MODEL_PROVIDER || "openai",
      model: process.env.RAG_MODEL || process.env.DEFAULT_MODEL || "deepseek-v4-flash",
      temperature: 0.2,
    });
    const response = await llm.invoke([
      new SystemMessage(`你是求职匹配分析 Agent。只返回 JSON：
{"matchScore": number, "level": "强烈推荐投递" | "推荐投递" | "谨慎投递" | "暂不推荐", "strengths": string[], "weaknesses": string[], "suggestions": string[]}
matchScore 必须为 0 到 100 的整数。结论必须有候选人材料依据。`),
      new HumanMessage(`候选人简历画像：
文件名：${latestResume?.fileName ?? "暂无"}
目标方向：${latestResume?.targetRole ?? "暂无"}
教育背景：${latestResume?.education ?? "暂无"}
经验阶段：${latestResume?.experienceLevel ?? "暂无"}
技能：${resumeSkills.join("、") || "暂无"}
项目亮点：${resumeHighlights.join("；") || "暂无"}
已有建议：${resumeSuggestions.join("；") || "暂无"}

简历 RAG 证据：
${ragContext}

岗位 JD：
${jdText}`),
    ]);
    const result = parseStructuredOutput(jdAnalysisSchema, response.content);
    const saved = await prisma.jobDescription.create({
      data: {
        userId: user.id,
        title: jdText.slice(0, 40),
        content: jdText,
        matchScore: result.matchScore,
        level: result.level,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        suggestions: result.suggestions,
      },
    });

    return NextResponse.json({
      id: saved.id,
      resumeContext: {
        fileName: latestResume?.fileName ?? null,
        targetRole: latestResume?.targetRole ?? null,
        skills: resumeSkills,
      },
      ragEvidence: ragDocs.map((doc, index) => ({
        index: index + 1,
        title: doc.title,
        citation: doc.citation,
        score: doc.score,
        content: doc.content,
      })),
      ...result,
      agentTrace,
    });
  } catch (error) {
    console.error("Failed to analyze JD:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "JD 匹配失败" },
      { status: 500 },
    );
  }
}
