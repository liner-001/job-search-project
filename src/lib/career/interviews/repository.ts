import prisma from "@/lib/database/prisma";
import { evaluationDimensionSchema } from "./schema";
import type { InterviewHistoryItem } from "./schema";

function parseDimensions(value: unknown) {
  const parsed = evaluationDimensionSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

function toHistoryItem(record: {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  score: number;
  dimensions: unknown;
  suggestion: string;
  createdAt: Date;
}): InterviewHistoryItem {
  return {
    ...record,
    dimensions: parseDimensions(record.dimensions),
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getRecentInterviewSessions(
  userId: string,
  limit = 10,
): Promise<InterviewHistoryItem[]> {
  const records = await prisma.interviewSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map(toHistoryItem);
}

export async function getInterviewSessionById(
  userId: string,
  id: string,
): Promise<InterviewHistoryItem | null> {
  const record = await prisma.interviewSession.findFirst({ where: { id, userId } });
  return record ? toHistoryItem(record) : null;
}
