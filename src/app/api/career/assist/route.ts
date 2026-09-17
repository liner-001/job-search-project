// import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// export async function GET() {
//     const result = {
//         profile: {
//             targetRole: "前端 / AI 应用开发",
//             coreStack: ["React", "TypeScript", "Next.js", "LangGraph.js", "PostgreSQL"],
//             currentStage: "秋招项目强化",
//         },
//         weaknesses: [
//             "项目成果量化不足",
//             "Agent 编排讲解还需要更熟",
//             "数据库设计亮点偏少",
//         ],
//         nextSuggestion:
//             "优先完善 JD 匹配和模拟面试两个闭环，这两个模块最容易体现 Agent 项目的业务价值。",
//         recommendedActions: [
//             "给 JD 匹配模块接入 LangGraph Agent",
//             "把模拟面试评分改成 LLM-as-Judge",
//             "为投递管理增加 Prisma 数据表",
//         ],
//     };

//     return NextResponse.json(result, { status: 200 });
// }


import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const result = {
        profile: {
            targetRole: "前端 / AI 应用开发",
            coreStack: ["React", "TypeScript", "Next.js", "LangGraph.js", "PostgreSQL"],
            currentStage: "秋招项目强化",
        },
        weaknesses: [
            "项目成果量化不足",
            "Agent 编排讲解还需要更熟",
            "数据库设计亮点偏少",
        ],
        nextSuggestion:
            "优先完善 JD 匹配和模拟面试两个闭环，这两个模块最容易体现 Agent 项目的业务价值。",
        recommendedActions: [
            "给 JD 匹配模块接入 LangGraph Agent",
            "把模拟面试评分改成 LLM-as-Judge",
            "为投递管理增加 Prisma 数据表",
        ],
        agentRuntime: {
            intent: "resume_optimization",
            routedAgent: "ResumeAgent",
            selectedTools: ["analyze_resume", "rewrite_project_experience"],
            memory: ["短期记忆", "线程记忆", "摘要记忆"],
            monitor: {
                latencyMs: 860,
                toolSuccessRate: "97%",
                resolvedRate: "82%",
            },
            eval: {
                accuracy: 8.6,
                completeness: 8.2,
                actionability: 8.8,
                safety: 9.1,
            },
        },
    };

    return NextResponse.json(result, { status: 200 });
}