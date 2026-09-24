"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import {
  resumeAnalyzeResponseSchema,
  type ResumeAnalyzeResponse,
  type ResumeView,
} from "@/lib/career/resumes/schema";

function getError(payload: unknown, fallback: string) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : fallback;
}

export function ResumePanel({
  latestResume = null,
}: {
  latestResume?: ResumeView | null;
}) {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ResumeAnalyzeResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/career/resume/analyze", {
        method: "POST",
        body: formData,
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getError(payload, "简历分析失败"));
      const parsed = resumeAnalyzeResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("服务器返回的简历分析数据不完整");
      setResult(parsed.data);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "简历分析失败");
    } finally {
      setIsUploading(false);
    }
  }

  const summary =
    result?.summary ??
    (latestResume
      ? {
          targetRole: latestResume.targetRole,
          education: latestResume.education,
          experienceLevel: latestResume.experienceLevel,
        }
      : null);
  const score = result?.score ?? latestResume?.score;
  const groups: [string, string[]][] = [
    ["技能栈", result?.skills ?? latestResume?.skills ?? []],
    ["项目亮点", result?.projectHighlights ?? latestResume?.projectHighlights ?? []],
    ["优化建议", result?.suggestions ?? latestResume?.suggestions ?? []],
  ];

  return (
    <section>
      <header>
        <h1 className="text-3xl font-bold">简历中心</h1>
        <p className="mt-2 text-sm text-slate-500">
          上传简历后，由 AI 提取结构化信息并写入向量知识库。
        </p>
      </header>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
        <label className="flex cursor-pointer flex-col items-center text-center">
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="mt-3 text-sm font-medium">上传 TXT / PDF / DOCX / 图片简历</span>
          <span className="mt-1 text-xs text-slate-500">JD 匹配和知识库问答会自动使用最新简历</span>
          <input
            type="file"
            accept=".txt,.md,.pdf,.docx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </label>
      </div>
      {isUploading && (
        <p className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          正在解析 {fileName} 并建立索引…
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {summary && score !== undefined && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{result ? "本次分析结果" : "最新简历画像"}</h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                {score}/100
              </span>
            </div>
            {result && (
              <p className="mt-2 text-xs text-slate-500">
                RAG 已索引 {result.ragIndex.chunkCount} 个片段 · {result.ragIndex.embeddingProvider}
              </p>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["目标方向", summary.targetRole],
                ["教育背景", summary.education],
                ["经验阶段", summary.experienceLevel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {groups.map(([title, items]) => (
              <section key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold">{title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
