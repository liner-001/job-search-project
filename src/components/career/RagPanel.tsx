"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

interface RagSource {
  id: string;
  title: string;
  content: string;
  chunkIndex: number;
  score: number;
  citation: string;
}

interface RagResponse {
  query: string;
  answer: string;
  retrievedDocs: RagSource[];
  embeddingProvider: string;
}

export const RagPanel = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RagResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/career/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const payload = (await response.json()) as RagResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "RAG 检索失败");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "RAG 检索失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">简历知识库</h2>
        <p className="mt-1 text-sm text-slate-500">
          基于最近上传的简历进行向量检索，回答会标注对应原文片段。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border-slate-200 bg-white p-5">
        <label htmlFor="rag-query" className="text-sm font-medium text-slate-700">
          向简历提问
        </label>
        <div className="mt-3 flex gap-3">
          <input
            id="rag-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：我有哪些 Agent 项目经验？请给出原文依据"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Search className="h-4 w-4" />
            {isLoading ? "检索中..." : "开始检索"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-5">
          <div className="border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-medium">Agent 回答</h3>
              <span className="text-xs text-slate-500">
                Embedding：{result.embeddingProvider}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {result.answer}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700">
              检索来源（{result.retrievedDocs.length}）
            </h3>
            <div className="mt-3 grid gap-3">
              {result.retrievedDocs.map((document, index) => (
                <article key={document.id} className="border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>[{index + 1}] {document.citation}</span>
                    <span>相似度 {Math.round(document.score * 100)}%</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {document.content}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
