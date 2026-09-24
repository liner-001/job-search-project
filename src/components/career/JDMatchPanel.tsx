"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  jdMatchInputSchema,
  jdMatchResponseSchema,
  type JDMatchResponse,
} from "@/lib/career/jd/schema";

function getError(payload: unknown) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : "JD 匹配失败";
}

export function JDMatchPanel() {
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<JDMatchResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleMatch() {
    const input = jdMatchInputSchema.safeParse({ jdText });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? "请输入岗位描述");
      return;
    }
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/career/jd/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getError(payload));
      const parsed = jdMatchResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("服务器返回的 JD 分析数据不完整");
      setResult(parsed.data);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "JD 匹配失败");
    } finally {
      setIsLoading(false);
    }
  }

  const groups: [string, string[]][] = result
    ? [
        ["优势匹配", result.strengths],
        ["能力缺口", result.weaknesses],
        ["优化建议", result.suggestions],
      ]
    : [];

  return (
    <section>
      <header>
        <h1 className="text-3xl font-bold">JD 匹配</h1>
        <p className="mt-2 text-sm text-slate-500">
          结合最新简历画像与 RAG 原文证据分析岗位匹配度。
        </p>
      </header>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="jd-text" className="text-sm font-medium">
          岗位描述
        </label>
        <textarea
          id="jd-text"
          value={jdText}
          onChange={(event) => setJdText(event.target.value)}
          className="mt-3 h-52 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
          placeholder="粘贴岗位职责、任职要求和技术栈…"
        />
        <button
          type="button"
          onClick={handleMatch}
          disabled={isLoading}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:bg-slate-300"
        >
          {isLoading ? "分析中…" : "开始匹配"}
        </button>
      </div>
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">匹配结果</h2>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                {result.level} · {result.matchScore}%
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              使用简历：{result.resumeContext.fileName ?? "暂无简历"} ·{" "}
              {result.resumeContext.targetRole ?? "未设置方向"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              引用了 {result.ragEvidence.length} 条简历原文证据
            </p>
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
