
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EvaluateRequestBody {
    questionId?: string;
    answer?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as EvaluateRequestBody;
        const answer = body.answer?.trim();

        if (!answer) {
            return NextResponse.json(
                { error: "answer is required" },
                { status: 400 },
            );
        }

        const result = {
            score: 78,
            dimensions: [
                {
                    name: "技术准确性",
                    score: 80,
                    comment: "能说明基本概念，但对 LangGraph 状态流转解释还不够完整。",
                },
                {
                    name: "项目理解深度",
                    score: 75,
                    comment: "能讲出模块关系，但缺少对 checkpoint 和工具审批机制的深入解释。",
                },
                {
                    name: "表达结构",
                    score: 82,
                    comment: "回答结构较清晰，建议按照调用链组织语言。",
                },
                {
                    name: "面试亮点",
                    score: 72,
                    comment: "可以补充为什么这样设计，以及和普通 ChatBot 的区别。",
                },
            ],
            suggestion:
                "建议按“前端输入 → SSE → route.ts → agentService → LangGraph → checkpoint → 前端渲染”的链路回答，会更完整。",
        };

        return NextResponse.json(result, { status: 200 });
    } catch {
        return NextResponse.json(
            { error: "Failed to evaluate answer" },
            { status: 500 },
        );
    }
}