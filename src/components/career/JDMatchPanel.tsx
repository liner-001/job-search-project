// JD 匹配模块将岗位描述作为任务输入，Agent 先提取岗位要求，再结合用户简历做匹配分析，
// 输出匹配分数、优势项、缺失项和简历优化建议。
// "use client";

// import { useState } from "react";

// interface JDMatchResult {
//     matchScore: number;
//     level: string;
//     strengths: string[];
//     weaknesses: string[];
//     suggestions: string[];
// }

// export const JDMatchPanel = () => {
//     const [jdText, setJdText] = useState("");
//     const [result, setResult] = useState<JDMatchResult | null>(null);
//     const [isLoading, setIsLoading] = useState(false);

//     const handleMatch = async () => {
//         if (!jdText.trim()) return;

//         setIsLoading(true);
//         setResult(null);

//         try {
//             const response = await fetch("/api/career/jd/match", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     jdText,
//                 }),
//             });

//             if (!response.ok) {
//                 throw new Error("JD match request failed");
//             }

//             const data = (await response.json()) as JDMatchResult;
//             setResult(data);
//         } catch (error) {
//             console.error("Failed to match JD:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <section>
//             <div className="mb-6">
//                 <h2 className="text-2xl font-semibold">JD 匹配</h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                     粘贴岗位 JD，Agent 会分析岗位要求并和你的简历进行匹配。
//                 </p>
//             </div>

//             <div className="rounded-lg border border-slate-200 bg-white p-5">
//                 <label className="text-sm font-medium text-slate-700">岗位 JD</label>
//                 <textarea
//                     value={jdText}
//                     onChange={(e) => setJdText(e.target.value)}
//                     placeholder="粘贴招聘 JD，例如：岗位职责、任职要求、技术栈要求..."
//                     className="mt-3 h-48 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
//                 />

//                 <button
//                     type="button"
//                     onClick={handleMatch}
//                     disabled={!jdText.trim() || isLoading}
//                     className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
//                 >
//                     {isLoading ? "分析中..." : "开始匹配"}
//                 </button>
//             </div>

//             {result && (
//                 <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
//                     <div className="flex items-center justify-between">
//                         <h3 className="font-medium">匹配分析结果</h3>
//                         <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
//                             {result.level} · 匹配度 {result.matchScore}%
//                         </span>
//                     </div>

//                     <div className="mt-5 grid grid-cols-3 gap-4">
//                         <div>
//                             <h4 className="text-sm font-medium">优势匹配</h4>
//                             <ul className="mt-3 space-y-2 text-sm text-slate-600">
//                                 {result.strengths.map((item) => (
//                                     <li key={item}>{item}</li>
//                                 ))}
//                             </ul>
//                         </div>

//                         <div>
//                             <h4 className="text-sm font-medium">需要补强</h4>
//                             <ul className="mt-3 space-y-2 text-sm text-slate-600">
//                                 {result.weaknesses.map((item) => (
//                                     <li key={item}>{item}</li>
//                                 ))}
//                             </ul>
//                         </div>

//                         <div>
//                             <h4 className="text-sm font-medium">优化建议</h4>
//                             <ul className="mt-3 space-y-2 text-sm text-slate-600">
//                                 {result.suggestions.map((item) => (
//                                     <li key={item}>{item}</li>
//                                 ))}
//                             </ul>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </section>
//     );
// };




// JD 匹配模块将岗位描述作为任务输入，Agent 先提取岗位要求，再结合用户简历做匹配分析，
// 输出匹配分数、优势项、缺失项和简历优化建议。
"use client";

import { useEffect, useState } from "react";

interface JDMatchResult {
    id: string;
    matchScore: number;
    level: string;
    resumeContext: {
        fileName: string | null;
        targetRole: string | null;
        skills: string[];
    };
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
}

interface JDHistoryRecord {
    id: string;
    title: string | null;
    content: string;
    matchScore: number;
    level: string;
    createdAt: string;
}

export const JDMatchPanel = () => {
    const [jdText, setJdText] = useState("");
    const [result, setResult] = useState<JDMatchResult | null>(null);
    const [history, setHistory] = useState<JDHistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = async () => {
        try {
            const response = await fetch("/api/career/jd/history");

            if (!response.ok) {
                console.error("Failed to fetch JD history", response.status);
                return;
            }

            const data = (await response.json()) as { records: JDHistoryRecord[] };
            setHistory(data.records);
        } catch (error) {
            console.error("Failed to fetch JD history:", error);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleMatch = async () => {
        if (!jdText.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch("/api/career/jd/match", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jdText,
                }),
            });

            if (!response.ok) {
                throw new Error("JD match request failed");
            }

            const data = (await response.json()) as JDMatchResult;
            setResult(data);
            fetchHistory();
        } catch (error) {
            console.error("Failed to match JD:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-2xl font-semibold">JD 匹配</h2>
                <p className="mt-1 text-sm text-slate-500">
                    粘贴岗位 JD，Agent 会分析岗位要求并和你的简历进行匹配。
                </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
                <label className="text-sm font-medium text-slate-700">岗位 JD</label>
                <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="粘贴招聘 JD，例如：岗位职责、任职要求、技术栈要求..."
                    className="mt-3 h-48 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />

                <button
                    type="button"
                    onClick={handleMatch}
                    disabled={!jdText.trim() || isLoading}
                    className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {isLoading ? "分析中..." : "开始匹配"}
                </button>
            </div>

            {result && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">匹配分析结果</h3>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                            {result.level} · 匹配度 {result.matchScore}%
                        </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                        分析记录 ID：{result.id}
                    </p>

                    <div className="mt-4 rounded-md bg-slate-50 p-4">
                        <p className="text-sm font-medium">匹配所用简历</p>
                        <p className="mt-2 text-sm text-slate-600">
                            文件：{result.resumeContext.fileName || "未上传简历"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            目标方向：{result.resumeContext.targetRole || "暂无"}
                        </p>

                        {result.resumeContext.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {result.resumeContext.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-full bg-white px-3 py-1 text-xs text-slate-700"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>


                    <div className="mt-5 grid grid-cols-3 gap-4">
                        <div>
                            <h4 className="text-sm font-medium">优势匹配</h4>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                {result.strengths.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium">需要补强</h4>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                {result.weaknesses.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
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

            {history.length > 0 && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="font-medium">最近 JD 分析记录</h3>

                    <div className="mt-4 space-y-3">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-md border border-slate-100 bg-slate-50 p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        {item.title || item.content.slice(0, 40)}
                                    </p>
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                                        {item.level} · {item.matchScore}%
                                    </span>
                                </div>

                                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                    {item.content}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                    {new Date(item.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};