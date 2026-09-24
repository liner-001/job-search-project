import prisma from "@/lib/database/prisma";
import { toStringArray } from "@/lib/agent/structured-output";
import type { JDHistoryItem } from "./schema";

function toHistoryItem(record: {
  id: string;
  title: string | null;
  content: string;
  matchScore: number;
  level: string;
  strengths: unknown;
  weaknesses: unknown;
  suggestions: unknown;
  createdAt: Date;
}): JDHistoryItem {
  return {
    ...record,
    strengths: toStringArray(record.strengths),
    weaknesses: toStringArray(record.weaknesses),
    suggestions: toStringArray(record.suggestions),
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getRecentJDMatches(userId: string, limit = 10): Promise<JDHistoryItem[]> {
  const records = await prisma.jobDescription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map(toHistoryItem);
}

export async function getJDMatchById(userId: string, id: string): Promise<JDHistoryItem | null> {
  const record = await prisma.jobDescription.findFirst({ where: { id, userId } });
  return record ? toHistoryItem(record) : null;
}
