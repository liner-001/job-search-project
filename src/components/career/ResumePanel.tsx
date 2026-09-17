// 简历中心是整个求职 Agent 的核心上下文来源。简历上传后，系统会把非结构化简历内容转成结构化数据，
// 后续 JD 匹配、简历优化、模拟面试都基于这份简历上下文进行。
"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

interface ResumeAnalyzeResult {
    id: string;
    fileName: string;
    score: number;
    summary: {
        targetRole: string;
        education: string;
        experienceLevel: string;
    };
    skills: string[];
    projectHighlights: string[];
    suggestions: string[];
    ragIndex: {
        documentId: string;
        chunkCount: number;
        embeddingProvider: string;
    };
}

export const ResumePanel = () => {
    const [fileName, setFileName] = useState("");
    const [result, setResult] = useState<ResumeAnalyzeResult | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = async (file?: File) => {
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

            const data = (await response.json()) as ResumeAnalyzeResult & { error?: string };
            if (!response.ok) throw new Error(data.error || "Failed to analyze resume");
            setResult(data);
        } catch (error) {
            console.error("Failed to analyze resume:", error);
            setError(error instanceof Error ? error.message : "简历分析失败");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-2xl font-semibold">简历中心</h2>
                <p className="mt-1 text-sm text-slate-500">
                    上传简历后，Agent 会解析教育经历、项目经历、技能栈和优化建议。
                </p>
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
                <label className="flex cursor-pointer flex-col items-center justify-center text-center">
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="mt-3 text-sm font-medium text-slate-700">
                        上传 TXT / PDF / DOCX 简历/图片简历
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                        系统会真实解析正文并写入向量知识库
                    </span>
                    <input
                        type="file"
                        accept=".txt,.md,.pdf,.docx,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0])}
                    />
                </label>
            </div>

            {error && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {fileName && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="font-medium">当前简历</h3>
                    <p className="mt-2 text-sm text-slate-600">{fileName}</p>
                    {isUploading && (
                        <p className="mt-3 text-sm text-slate-500">正在分析简历...</p>
                    )}
                </div>
            )}

            {result && (
                <div className="mt-5 space-y-5">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">简历分析结果</h3>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                                评分 {result.score} / 100
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            简历记录 ID：{result.id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            RAG 已索引 {result.ragIndex.chunkCount} 个片段 · {result.ragIndex.embeddingProvider}
                        </p>

                        <div className="mt-5 grid grid-cols-3 gap-4">
                            <div className="rounded-md bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">目标方向</p>
                                <p className="mt-2 font-medium">{result.summary.targetRole}</p>
                            </div>
                            <div className="rounded-md bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">教育背景</p>
                                <p className="mt-2 font-medium">{result.summary.education}</p>
                            </div>
                            <div className="rounded-md bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">求职阶段</p>
                                <p className="mt-2 font-medium">{result.summary.experienceLevel}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h4 className="text-sm font-medium">技能栈</h4>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {result.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h4 className="text-sm font-medium">项目亮点</h4>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                {result.projectHighlights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h4 className="text-sm font-medium">优化建议</h4>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                {result.suggestions.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
