// 我把导航配置抽成 navItems 数组，通过 map 渲染按钮，这样新增功能模块只需要扩展配置项，而不用复制多段 JSX。
"use client";

import {
    BarChart3,
    Bot,
    BriefcaseBusiness,
    ClipboardList,
    FileText,
    MessagesSquare,
    Search,
} from "lucide-react";
import { CareerView } from "./types";
// 左侧导航栏。它接收两个 props：activeView 用来判断哪个按钮高亮。onChangeView 用来通知父组件切换页面。
interface CareerSidebarProps {
    activeView: CareerView;
    onChangeView: (view: CareerView) => void;
}

const navItems: Array<{
    key: CareerView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
        { key: "dashboard", label: "总览", icon: BarChart3 },
        { key: "resume", label: "简历中心", icon: FileText },
        { key: "rag", label: "简历知识库", icon: Search },
        { key: "jd-match", label: "JD 匹配", icon: ClipboardList },
        { key: "interview", label: "模拟面试", icon: MessagesSquare },
        { key: "applications", label: "投递管理", icon: BriefcaseBusiness },
        { key: "agent-chat", label: "Agent 对话", icon: Bot },
    ];

export const CareerSidebar = ({ activeView, onChangeView }: CareerSidebarProps) => {
    return (
        <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5">
                <h1 className="text-lg font-semibold">JobPilot AI</h1>
                <p className="mt-1 text-sm text-slate-500">智能求职 Agent 工作台</p>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeView === item.key;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onChangeView(item.key)}
                            className={[
                                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                active
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            ].join(" ")}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
                Next.js + LangGraph.js
            </div>
        </aside>
    );
};
