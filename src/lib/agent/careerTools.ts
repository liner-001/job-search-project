import { DynamicStructuredTool, DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "@/lib/database/prisma";
import { searchCareerKnowledge } from "@/lib/career/rag";

function toStringArray(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}

export const getLatestResumeTool = new DynamicTool({
    name: "get_latest_resume",
    description:
        "查询用户最近一次上传并分析的简历画像，包括文件名、评分、目标岗位、技能栈、项目亮点和优化建议。当用户询问自己的简历、技能、项目经历、求职画像时使用。",
    func: async () => {
        const resume = await prisma.resume.findFirst({
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!resume) {
            return "当前还没有简历分析记录。请先在简历中心上传 txt 简历。";
        }

        const skills = toStringArray(resume.skills);
        const highlights = toStringArray(resume.projectHighlights);
        const suggestions = toStringArray(resume.suggestions);

        return JSON.stringify(
            {
                fileName: resume.fileName,
                score: resume.score,
                targetRole: resume.targetRole,
                education: resume.education,
                experienceLevel: resume.experienceLevel,
                skills,
                projectHighlights: highlights,
                suggestions,
            },
            null,
            2,
        );
    },
});

export const getLatestJDAnalysisTool = new DynamicTool({
    name: "get_latest_jd_analysis",
    description:
        "查询最近一次岗位 JD 匹配分析结果，包括岗位文本摘要、匹配分数、推荐等级、优势项、短板和优化建议。当用户询问最近岗位、JD 匹配、岗位适配度、是否值得投递时使用。",
    func: async () => {
        const jd = await prisma.jobDescription.findFirst({
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!jd) {
            return "当前还没有 JD 匹配分析记录。请先在 JD 匹配页面粘贴岗位描述并开始匹配。";
        }

        const strengths = toStringArray(jd.strengths);
        const weaknesses = toStringArray(jd.weaknesses);
        const suggestions = toStringArray(jd.suggestions);

        return JSON.stringify(
            {
                title: jd.title,
                contentPreview: jd.content.slice(0, 300),
                matchScore: jd.matchScore,
                level: jd.level,
                strengths,
                weaknesses,
                suggestions,
            },
            null,
            2,
        );
    },
});

export const searchResumeKnowledgeTool = new DynamicStructuredTool({
    name: "search_resume_knowledge",
    description:
        "按用户问题检索最近上传简历的原文片段。询问候选人的技能、项目、经历、教育背景、项目证据或要求引用简历原文时必须调用。",
    schema: z.object({
        query: z.string().min(1).describe("要在简历中检索的问题或关键词"),
        limit: z.number().int().min(1).max(8).optional().describe("返回片段数量，默认 5"),
    }),
    func: async ({ query, limit }) => {
        const documents = await searchCareerKnowledge(query, limit ?? 5);
        if (documents.length === 0) {
            return "没有找到已入库的简历片段，请先在简历中心上传简历。";
        }

        return JSON.stringify(
            documents.map((document, index) => ({
                reference: `[${index + 1}]`,
                source: document.citation,
                score: document.score,
                content: document.content,
            })),
            null,
            2,
        );
    },
});

export const careerTools = [
    getLatestResumeTool,
    getLatestJDAnalysisTool,
    searchResumeKnowledgeTool,
];
