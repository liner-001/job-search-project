"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  interviewEvaluationInputSchema,
  interviewEvaluationResponseSchema,
  type InterviewEvaluationResponse,
  type InterviewQuestion,
} from "@/lib/career/interviews/schema";
import { INTERVIEW_QUESTIONS } from "@/lib/career/interviews/questions";

export function InterviewPanel({
  questions = INTERVIEW_QUESTIONS,
}: {
  questions?: InterviewQuestion[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(questions[0]?.id ?? "");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<InterviewEvaluationResponse | null>(null);
  const [error, setError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const selected = questions.find((question) => question.id === selectedId);

  async function evaluate() {
    const input = interviewEvaluationInputSchema.safeParse({
      questionId: selected?.id,
      question: selected?.content,
      answer,
    });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? "请完成回答");
      return;
    }
    setIsEvaluating(true);
    setError("");
    setEvaluation(null);
    try {
      const response = await fetch("/api/career/interview/evaluate", {
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
            : "评分失败";
        throw new Error(message);
      }
      const parsed = interviewEvaluationResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("服务器返回的评分数据不完整");
      setEvaluation(parsed.data);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "评分失败");
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <section>
      <header>
        <h1 className="text-3xl font-bold">模拟面试</h1>
        <p className="mt-2 text-sm text-slate-500">
          选择题目作答，由 AI 按多个维度评分并保存练习记录。
        </p>
      </header>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-3">
          {questions.map((question) => (
            <button
              key={question.id}
              type="button"
              onClick={() => {
                setSelectedId(question.id);
                setAnswer("");
                setEvaluation(null);
                setError("");
              }}
              className={`w-full rounded-xl border p-4 text-left text-sm ${selectedId === question.id ? "border-slate-900 bg-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-400"}`}
            >
              <span className="text-xs text-slate-500">{question.type}</span>
              <span className="mt-1 block">{question.content}</span>
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">当前问题</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{selected?.content}</p>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="mt-4 h-44 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-900"
            placeholder="结合项目背景、方案选择、实现过程和结果回答…"
          />
          <button
            type="button"
            onClick={evaluate}
            disabled={isEvaluating || !selected}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:bg-slate-300"
          >
            {isEvaluating ? "评分中…" : "提交评分"}
          </button>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
      {evaluation && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between">
            <h2 className="font-semibold">评分结果</h2>
            <strong className="text-xl">{evaluation.score}/100</strong>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {evaluation.dimensions.map((item) => (
              <div key={item.name} className="rounded-lg bg-slate-50 p-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>{item.name}</span>
                  <span>{item.score}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.comment}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-slate-700">
            <strong>改进建议：</strong>
            {evaluation.suggestion}
          </p>
        </div>
      )}
    </section>
  );
}
