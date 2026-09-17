export type JobIntent =
    | "resume_optimization"
    | "jd_match"
    | "mock_interview"
    | "application_tracking"
    | "career_planning";

export type JobAgent =
    | "ResumeAgent"
    | "JDMatchAgent"
    | "InterviewAgent"
    | "ApplicationAgent"
    | "CareerPlanningAgent";

export interface IntentResult {
    intent: JobIntent;
    ruleScore: number;
    semanticScore: number;
    llmScore: number;
    finalScore: number;
}

export interface AgentTrace {
    input: string;
    intent: IntentResult;
    routedAgent: JobAgent;
    selectedTools: string[];
    memory: string[];
    monitor: {
        latencyMs: number;
        toolSuccessRate: number;
        resolved: boolean;
    };
    eval: {
        accuracy: number;
        completeness: number;
        actionability: number;
        safety: number;
    };
}

const intentToAgent: Record<JobIntent, JobAgent> = {
    resume_optimization: "ResumeAgent",
    jd_match: "JDMatchAgent",
    mock_interview: "InterviewAgent",
    application_tracking: "ApplicationAgent",
    career_planning: "CareerPlanningAgent",
};

const intentToTools: Record<JobIntent, string[]> = {
    resume_optimization: ["analyze_resume", "rewrite_project_experience"],
    jd_match: ["match_jd", "extract_job_requirements"],
    mock_interview: ["generate_interview_questions", "evaluate_answer"],
    application_tracking: ["track_application", "update_application_status"],
    career_planning: ["recommend_learning_path", "analyze_skill_gap"],
};

function classifyIntent(input: string): IntentResult {
    const text = input.toLowerCase();

    let intent: JobIntent = "career_planning";

    if (text.includes("简历") || text.includes("resume")) {
        intent = "resume_optimization";
    } else if (text.includes("jd") || text.includes("岗位") || text.includes("匹配")) {
        intent = "jd_match";
    } else if (text.includes("面试") || text.includes("八股") || text.includes("interview")) {
        intent = "mock_interview";
    } else if (text.includes("投递") || text.includes("offer") || text.includes("进度")) {
        intent = "application_tracking";
    }

    const ruleScore = intent === "career_planning" ? 0.55 : 0.85;
    const semanticScore = intent === "career_planning" ? 0.68 : 0.8;
    const llmScore = intent === "career_planning" ? 0.72 : 0.88;

    return {
        intent,
        ruleScore,
        semanticScore,
        llmScore,
        finalScore: ruleScore * 0.3 + semanticScore * 0.3 + llmScore * 0.4,
    };
}

export function runJobPilotAgent(input: string): AgentTrace {
    const intent = classifyIntent(input);
    const routedAgent = intentToAgent[intent.intent];
    const selectedTools = intentToTools[intent.intent];

    return {
        input,
        intent,
        routedAgent,
        selectedTools,
        memory: [
            "短期记忆：记录本轮用户问题",
            "线程记忆：关联当前求职会话上下文",
            "摘要记忆：沉淀用户背景、目标岗位和短板",
        ],
        monitor: {
            latencyMs: 860,
            toolSuccessRate: 0.97,
            resolved: true,
        },
        eval: {
            accuracy: 8.6,
            completeness: 8.2,
            actionability: 8.8,
            safety: 9.1,
        },
    };
}