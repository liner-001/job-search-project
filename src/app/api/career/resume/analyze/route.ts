import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { NextRequest, NextResponse } from "next/server";
import { parseStructuredOutput } from "@/lib/agent/structured-output";
import { createChatModel } from "@/lib/agent/util";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";
import { indexResumeDocument } from "@/lib/career/rag";
import { parseResumeFile } from "@/lib/career/rag/parser";
import { resumeAnalysisSchema } from "@/lib/career/resumes/schema";
import prisma from "@/lib/database/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const allowedExtensions = new Set([
  ".txt",
  ".md",
  ".pdf",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择简历文件" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "简历文件不能超过 10MB" }, { status: 400 });
    }
    const name = file.name.toLowerCase();
    const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    if (!allowedMimeTypes.has(file.type) && !allowedExtensions.has(extension)) {
      return NextResponse.json(
        { error: "只支持 TXT / MD / PDF / DOCX / JPG / PNG / WEBP" },
        { status: 400 },
      );
    }

    const parsedFile = await parseResumeFile(file);
    if (!parsedFile.text.trim()) {
      return NextResponse.json({ error: "简历中没有提取到文本" }, { status: 400 });
    }

    const agentTrace = runCareerAgentRuntime({ task: "resume.analyze", input: parsedFile.text });
    const llm = createChatModel({
      provider: process.env.RAG_MODEL_PROVIDER || "openai",
      model: process.env.RAG_MODEL || process.env.DEFAULT_MODEL || "deepseek-v4-flash",
      temperature: 0.2,
    });
    const response = await llm.invoke([
      new SystemMessage(`你是简历分析 Agent。只返回 JSON：
{"score": number, "summary": {"targetRole": string, "education": string, "experienceLevel": string}, "skills": string[], "projectHighlights": string[], "suggestions": string[]}
score 必须为 0 到 100 的整数。只能提取简历中存在或能由明确证据推断的信息。`),
      new HumanMessage(`文件名：${file.name}\n\n简历正文：\n${parsedFile.text}`),
    ]);
    const analysis = parseStructuredOutput(resumeAnalysisSchema, response.content);
    const saved = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        score: analysis.score,
        targetRole: analysis.summary.targetRole,
        education: analysis.summary.education,
        experienceLevel: analysis.summary.experienceLevel,
        skills: analysis.skills,
        projectHighlights: analysis.projectHighlights,
        suggestions: analysis.suggestions,
      },
    });
    const ragIndex = await indexResumeDocument({
      resumeId: saved.id,
      fileName: file.name,
      text: parsedFile.text,
    });

    return NextResponse.json({
      id: saved.id,
      fileName: file.name,
      fileType: parsedFile.fileType,
      ...analysis,
      ragIndex,
      agentTrace,
    });
  } catch (error) {
    console.error("Failed to analyze resume:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "简历分析失败" },
      { status: 500 },
    );
  }
}
