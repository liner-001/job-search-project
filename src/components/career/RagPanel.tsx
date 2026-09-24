"use client";

import { type FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { ragRequestSchema, ragResponseSchema, type RagResponse } from "@/lib/career/rag/schema";

export function RagPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RagResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input = ragRequestSchema.safeParse({ query });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? "请输入问题");
      return;
    }
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/career/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "知识库检索失败";
        throw new Error(message);
      }
      const parsed = ragResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("服务器返回的检索数据不完整");
      setResult(parsed.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "知识库检索失败");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section>
      <header>
        <h1 className="text-3xl font-bold">简历知识库</h1>
        <p className="mt-2 text-sm text-slate-500">
          从简历向量索引中检索原文，让回答带有可追溯证据。
        </p>
      </header>
      <form
        onSubmit={submit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label htmlFor="rag-query" className="text-sm font-medium">
          向简历提问
        </label>
        <div className="mt-3 flex gap-3">
          <input
            id="rag-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="例如：我有哪些 Agent 项目经验？"
          />
          <button
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:bg-slate-300"
          >
            <Search className="h-4 w-4" />
            {isLoading ? "检索中…" : "检索"}
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-6 space-y-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex justify-between gap-3">
              <h2 className="font-semibold">回答</h2>
              <span className="text-xs text-slate-500">{result.embeddingProvider}</span>
            </div>
            <p className="mt-4 text-sm leading-7 whitespace-pre-wrap text-slate-700">
              {result.answer}
            </p>
          </article>
          {result.retrievedDocs.map((doc, index) => (
            <article key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between gap-3 text-xs text-slate-500">
                <span>
                  [{index + 1}] {doc.citation}
                </span>
                <span>{Math.round(doc.score * 100)}%</span>
              </div>
              <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-slate-600">
                {doc.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
