import prisma from "@/lib/database/prisma";

export interface DashboardStat {
  label: string;
  value: string;
  suffix: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  todos: string[];
  agentSuggestion: string;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [latestResume, jdAggregate, applicationCount, interviewCount] = await Promise.all([
    prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { score: true, targetRole: true },
    }),
    prisma.jobDescription.aggregate({
      where: { userId },
      _avg: { matchScore: true },
    }),
    prisma.jobApplication.count({ where: { userId } }),
    prisma.interviewSession.count({ where: { userId } }),
  ]);

  const averageMatchScore = jdAggregate._avg.matchScore;
  const todos: string[] = [];

  if (!latestResume) {
    todos.push("上传第一份简历，建立 JD 匹配和面试训练上下文");
  } else if (latestResume.score < 80) {
    todos.push("根据简历分析建议补充项目成果和量化指标");
  }
  if (applicationCount === 0) {
    todos.push("添加第一条目标岗位投递记录");
  }
  if (interviewCount < 3) {
    todos.push("完成至少 3 次模拟面试，建立能力基线");
  }
  if (todos.length === 0) {
    todos.push("复盘最近一次面试，并更新下一步求职行动");
  }

  return {
    stats: [
      {
        label: "简历评分",
        value: latestResume ? String(latestResume.score) : "--",
        suffix: latestResume ? "/100" : "",
      },
      {
        label: "JD 匹配均分",
        value: averageMatchScore == null ? "--" : String(Math.round(averageMatchScore)),
        suffix: averageMatchScore == null ? "" : "%",
      },
      {
        label: "投递岗位",
        value: String(applicationCount),
        suffix: "个",
      },
      {
        label: "模拟面试",
        value: String(interviewCount),
        suffix: "次",
      },
    ],
    todos,
    agentSuggestion: latestResume
      ? `当前目标方向是${latestResume.targetRole}，简历评分为 ${latestResume.score}/100。建议结合最新 JD 匹配结果安排下一轮简历优化和面试训练。`
      : "当前还没有简历数据。先上传简历，后续 JD 匹配、RAG 检索和模拟面试才能获得可靠上下文。",
  };
}
