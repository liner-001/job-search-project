import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

export const resumeAnalysisSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.object({
    targetRole: nonEmptyText,
    education: nonEmptyText,
    experienceLevel: nonEmptyText,
  }),
  skills: z.array(nonEmptyText).max(50),
  projectHighlights: z.array(nonEmptyText).max(30),
  suggestions: z.array(nonEmptyText).max(30),
});

export const resumeAnalyzeResponseSchema = resumeAnalysisSchema
  .extend({
    id: z.string(),
    fileName: nonEmptyText,
    fileType: nonEmptyText,
    ragIndex: z.object({
      documentId: z.string(),
      chunkCount: z.number().int().nonnegative(),
      embeddingProvider: z.string(),
    }),
  })
  .passthrough();

export const resumeViewSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  score: z.number(),
  targetRole: z.string(),
  education: z.string(),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  projectHighlights: z.array(z.string()),
  suggestions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;
export type ResumeAnalyzeResponse = z.infer<typeof resumeAnalyzeResponseSchema>;
export type ResumeView = z.infer<typeof resumeViewSchema>;
