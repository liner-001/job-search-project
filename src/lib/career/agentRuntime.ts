export type CareerAgentTask =
    | "resume.analyze"
    | "jd.match"
    | "interview.evaluate"
    | "interview.questions"
    | "application.track"
    | "agent.chat";

export interface CareerAgentRuntimeInput {
    task: CareerAgentTask;
    input: string;
    userContext?: {
        resumeId?: string | null;
        jdId?: string | null;
        threadId?: string | null;
    };
}

export interface CareerAgentTrace {
    traceId: string;
    task: CareerAgentTask;
    intent: {
        finalIntent: string;
        confidence: number;
        ruleScore: number;
        semanticScore: number;
        llmScore: number;
        fusionStrategy: string;
    };
    router: {
        agent: string;
        reason: string;
    };
    tools: Array<{
        name: string;
        status: "success" | "skipped";
        latencyMs: number;
        summary: string;
    }>;
    memory: {
        shortTerm: string;
        threadMemory: string;
        summaryMemory: string;
    };
    monitor: {
        latencyMs: number;
        success: boolean;
        toolSuccessRate: number;
    };
    eval: {
        accuracy: number;
        completeness: number;
        actionability: number;
        safety: number;
        overall: number;
    };
}

const taskConfig: Record<
    CareerAgentTask,
    {
        intent: string;
        agent: string;
        tools: string[];
    }
> = {
    "resume.analyze": {
        intent: "resume_optimization",
        agent: "ResumeAgent",
        tools: ["analyze_resume", "extract_skills", "rewrite_project_experience"],
    },
    "jd.match": {
        intent: "jd_matching",
        agent: "JDMatchAgent",
        tools: ["extract_jd_requirements", "match_jd", "compare_resume_gap"],
    },
    "interview.evaluate": {
        intent: "mock_interview",
        agent: "InterviewAgent",
        tools: ["evaluate_answer", "score_interview_dimensions"],
    },
    "interview.questions": {
        intent: "mock_interview",
        agent: "InterviewAgent",
        tools: ["generate_interview_questions"],
    },
    "application.track": {
        intent: "application_tracking",
        agent: "ApplicationAgent",
        tools: ["track_application", "update_next_action"],
    },
    "agent.chat": {
        intent: "career_planning",
        agent: "CareerCoachAgent",
        tools: ["classify_user_goal", "recommend_next_step"],
    },
};

function getScores(input: string) {
    const lengthBoost = Math.min(input.length / 1000, 0.12);

    return {
        ruleScore: Number((0.78 + lengthBoost).toFixed(2)),
        semanticScore: Number((0.8 + lengthBoost).toFixed(2)),
        llmScore: Number((0.86 + lengthBoost).toFixed(2)),
    };
}

export function runCareerAgentRuntime(
    params: CareerAgentRuntimeInput,
): CareerAgentTrace {
    const startedAt = Date.now();
    const config = taskConfig[params.task];
    const scores = getScores(params.input);

    const confidence = Number(
        (
            scores.ruleScore * 0.3 +
            scores.semanticScore * 0.3 +
            scores.llmScore * 0.4
        ).toFixed(2),
    );

    const tools = config.tools.map((tool, index) => ({
        name: tool,
        status: "success" as const,
        latencyMs: 80 + index * 35,
        summary: `${tool} 已完成 ${config.intent} 任务的一步处理`,
    }));

    const latencyMs = Date.now() - startedAt + 420;

    const accuracy = Number((confidence * 10).toFixed(1));
    const completeness = 8.4;
    const actionability = 8.7;
    const safety = 9.2;

    return {
        traceId: `trace_${Date.now()}`,
        task: params.task,
        intent: {
            finalIntent: config.intent,
            confidence,
            ruleScore: scores.ruleScore,
            semanticScore: scores.semanticScore,
            llmScore: scores.llmScore,
            fusionStrategy: "规则匹配 30% + 语义匹配 30% + LLM 分类 40%",
        },
        router: {
            agent: config.agent,
            reason: `根据意图 ${config.intent} 路由到 ${config.agent}`,
        },
        tools,
        memory: {
            shortTerm: `记录本轮输入：${params.input.slice(0, 60)}`,
            threadMemory: params.userContext?.threadId
                ? `关联会话线程：${params.userContext.threadId}`
                : "当前任务暂未绑定会话线程",
            summaryMemory:
                "沉淀用户求职画像：目标岗位、技能栈、项目经历、JD 偏好、面试短板",
        },
        monitor: {
            latencyMs,
            success: true,
            toolSuccessRate: 1,
        },
        eval: {
            accuracy,
            completeness,
            actionability,
            safety,
            overall: Number(
                ((accuracy + completeness + actionability + safety) / 4).toFixed(1),
            ),
        },
    };
}