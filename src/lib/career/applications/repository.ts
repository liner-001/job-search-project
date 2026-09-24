import { Prisma } from "@prisma/client";
import prisma from "@/lib/database/prisma";
import type { ApplicationFilters, CreateApplicationInput } from "./schema";

const applicationWithJobDescription = Prisma.validator<Prisma.JobApplicationDefaultArgs>()({
  include: {
    jobDescription: {
      select: {
        id: true,
        title: true,
        matchScore: true,
        level: true,
      },
    },
  },
});

export type ApplicationListItem = Prisma.JobApplicationGetPayload<
  typeof applicationWithJobDescription
>;

export interface PaginatedApplications {
  items: ApplicationListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function jsonValueToText(value: Prisma.JsonValue | null): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").join("；");
  }
  return JSON.stringify(value);
}

export async function getApplications(
  userId: string,
  filters: ApplicationFilters,
  pageSize = 8,
): Promise<PaginatedApplications> {
  const where: Prisma.JobApplicationWhereInput = {
    userId,
    ...(filters.status !== "全部" && { status: filters.status }),
    ...(filters.query && {
      OR: [
        { company: { contains: filters.query, mode: "insensitive" } },
        { position: { contains: filters.query, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.jobApplication.findMany({
      ...applicationWithJobDescription,
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return {
    items,
    page: filters.page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getApplicationById(userId: string, id: string) {
  return prisma.jobApplication.findFirst({
    ...applicationWithJobDescription,
    where: { id, userId },
  });
}

export async function createApplication(userId: string, input: CreateApplicationInput) {
  const latestJobDescription = input.jobDescriptionId
    ? await prisma.jobDescription.findFirst({
        where: { id: input.jobDescriptionId, userId },
      })
    : await prisma.jobDescription.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

  return prisma.jobApplication.create({
    data: {
      userId,
      company: input.company,
      position: input.position,
      status: input.status,
      matchScore: latestJobDescription?.matchScore ?? input.matchScore,
      nextAction:
        input.nextAction ||
        jsonValueToText(latestJobDescription?.suggestions ?? null) ||
        "完善岗位 JD 分析并准备面试问题",
      jobDescriptionId: latestJobDescription?.id,
    },
  });
}
