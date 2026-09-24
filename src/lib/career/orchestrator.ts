import { answerWithCareerRag } from "@/lib/career/rag";
import prisma from "@/lib/database/prisma";

export type CareerIntent =
  | "resume_summary"
  | "jd_match"
  | "interview"
  | "application_plan"
  | "general";

export interface CareerOrchestratorResult {
  answer: string;
  intent: CareerIntent;
  route: string;
  tools: string[];
  trace: string[];
}

export function detectCareerIntent(message: string): CareerIntent {
  const text = message.toLowerCase();

  if (
    text.includes("简历") ||
    text.includes("技能") ||
    text.includes("项目亮点") ||
    text.includes("经历") ||
    text.includes("resume")
  ) {
    return "resume_summary";
  }

  if (
    text.includes("jd") ||
    text.includes("岗位") ||
    text.includes("匹配") ||
    text.includes("招聘要求")
  ) {
    return "jd_match";
  }

  if (
    text.includes("面试") ||
    text.includes("八股") ||
    text.includes("模拟") ||
    text.includes("追问")
  ) {
    return "interview";
  }

  if (
    text.includes("投递") ||
    text.includes("求职") ||
    text.includes("规划") ||
    text.includes("公司")
  ) {
    return "application_plan";
  }

  return "general";
}

export function shouldUseCareerOrchestrator(message: string) {
  return detectCareerIntent(message) !== "general";
}

async function answerForUser(userId: string, query: string) {
  const resume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!resume) {
    return {
      query,
      answer: "当前没有可检索的简历内容，请先在简历中心上传简历。",
      retrievedDocs: [],
      embeddingProvider: "none",
    };
  }
  return answerWithCareerRag(query, { resumeId: resume.id });
}

function formatSourceList(result: Awaited<ReturnType<typeof answerWithCareerRag>>) {
  if (result.retrievedDocs.length === 0) {
    return "没有检索到相关简历片段，请先在简历中心上传简历。";
  }

  return result.retrievedDocs
    .map((doc, index) => `${index + 1}. ${doc.title}，相似度：${doc.score.toFixed(3)}`)
    .join("\n");
}

function formatTrace(result: CareerOrchestratorResult) {
  return [
    "",
    "---",
    "### Agent 执行链路",
    `1. 意图识别：${result.intent}`,
    `2. 路由节点：${result.route}`,
    `3. 调用工具：${result.tools.length > 0 ? result.tools.join("、") : "无"}`,
    ...result.trace.map((item, index) => `${index + 4}. ${item}`),
  ].join("\n");
}

export async function runCareerOrchestrator(
  message: string,
  userId: string,
): Promise<CareerOrchestratorResult> {
  const intent = detectCareerIntent(message);

  if (intent === "resume_summary") {
    const ragResult = await answerForUser(userId, message);

    return {
      answer: [ragResult.answer, "", "### RAG 检索来源", formatSourceList(ragResult)].join("\n"),
      intent,
      route: "ResumeRagAgent",
      tools: ["search_resume_knowledge"],
      trace: [
        "将用户问题转成简历检索 query",
        "从 PostgreSQL + pgvector 检索 Top-K 简历片段",
        "把检索片段作为上下文交给 LLM 生成带依据的回答",
      ],
    };
  }

  if (intent === "jd_match") {
    const ragResult = await answerForUser(
      userId,
      `请从我的简历中提取与这个岗位/JD匹配相关的技能、项目和经历：${message}`,
    );

    return {
      answer: [
        "我识别到这是 JD/岗位匹配任务。当前先基于你的简历知识库提取匹配证据；完整 JD 打分可以继续接 /api/career/jd/match。",
        "",
        ragResult.answer,
        "",
        "### RAG 检索来源",
        formatSourceList(ragResult),
      ].join("\n"),
      intent,
      route: "JDMatchAgent",
      tools: ["search_resume_knowledge", "get_latest_jd_analysis"],
      trace: [
        "识别用户正在询问岗位匹配",
        "先检索简历中和岗位要求相关的证据",
        "后续可把 JD 文本和简历证据合并计算匹配分",
      ],
    };
  }

  if (intent === "interview") {
    const ragResult = await answerForUser(
      userId,
      `根据我的简历项目和技能，生成模拟面试问题：${message}`,
    );

    return {
      answer: [ragResult.answer, "", "### RAG 检索来源", formatSourceList(ragResult)].join("\n"),
      intent,
      route: "InterviewAgent",
      tools: ["search_resume_knowledge"],
      trace: [
        "识别用户正在请求模拟面试",
        "检索简历项目经历作为出题依据",
        "后续可接入 LLM-as-Judge 对回答打分",
      ],
    };
  }

  if (intent === "application_plan") {
    const ragResult = await answerForUser(
      userId,
      `根据我的简历，给出投递规划和岗位方向建议：${message}`,
    );

    return {
      answer: [ragResult.answer, "", "### RAG 检索来源", formatSourceList(ragResult)].join("\n"),
      intent,
      route: "ApplicationPlannerAgent",
      tools: ["search_resume_knowledge"],
      trace: [
        "识别用户正在请求投递规划",
        "检索简历中的技能、项目和经历",
        "生成岗位方向、补强项和下一步行动",
      ],
    };
  }

  return {
    answer: "",
    intent,
    route: "GeneralChatAgent",
    tools: [],
    trace: ["未命中特定求职任务，走原始 Agent 对话"],
  };
}

export function formatCareerOrchestratorResult(result: CareerOrchestratorResult) {
  return result.answer + formatTrace(result);
}
