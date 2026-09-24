import { Prisma } from "@prisma/client";
import prisma from "@/lib/database/prisma";
import { toStringArray } from "@/lib/agent/structured-output";
import type { ResumeView } from "./schema";

const resumeSelection = Prisma.validator<Prisma.ResumeDefaultArgs>()({
  select: {
    id: true,
    fileName: true,
    score: true,
    targetRole: true,
    education: true,
    experienceLevel: true,
    skills: true,
    projectHighlights: true,
    suggestions: true,
    createdAt: true,
    updatedAt: true,
  },
});

type ResumeRecord = Prisma.ResumeGetPayload<typeof resumeSelection>;

function toResumeView(record: ResumeRecord): ResumeView {
  return {
    ...record,
    skills: toStringArray(record.skills),
    projectHighlights: toStringArray(record.projectHighlights),
    suggestions: toStringArray(record.suggestions),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getLatestResume(userId: string): Promise<ResumeView | null> {
  const record = await prisma.resume.findFirst({
    ...resumeSelection,
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return record ? toResumeView(record) : null;
}

export async function getResumeById(userId: string, id: string): Promise<ResumeView | null> {
  const record = await prisma.resume.findFirst({
    ...resumeSelection,
    where: { id, userId },
  });
  return record ? toResumeView(record) : null;
}

export async function getRecentResumes(userId: string, limit = 10): Promise<ResumeView[]> {
  const records = await prisma.resume.findMany({
    ...resumeSelection,
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map(toResumeView);
}
