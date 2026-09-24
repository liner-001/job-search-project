import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { parseStructuredOutput } from "@/lib/agent/structured-output";
import { createChatModel } from "@/lib/agent/util";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";
import {
  interviewEvaluationInputSchema,
  interviewEvaluationSchema,
} from "@/lib/career/interviews/schema";
import prisma from "@/lib/database/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: unknown = await request.json();
    const input = interviewEvaluationInputSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? "面试回答无效" },
        { status: 400 },
      );
    }
    const { questionId, question, answer } = input.data;
    const agentTrace = runCareerAgentRuntime({
      task: "interview.evaluate",
      input: `${question}\n${answer}`,
    });
    const llm = createChatModel({
      provider: process.env.RAG_MODEL_PROVIDER || "openai",
      model: process.env.RAG_MODEL || process.env.DEFAULT_MODEL || "deepseek-v4-flash",
      temperature: 0.2,
    });
    const response = await llm.invoke([
      new SystemMessage(`你是前端与 AI Agent 方向的技术面试官。只返回 JSON：
{"score": number, "dimensions": [{"name": string, "score": number, "comment": string}], "suggestion": string}
总分和维度分必须是 0 到 100 的整数。dimensions 包含技术准确性、项目理解深度、表达结构、面试亮点。`),
      new HumanMessage(`面试题：\n${question}\n\n候选人回答：\n${answer}`),
    ]);
    const result = parseStructuredOutput(interviewEvaluationSchema, response.content);
    const saved = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        questionId,
        question,
        answer,
        score: result.score,
        dimensions: result.dimensions as Prisma.InputJsonValue,
        suggestion: result.suggestion,
      },
    });
    return NextResponse.json({ id: saved.id, ...result, agentTrace });
  } catch (error) {
    console.error("Failed to evaluate answer:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "面试评分失败" },
      { status: 500 },
    );
  }
}
