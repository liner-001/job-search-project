// 模拟面试模块使用 JudgeAgent 对用户回答进行评分，从技术准确性、
// 结构完整性、项目理解深度和表达清晰度四个维度给出反馈。
"use client";

import { useState } from "react";

interface InterviewQuestion {
    id: string;
    type: string;
    content: string;
}

interface EvaluationDimension {
    name: string;
    score: number;
    comment: string;
}

interface EvaluationResult {
    score: number;
    dimensions: EvaluationDimension[];
    suggestion: string;
}

export const InterviewPanel = () => {
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
    const [answer, setAnswer] = useState("");
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);

    const selectedQuestion = questions.find((item) => item.id === selectedQuestionId);

    const handleGenerateQuestions = async () => {
        setIsGenerating(true);
        setEvaluation(null);
        setAnswer("");

        try {
            const response = await fetch("/api/career/interview/questions", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to generate questions");
            }

            const data = (await response.json()) as { questions: InterviewQuestion[] };
            setQuestions(data.questions);
            setSelectedQuestionId(data.questions[0]?.id ?? "");
        } catch (error) {
            console.error("Failed to generate interview questions:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEvaluateAnswer = async () => {
        if (!selectedQuestion || !answer.trim()) return;

        setIsEvaluating(true);
        setEvaluation(null);

        try {
            const response = await fetch("/api/career/interview/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    questionId: selectedQuestion.id,
                    question: selectedQuestion.content,
                    answer,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to evaluate answer");
            }

            const data = (await response.json()) as EvaluationResult;
            setEvaluation(data);
        } catch (error) {
            console.error("Failed to evaluate answer:", error);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-2xl font-semibold">模拟面试</h2>
                <p className="mt-1 text-sm text-slate-500">
                    根据你的简历项目和目标岗位生成面试问题，并对回答进行评分。
                </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <button
                    type="button"
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {isGenerating ? "生成中..." : "生成面试题"}
                </button>

                {questions.length > 0 && (
                    <div className="mt-5 space-y-3">
                        {questions.map((question) => {
                            const active = selectedQuestionId === question.id;

                            return (
                                <button
                                    key={question.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedQuestionId(question.id);
                                        setAnswer("");
                                        setEvaluation(null);
                                    }}
                                    className={[
                                        "w-full rounded-md border px-4 py-3 text-left text-sm",
                                        active
                                            ? "border-slate-900 bg-slate-50"
                                            : "border-slate-200 bg-white hover:bg-slate-50",
                                    ].join(" ")}
                                >
                                    <div className="mb-1 text-xs text-slate-500">{question.type}</div>
                                    <div>{question.content}</div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedQuestion && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
                    <div className="mb-4 rounded-md bg-slate-50 p-4 text-sm">
                        <span className="font-medium">当前问题：</span>
                        {selectedQuestion.content}
                    </div>

                    <label className="text-sm font-medium text-slate-700">你的回答</label>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="输入你对这道题的回答..."
                        className="mt-3 h-36 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />

                    <button
                        type="button"
                        onClick={handleEvaluateAnswer}
                        disabled={!answer.trim() || isEvaluating}
                        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {isEvaluating ? "评分中..." : "评分"}
                    </button>

                    {evaluation && (
                        <div className="mt-5 rounded-md bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">综合评分</p>
                                <span className="text-xl font-semibold">{evaluation.score} / 100</span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {evaluation.dimensions.map((item) => (
                                    <div key={item.name} className="rounded-md bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <span className="text-sm font-semibold">{item.score}</span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.comment}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                                <span className="font-medium text-slate-900">改进建议：</span>
                                {evaluation.suggestion}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
