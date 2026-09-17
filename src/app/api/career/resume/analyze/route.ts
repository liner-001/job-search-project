import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import prisma from "@/lib/database/prisma";
import { createChatModel } from "@/lib/agent/util";
import { runCareerAgentRuntime } from "@/lib/career/agentRuntime";
import { indexResumeDocument } from "@/lib/career/rag";
import { parseResumeFile } from "@/lib/career/rag/parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ResumeLLMResult {
  score: number;
  summary: {
    targetRole: string;
    education: string;
    experienceLevel: string;
  };
  skills: string[];
  projectHighlights: string[];
  suggestions: string[];
}

function getMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
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

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseJsonFromModel(text: string): ResumeLLMResult {
  const withoutFence = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("模型未返回合法 JSON");

  const parsed = JSON.parse(withoutFence.slice(start, end + 1)) as Partial<ResumeLLMResult>;
  return {
    score:
      typeof parsed.score === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : 70,
    summary: {
      targetRole:
        typeof parsed.summary?.targetRole === "string"
          ? parsed.summary.targetRole
          : "待进一步确认",
      education:
        typeof parsed.summary?.education === "string"
          ? parsed.summary.education
          : "简历中未明确说明",
      experienceLevel:
        typeof parsed.summary?.experienceLevel === "string"
          ? parsed.summary.experienceLevel
          : "简历中未明确说明",
    },
    skills: toStringArray(parsed.skills),
    projectHighlights: toStringArray(parsed.projectHighlights),
    suggestions: toStringArray(parsed.suggestions),
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

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

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.includes(".")
      ? fileName.slice(fileName.lastIndexOf("."))
      : "";

    if (!allowedMimeTypes.has(file.type) && !allowedExtensions.has(fileExtension)) {
      return NextResponse.json(
        {
          error: "只支持 TXT / MD / PDF / DOCX / JPG / PNG / WEBP 格式的简历",
        },
        { status: 400 },
      );
    }


    const parsedFile = await parseResumeFile(file);
    if (!parsedFile.text) {
      return NextResponse.json({ error: "简历中没有提取到文本" }, { status: 400 });
    }

    const agentTrace = runCareerAgentRuntime({
      task: "resume.analyze",
      input: parsedFile.text,
    });
    const llm = createChatModel({
      provider: process.env.RAG_MODEL_PROVIDER || "openai",
      model:
        process.env.RAG_MODEL ||
        process.env.DEFAULT_MODEL ||
        "deepseek-v4-flash",
      temperature: 0.2,
    });
    const response = await llm.invoke([
      new SystemMessage(`你是简历分析 Agent。必须只返回 JSON，不要返回 Markdown 或解释。
JSON 格式：
{
  "score": number,
  "summary": { "targetRole": string, "education": string, "experienceLevel": string },
  "skills": string[],
  "projectHighlights": string[],
  "suggestions": string[]
}
只能提取简历中存在或可由明确证据推断的信息；score 范围为 0 到 100。`),
      new HumanMessage(`文件名：${file.name}\n\n简历正文：\n${parsedFile.text}`),
    ]);
    const analysis = parseJsonFromModel(getMessageText(response.content));

    const saved = await prisma.resume.create({
      data: {
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

    return NextResponse.json(
      {
        id: saved.id,
        fileName: file.name,
        fileType: parsedFile.fileType,
        ...analysis,
        ragIndex,
        agentTrace,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze resume";
    console.error("Failed to analyze resume:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
