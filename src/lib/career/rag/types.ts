export interface ResumeChunkInput {
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
}

export interface ResumeRagDocument {
  id: string;
  documentId: string;
  resumeId: string | null;
  title: string;
  content: string;
  chunkIndex: number;
  score: number;
  citation: string;
  tags: string[];
}

export interface ResumeRagResult {
  query: string;
  answer: string;
  retrievedDocs: ResumeRagDocument[];
  embeddingProvider: string;
}

export interface IndexResumeInput {
  resumeId: string;
  fileName: string;
  text: string;
}

export interface IndexResumeResult {
  documentId: string;
  chunkCount: number;
  embeddingProvider: string;
}
