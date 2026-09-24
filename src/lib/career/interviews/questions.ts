import type { InterviewQuestion } from "./schema";

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "architecture",
    type: "项目架构",
    content: "请介绍 JobPilot AI 的整体架构，以及一次请求经过的主要模块。",
  },
  {
    id: "next-server-client",
    type: "Next.js",
    content: "这个项目如何划分 Server Component 和 Client Component？",
  },
  {
    id: "streaming",
    type: "前端工程",
    content: "为什么 Agent 对话使用 SSE，而普通表单操作使用 Server Action？",
  },
  {
    id: "agent-orchestration",
    type: "Agent 编排",
    content: "LangGraph 中 Agent、工具调用和 checkpoint 分别解决什么问题？",
  },
  {
    id: "type-safety",
    type: "TypeScript",
    content: "TypeScript 与 Zod 在项目中分别负责什么，它们为什么需要同时存在？",
  },
];
