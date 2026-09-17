// 智能求职工作台的总入口
// 前端采用工作台式布局，左侧导航控制 activeView 状态，中间区域根据状态动态渲染不同业务模块。
// 这样比多个零散页面更适合 AI Agent 产品，因为用户可以在同一个上下文里完成简历分析、JD 匹配、模拟面试和投递管理。
"use client";

import { useState } from "react";
import { CareerView } from "./types";
import { CareerSidebar } from "./CareerSidebar";
import { DashboardPanel } from "./DashboardPanel";
import { ResumePanel } from "./ResumePanel";
import { RagPanel } from "./RagPanel";
import { JDMatchPanel } from "./JDMatchPanel";
import { InterviewPanel } from "./InterviewPanel";
import { ApplicationPanel } from "./ApplicationPanel";
import { AgentChatPanel } from "./AgentChatPanel";
import { AgentAssistPanel } from "./AgentAssistPanel";

export const CareerWorkspace = () => {
    // 表示当前展示哪个功能模块
    const [activeView, setActiveView] = useState<CareerView>("dashboard");

    const renderMainPanel = () => {
        switch (activeView) {
            case "dashboard":
                return <DashboardPanel />;
            case "resume":
                return <ResumePanel />;
            case "rag":
                return <RagPanel />;
            case "jd-match":
                return <JDMatchPanel />;
            case "interview":
                return <InterviewPanel />;
            case "applications":
                return <ApplicationPanel />;
            case "agent-chat":
                return <AgentChatPanel />;
            default:
                return <DashboardPanel />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900">
            <CareerSidebar activeView={activeView} onChangeView={setActiveView} />

            <main className="min-w-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-6 py-6">
                    {renderMainPanel()}
                </div>
            </main>

            <AgentAssistPanel />
        </div>
    );
};
