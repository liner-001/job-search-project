// // Dashboard 不是简单展示静态页面，而是作为求职过程的数据聚合入口，后续可以接入投递数据、面试评测数据和 Agent 分析结果，形成闭环反馈。
// "use client";

// import { useEffect, useState } from "react";

// interface DashboardStat {
//     label: string;
//     value: string;
//     suffix: string;
// }

// interface DashboardData {
//     stats: DashboardStat[];
//     todos: string[];
//     agentSuggestion: string;
// }

// export const DashboardPanel = () => {
//     const [data, setData] = useState<DashboardData | null>(null);
//     const [isLoading, setIsLoading] = useState(false);

//     useEffect(() => {
//         const fetchDashboard = async () => {
//             setIsLoading(true);

//             try {
//                 const response = await fetch("/api/career/dashboard");

//                 if (!response.ok) {
//                     throw new Error("Failed to fetch dashboard data");
//                 }

//                 const result = (await response.json()) as DashboardData;
//                 setData(result);
//             } catch (error) {
//                 console.error("Failed to fetch dashboard:", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchDashboard();
//     }, []);

//     if (isLoading || !data) {
//         return (
//             <section>
//                 <h2 className="text-2xl font-semibold">求职总览</h2>
//                 <p className="mt-2 text-sm text-slate-500">正在加载总览数据...</p>
//             </section>
//         );
//     }

//     return (
//         <section>
//             <div className="mb-6">
//                 <h2 className="text-2xl font-semibold">求职总览</h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                     汇总你的简历质量、岗位匹配、投递进度和面试训练情况。
//                 </p>
//             </div>

//             <div className="grid grid-cols-4 gap-4">
//                 {data.stats.map((item) => (
//                     <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
//                         <p className="text-sm text-slate-500">{item.label}</p>
//                         <div className="mt-3 flex items-end gap-1">
//                             <span className="text-3xl font-semibold">{item.value}</span>
//                             <span className="mb-1 text-sm text-slate-500">{item.suffix}</span>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             <div className="mt-6 grid grid-cols-2 gap-4">
//                 <div className="rounded-lg border border-slate-200 bg-white p-5">
//                     <h3 className="font-medium">近期待办</h3>
//                     <ul className="mt-4 space-y-3 text-sm text-slate-600">
//                         {data.todos.map((item) => (
//                             <li key={item}>{item}</li>
//                         ))}
//                     </ul>
//                 </div>

//                 <div className="rounded-lg border border-slate-200 bg-white p-5">
//                     <h3 className="font-medium">Agent 建议</h3>
//                     <p className="mt-4 text-sm leading-6 text-slate-600">
//                         {data.agentSuggestion}
//                     </p>
//                 </div>
//             </div>
//         </section>
//     );
// };


"use client";

import { useEffect, useState } from "react";

interface DashboardStat {
    label: string;
    value: string;
    suffix: string;
}

interface DashboardData {
    stats: DashboardStat[];
    todos: string[];
    agentSuggestion: string;
}

const fallbackData: DashboardData = {
    stats: [
        { label: "简历评分", value: "82", suffix: "分" },
        { label: "JD 匹配度", value: "76", suffix: "%" },
        { label: "模拟面试", value: "5", suffix: "次" },
        { label: "投递记录", value: "12", suffix: "个" },
    ],
    todos: [
        "优化项目经历中的 Agent 工程化描述",
        "补充 LangGraph.js 多轮记忆设计说明",
        "针对前端岗位准备 3 道高频八股题",
    ],
    agentSuggestion:
        "建议优先强化项目亮点表达：把 JobPilot AI 讲成一个由意图识别、工具调用、多 Agent 路由、记忆、监控和评测组成的智能求职 Agent 工作台。",
};

const agentCapabilities = [
    {
        title: "端到端意图识别",
        desc: "识别用户是在做简历优化、JD 匹配、模拟面试、投递追踪还是职业规划。",
        detail: "规则匹配 + 语义匹配 + LLM 分类，三路结果加权投票。",
    },
    {
        title: "工具调用框架",
        desc: "把求职动作封装成 Agent 可调用工具。",
        detail:
            "analyze_resume、match_jd、generate_interview_questions、evaluate_answer、track_application。",
    },
    {
        title: "多轮对话记忆",
        desc: "记住用户简历背景、目标岗位、历史 JD、面试短板和投递记录。",
        detail: "基于 LangGraph checkpoint + PostgreSQL，抽象为短期记忆、线程记忆、摘要记忆。",
    },
    {
        title: "多 Agent 路由",
        desc: "根据任务类型分发给不同求职 Agent。",
        detail: "简历 Agent、JD 匹配 Agent、面试 Agent、投递 Agent、职业规划 Agent。",
    },
    {
        title: "Monitor 闭环监控",
        desc: "监控 Agent 的使用效果和稳定性。",
        detail: "简历评分、JD 匹配度、面试准备度、响应时延、工具成功率。",
    },
    {
        title: "端到端评测",
        desc: "对 Agent 输出做离线质量评估。",
        detail: "LLM-as-Judge 四维评分：准确性、完整性、可执行性、安全性。",
    },
];

export const DashboardPanel = () => {
    const [data, setData] = useState<DashboardData>(fallbackData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            setIsLoading(true);

            try {
                const response = await fetch("/api/career/dashboard");

                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }

                const result = (await response.json()) as DashboardData;
                setData(result);
            } catch (error) {
                console.error("Failed to fetch dashboard, use mock data:", error);
                setData(fallbackData);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    return (
        <section>
            <div className="mb-6">
                <p className="text-sm font-medium text-slate-500">
                    JobPilot AI 智能求职 Agent 工作台
                </p>
                <h2 className="mt-1 text-2xl font-semibold">求职总览</h2>
                <p className="mt-1 text-sm text-slate-500">
                    汇总你的简历质量、岗位匹配、投递进度和面试训练情况。
                </p>
            </div>

            {isLoading && (
                <p className="mb-4 text-sm text-slate-500">正在刷新总览数据...</p>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.stats.map((item) => (
                    <div
                        key={item.label}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <div className="mt-3 flex items-end gap-1">
                            <span className="text-3xl font-semibold">{item.value}</span>
                            <span className="mb-1 text-sm text-slate-500">{item.suffix}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="font-medium">近期待办</h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-600">
                        {data.todos.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="font-medium">Agent 建议</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                        {data.agentSuggestion}
                    </p>
                </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4">
                    <h3 className="font-medium">底层 Agent 能力架构</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        这些能力不直接暴露给求职者，而是支撑简历、JD 匹配、模拟面试、投递管理和 Agent 对话。
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {agentCapabilities.map((item) => (
                        <div
                            key={item.title}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                            <h4 className="font-medium text-slate-900">{item.title}</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {item.desc}
                            </p>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                {item.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};