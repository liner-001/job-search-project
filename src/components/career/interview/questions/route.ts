
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
    const result = {
        questions: [
            {
                id: "q1",
                type: "项目架构",
                content: "请介绍一下你这个 LangGraph Agent 项目的整体架构。",
            },
            {
                id: "q2",
                type: "前端工程",
                content: "为什么这个项目使用 SSE 实现流式响应，而不是普通 HTTP 请求？",
            },
            {
                id: "q3",
                type: "Agent 编排",
                content: "LangGraph 中 agent、tools、tool_approval 三个节点分别负责什么？",
            },
            {
                id: "q4",
                type: "数据库",
                content: "PostgreSQL checkpointer 在这个项目中解决了什么问题？",
            },
        ],
    };

    return NextResponse.json(result, { status: 200 });
}