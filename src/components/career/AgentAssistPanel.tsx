// 右侧 Agent 辅助面板用于承载上下文记忆和策略建议，让用户在不同功能模块之间切换时仍然能看到统一的求职状态。
// export const AgentAssistPanel = () => {
//     return (
//         <aside className="hidden h-screen w-80 border-l border-slate-200 bg-white px-5 py-5 xl:block">
//             <h2 className="text-sm font-semibold text-slate-900">求职画像</h2>

//             <div className="mt-4 space-y-4">
//                 <div className="rounded-lg bg-slate-50 p-4">
//                     <p className="text-xs text-slate-500">目标岗位</p>
//                     <p className="mt-1 text-sm font-medium">前端 / AI 应用开发</p>
//                 </div>

//                 <div className="rounded-lg bg-slate-50 p-4">
//                     <p className="text-xs text-slate-500">核心技术栈</p>
//                     <p className="mt-1 text-sm leading-6">
//                         React、TypeScript、Next.js、LangGraph.js、PostgreSQL
//                     </p>
//                 </div>

//                 <div className="rounded-lg bg-slate-50 p-4">
//                     <p className="text-xs text-slate-500">当前短板</p>
//                     <ul className="mt-2 space-y-2 text-sm text-slate-600">
//                         <li>项目指标量化不足</li>
//                         <li>Agent 编排讲解不够熟</li>
//                         <li>数据库设计亮点偏少</li>
//                     </ul>
//                 </div>

//                 <div className="rounded-lg bg-slate-900 p-4 text-white">
//                     <p className="text-sm font-medium">下一步建议</p>
//                     <p className="mt-2 text-sm leading-6 text-slate-200">
//                         先完善 JD 匹配和模拟面试两个闭环，这两个模块最容易体现 Agent 项目的业务价值。
//                     </p>
//                 </div>
//             </div>
//         </aside>
//     );
// };






"use client";

import { useEffect, useState } from "react";

// interface AssistData {
//     profile: {
//         targetRole: string;
//         coreStack: string[];
//         currentStage: string;
//     };
//     weaknesses: string[];
//     nextSuggestion: string;
//     recommendedActions: string[];
// }

interface AssistData {
    profile: {
        targetRole: string;
        coreStack: string[];
        currentStage: string;
    };
    weaknesses: string[];
    nextSuggestion: string;
    recommendedActions: string[];
    agentRuntime: {
        intent: string;
        routedAgent: string;
        selectedTools: string[];
        memory: string[];
        monitor: {
            latencyMs: number;
            toolSuccessRate: string;
            resolvedRate: string;
        };
        eval: {
            accuracy: number;
            completeness: number;
            actionability: number;
            safety: number;
        };
    };
}




export const AgentAssistPanel = () => {
    const [data, setData] = useState<AssistData | null>(null);

    useEffect(() => {
        const fetchAssistData = async () => {
            try {
                const response = await fetch("/api/career/assist");

                if (!response.ok) {
                    console.error("Failed to fetch assist data", response.status);
                    return;
                }

                const result = (await response.json()) as AssistData;
                setData(result);
            } catch (error) {
                console.error("Failed to fetch assist data:", error);
            }
        };

        fetchAssistData();
    }, []);

    if (!data) {
        return (
            <aside className="hidden h-screen w-80 border-l border-slate-200 bg-white px-5 py-5 xl:block">
                <h2 className="text-sm font-semibold text-slate-900">求职画像</h2>
                <p className="mt-4 text-sm text-slate-500">正在加载...</p>
            </aside>
        );
    }

    return (
        <aside className="hidden h-screen w-80 border-l border-slate-200 bg-white px-5 py-5 xl:block">
            <h2 className="text-sm font-semibold text-slate-900">求职画像</h2>

            <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">目标岗位</p>
                    <p className="mt-1 text-sm font-medium">{data.profile.targetRole}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">当前阶段</p>
                    <p className="mt-1 text-sm font-medium">{data.profile.currentStage}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">核心技术栈</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {data.profile.coreStack.map((item) => (
                            <span
                                key={item}
                                className="rounded-full bg-white px-2 py-1 text-xs text-slate-700"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">当前短板</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        {data.weaknesses.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-lg bg-slate-900 p-4 text-white">
                    <p className="text-sm font-medium">下一步建议</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                        {data.nextSuggestion}
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">推荐行动</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        {data.recommendedActions.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Agent 运行状态</p>

                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                        <p>
                            意图识别：
                            <span className="font-medium text-slate-900"> {data.agentRuntime.intent}</span>
                        </p>
                        <p>
                            路由 Agent：
                            <span className="font-medium text-slate-900"> {data.agentRuntime.routedAgent}</span>
                        </p>

                        <div>
                            <p className="text-xs text-slate-500">工具调用</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {data.agentRuntime.selectedTools.map((tool) => (
                                    <span
                                        key={tool}
                                        className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                                    >
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">记忆层</p>
                            <p className="mt-1">{data.agentRuntime.memory.join(" / ")}</p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">Monitor</p>
                            <p className="mt-1">
                                响应 {data.agentRuntime.monitor.latencyMs}ms · 工具成功率{" "}
                                {data.agentRuntime.monitor.toolSuccessRate} · 解决率{" "}
                                {data.agentRuntime.monitor.resolvedRate}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">Eval</p>
                            <p className="mt-1">
                                准确性 {data.agentRuntime.eval.accuracy} · 完整性{" "}
                                {data.agentRuntime.eval.completeness} · 可执行性{" "}
                                {data.agentRuntime.eval.actionability} · 安全性{" "}
                                {data.agentRuntime.eval.safety}
                            </p>
                        </div>
                    </div>
                </div>


            </div>
        </aside>
    );
};