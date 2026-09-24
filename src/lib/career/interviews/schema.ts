import { z } from "zod";

export const interviewQuestionSchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string().min(1),
});

export const interviewEvaluationInputSchema = z.object({
  questionId: z.string().trim().min(1),
  question: z.string().trim().min(1).max(2_000),
  answer: z.string().trim().min(10, "回答至少需要 10 个字符").max(20_000),
});

export const evaluationDimensionSchema = z.object({
  name: z.string().trim().min(1),
  score: z.number().int().min(0).max(100),
  comment: z.string().trim().min(1),
});

export const interviewEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  dimensions: z.array(evaluationDimensionSchema).min(1).max(8),
  suggestion: z.string().trim().min(1),
});

export const interviewEvaluationResponseSchema = interviewEvaluationSchema
  .extend({ id: z.string() })
  .passthrough();

export interface InterviewHistoryItem {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  score: number;
  dimensions: z.infer<typeof evaluationDimensionSchema>[];
  suggestion: string;
  createdAt: string;
}

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;
export type InterviewEvaluationResponse = z.infer<typeof interviewEvaluationResponseSchema>;
