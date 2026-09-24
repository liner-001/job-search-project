import { z } from "zod";

export const ragRequestSchema = z.object({
  query: z.string().trim().min(2, "问题至少需要 2 个字符").max(2_000),
  resumeId: z.string().trim().optional(),
});

export const ragSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  chunkIndex: z.number().int().nonnegative(),
  score: z.number(),
  citation: z.string(),
});

export const ragResponseSchema = z
  .object({
    query: z.string(),
    answer: z.string(),
    retrievedDocs: z.array(ragSourceSchema),
    embeddingProvider: z.string(),
  })
  .passthrough();

export type RagResponse = z.infer<typeof ragResponseSchema>;
