import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/database/prisma";
import { createChatModel } from "@/lib/agent/util";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EvaluateRequestBody {
    questionId?: string;
    question?: string;
    answer?: string;
}

interface EvaluationDimension {
    name: string;
    score: number;
    comment: string;
}

interface EvaluationResult {
    score: number;
    dimensions: EvaluationDimension[];
    suggestion: string;
}

function getMessageText(content: unknown): string {
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (typeof item === "string") return item;
                if (
                    item &&
                    typeof item === "object" &&
                    "text" in item &&
                    typeof item.text === "string"
                ) {
                    return item.text;
                }
                return "";
            })
            .join("");
    }

    return "";
}

function parseJsonFromModel(text: string): EvaluationResult {
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const parsed = JSON.parse(cleaned) as Partial<EvaluationResult>;

    return {
        score: typeof parsed.score === "number" ? parsed.score : 70,
        dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
        suggestion:
            typeof parsed.suggestion === "string"
                ? parsed.suggestion
                : "建议补充项目背景、技术方案和结果量化。",
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as EvaluateRequestBody;

        const questionId = body.questionId?.trim();
        const question = body.question?.trim();
        const answer = body.answer?.trim();

        if (!questionId || !question || !answer) {
            return NextResponse.json(
                { error: "questionId, question and answer are required" },
                { status: 400 },
            );
        }

        const agentTrace = runCareerAgentRuntime({
            task: "interview.evaluate",
            input: `${question}\n${answer}`,
        });

        const llm = createChatModel({
            provider: "openai",
            model: "deepseek-v4-flash",
            temperature: 0.2,
        });

        const systemPrompt = `
你是一个前端 / AI Agent 方向的技术面试官。
你的任务是对候选人的回答进行评分。

你必须只返回 JSON，不要返回 Markdown，不要解释。
JSON 格式必须是：
{
  "score": number,
  "dimensions": [
    {
      "name": string,
      "score": number,
      "comment": string
    }
  ],
  "suggestion": string
}

评分要求：
- score 范围 0 到 100
- dimensions 必须包含四项：
  1. 技术准确性
  2. 项目理解深度
  3. 表达结构
  4. 面试亮点
- 每个维度 score 范围 0 到 100
- comment 要具体指出优点和不足
- suggestion 给出下一次回答的改进建议
`;

        const userPrompt = `
面试题：
${question}

候选人回答：
${answer}

请对这个回答进行评分。
`;

        const response = await llm.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ]);

        const text = getMessageText(response.content);
        const result = parseJsonFromModel(text);

        const saved = await prisma.interviewSession.create({
            data: {
                questionId,
                question,
                answer,
                score: result.score,
                dimensions: result.dimensions as unknown as Prisma.InputJsonValue,
                suggestion: result.suggestion,
            },
        });

        return NextResponse.json(
            {
                id: saved.id,
                ...result,
                agentTrace,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Failed to evaluate answer:", error);

        return NextResponse.json(
            { error: "Failed to evaluate answer" },
            { status: 500 },
        );
    }
}
