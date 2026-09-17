// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/database/prisma";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// interface JDMatchRequestBody {
//     jdText?: string;
// }

// export async function POST(req: NextRequest) {
//     try {
//         const body = (await req.json()) as JDMatchRequestBody;
//         const jdText = body.jdText?.trim();

//         if (!jdText) {
//             return NextResponse.json(
//                 { error: "jdText is required" },
//                 { status: 400 },
//             );
//         }

//         const result = {
//             matchScore: 84,
//             level: "推荐投递",
//             strengths: [
//                 "React / TypeScript 技术栈匹配",
//                 "具备 AI Agent 项目经验",
//                 "有前后端联调和流式响应经验",
//             ],
//             weaknesses: [
//                 "简历中缺少性能优化的量化指标",
//                 "后端工程化经验描述不足",
//                 "缺少线上部署和监控相关说明",
//             ],
//             suggestions: [
//                 "补充 SSE 流式响应优化的实现细节",
//                 "强调 LangGraph 状态图和工具调用设计",
//                 "增加 Docker / PostgreSQL / Prisma 的项目部署描述",
//             ],
//         };

//         const saved = await prisma.jobDescription.create({
//             data: {
//                 title: jdText.slice(0, 40),
//                 content: jdText,
//                 matchScore: result.matchScore,
//                 level: result.level,
//                 strengths: result.strengths,
//                 weaknesses: result.weaknesses,
//                 suggestions: result.suggestions,
//             },
//         });

//         return NextResponse.json(
//             {
//                 id: saved.id,
//                 ...result,
//             },
//             { status: 200 },
//         );
//     } catch (error) {
//         console.error("Failed to analyze JD:", error);

//         return NextResponse.json(
//             { error: "Failed to analyze JD" },
//             { status: 500 },
//         );
//     }
// }



// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/database/prisma";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// interface JDMatchRequestBody {
//     jdText?: string;
// }

// function toStringArray(value: unknown): string[] {
//     return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
// }

// export async function POST(req: NextRequest) {
//     try {
//         const body = (await req.json()) as JDMatchRequestBody;
//         const jdText = body.jdText?.trim();

//         if (!jdText) {
//             return NextResponse.json(
//                 { error: "jdText is required" },
//                 { status: 400 },
//             );
//         }

//         const latestResume = await prisma.resume.findFirst({
//             orderBy: {
//                 createdAt: "desc",
//             },
//         });

//         const resumeSkills = toStringArray(latestResume?.skills);
//         const hasAgentStack = resumeSkills.some((skill) =>
//             ["LangGraph.js", "LangChain.js", "Next.js", "React", "TypeScript"].includes(skill),
//         );

//         const result = {
//             matchScore: latestResume ? (hasAgentStack ? 86 : 76) : 68,
//             level: latestResume ? "推荐投递" : "建议先上传简历",
//             resumeContext: {
//                 fileName: latestResume?.fileName ?? null,
//                 targetRole: latestResume?.targetRole ?? null,
//                 skills: resumeSkills,
//             },
//             strengths: latestResume
//                 ? [
//                     `已结合最近简历：${latestResume.fileName}`,
//                     "简历中包含 React / TypeScript / Next.js 等前端技术栈",
//                     hasAgentStack
//                         ? "简历中包含 LangGraph / Agent 项目经验，与 AI 应用岗位相关"
//                         : "简历中有前端项目经验，可继续补充 Agent 相关亮点",
//                 ]
//                 : [
//                     "当前未检测到已上传简历，只能基于 JD 做初步分析",
//                     "建议先上传简历，以便生成更准确的匹配结果",
//                 ],
//             weaknesses: [
//                 "简历中项目成果量化指标仍然不足",
//                 "需要进一步突出和岗位 JD 相关的工程实践",
//                 "可以补充部署、数据库、工具调用等全栈能力描述",
//             ],
//             suggestions: [
//                 "将 LangGraph Agent 项目放到项目经历靠前位置",
//                 "补充 SSE 流式响应、PostgreSQL checkpoint、MCP 工具调用等关键词",
//                 "针对 JD 中的核心技术栈调整简历项目描述顺序",
//             ],
//         };

//         const saved = await prisma.jobDescription.create({
//             data: {
//                 title: jdText.slice(0, 40),
//                 content: jdText,
//                 matchScore: result.matchScore,
//                 level: result.level,
//                 strengths: result.strengths,
//                 weaknesses: result.weaknesses,
//                 suggestions: result.suggestions,
//             },
//         });

//         return NextResponse.json(
//             {
//                 id: saved.id,
//                 ...result,
//             },
//             { status: 200 },
//         );
//     } catch (error) {
//         console.error("Failed to analyze JD:", error);

//         return NextResponse.json(
//             { error: "Failed to analyze JD" },
//             { status: 500 },
//         );
//     }
// }






import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import prisma from "@/lib/database/prisma";
import { createChatModel } from "@/lib/agent/util";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";
import { searchCareerKnowledge } from "@/lib/career/rag";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface JDMatchRequestBody {
    jdText?: string;
}

interface JDMatchLLMResult {
    matchScore: number;
    level: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
}

function toStringArray(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
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

function parseJsonFromModel(text: string): JDMatchLLMResult {
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const parsed = JSON.parse(cleaned) as Partial<JDMatchLLMResult>;

    return {
        matchScore: typeof parsed.matchScore === "number" ? parsed.matchScore : 70,
        level: typeof parsed.level === "string" ? parsed.level : "谨慎投递",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as JDMatchRequestBody;
        const jdText = body.jdText?.trim();

        if (!jdText) {
            return NextResponse.json(
                { error: "jdText is required" },
                { status: 400 },
            );
        }

        const latestResume = await prisma.resume.findFirst({
            orderBy: {
                createdAt: "desc",
            },
        });

        const resumeSkills = toStringArray(latestResume?.skills);
        const resumeHighlights = toStringArray(latestResume?.projectHighlights);
        const resumeSuggestions = toStringArray(latestResume?.suggestions);
        const ragDocs = latestResume
            ? await searchCareerKnowledge(
                `根据岗位 JD 检索候选人简历中相关的技能、项目经验和业务经历：${jdText}`,
                5,
                latestResume.id,
            )
            : [];
        const ragContext = ragDocs.length
            ? ragDocs
                .map((doc, index) => `[${index + 1}] ${doc.citation}\n${doc.content}`)
                .join("\n\n")
            : "暂无可用的简历 RAG 检索片段";

        const agentTrace = runCareerAgentRuntime({
            task: "jd.match",
            input: jdText,
            userContext: {
                resumeId: latestResume?.id ?? null,
            },
        });

        const llm = createChatModel({
            provider: "openai",
            model: "deepseek-v4-flash",
            temperature: 0.2,
        });

        const systemPrompt = `
你是一个求职匹配分析 Agent。
你的任务是根据候选人的简历画像和岗位 JD，输出结构化匹配分析。

你必须只返回 JSON，不要返回 Markdown，不要解释。
JSON 格式必须是：
{
  "matchScore": number,
  "level": string,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[]
}

评分规则：
- matchScore 范围是 0 到 100
- level 可以是 "强烈推荐投递"、"推荐投递"、"谨慎投递"、"暂不推荐"
- strengths 写候选人与 JD 匹配的地方
- weaknesses 写候选人相对 JD 的缺口
- suggestions 写简历优化建议
`;

        const userPrompt = `
候选人简历画像：
文件名：${latestResume?.fileName ?? "暂无简历"}
目标方向：${latestResume?.targetRole ?? "暂无"}
教育背景：${latestResume?.education ?? "暂无"}
求职阶段：${latestResume?.experienceLevel ?? "暂无"}
技能栈：${resumeSkills.join("、") || "暂无"}
项目亮点：${resumeHighlights.join("；") || "暂无"}
已有优化建议：${resumeSuggestions.join("；") || "暂无"}

候选人简历 RAG 检索证据：
${ragContext}

岗位 JD：
${jdText}

请基于以上信息进行 JD 匹配分析。重要结论优先参考简历 RAG 检索证据，不要编造简历中不存在的经历。
`;

        const response = await llm.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ]);

        const text = getMessageText(response.content);
        const result = parseJsonFromModel(text);

        const saved = await prisma.jobDescription.create({
            data: {
                title: jdText.slice(0, 40),
                content: jdText,
                matchScore: result.matchScore,
                level: result.level,
                strengths: result.strengths,
                weaknesses: result.weaknesses,
                suggestions: result.suggestions,
            },
        });

        return NextResponse.json(
            {
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
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Failed to analyze JD:", error);

        return NextResponse.json(
            { error: "Failed to analyze JD" },
            { status: 500 },
        );
    }
}
