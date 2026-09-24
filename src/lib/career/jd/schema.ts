import { z } from "zod";

export const jdMatchInputSchema = z.object({
  jdText: z
    .string()
    .trim()
    .min(20, "岗位描述至少需要 20 个字符")
    .max(20_000, "岗位描述不能超过 20000 个字符"),
});

export const jdLevelSchema = z.enum(["强烈推荐投递", "推荐投递", "谨慎投递", "暂不推荐"]);

export const jdAnalysisSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  level: jdLevelSchema,
  strengths: z.array(z.string().trim().min(1)).max(20),
  weaknesses: z.array(z.string().trim().min(1)).max(20),
  suggestions: z.array(z.string().trim().min(1)).max(20),
});

export const jdMatchResponseSchema = jdAnalysisSchema
  .extend({
    id: z.string(),
    resumeContext: z.object({
      fileName: z.string().nullable(),
      targetRole: z.string().nullable(),
      skills: z.array(z.string()),
    }),
    ragEvidence: z.array(
      z.object({
        index: z.number(),
        title: z.string(),
        citation: z.string(),
        score: z.number(),
        content: z.string(),
      }),
    ),
  })
  .passthrough();

export interface JDHistoryItem {
  id: string;
  title: string | null;
  content: string;
  matchScore: number;
  level: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  createdAt: string;
}

export type JDMatchInput = z.infer<typeof jdMatchInputSchema>;
export type JDAnalysis = z.infer<typeof jdAnalysisSchema>;
export type JDMatchResponse = z.infer<typeof jdMatchResponseSchema>;
