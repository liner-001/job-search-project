import { randomUUID } from "node:crypto";
import prisma from "@/lib/database/prisma";
import type { ResumeChunkInput, ResumeRagDocument } from "./types";

const VECTOR_DIMENSION = 1024;
let schemaPromise: Promise<void> | null = null;

function toVectorLiteral(vector: number[]) {
  if (vector.length !== VECTOR_DIMENSION) {
    throw new Error(`Expected ${VECTOR_DIMENSION}-dimension embedding`);
  }
  return `[${vector.join(",")}]`;
}

export async function ensureRagSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS career_resume_documents (
          id TEXT PRIMARY KEY,
          resume_id TEXT,
          file_name TEXT NOT NULL,
          full_text TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS career_resume_chunks (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL REFERENCES career_resume_documents(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          embedding vector(${VECTOR_DIMENSION}) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(document_id, chunk_index)
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS career_resume_chunks_embedding_idx
        ON career_resume_chunks USING hnsw (embedding vector_cosine_ops)
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS career_resume_documents_created_at_idx
        ON career_resume_documents (created_at DESC)
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function saveResumeDocument(params: {
  resumeId: string;
  fileName: string;
  fullText: string;
  chunks: ResumeChunkInput[];
  embeddings: number[][];
}) {
  await ensureRagSchema();
  if (params.chunks.length !== params.embeddings.length) {
    throw new Error("Chunk count and embedding count do not match");
  }

  const documentId = randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `DELETE FROM career_resume_documents WHERE resume_id = $1`,
      params.resumeId,
    );
    await tx.$executeRawUnsafe(
      `INSERT INTO career_resume_documents
       (id, resume_id, file_name, full_text, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      documentId,
      params.resumeId,
      params.fileName,
      params.fullText,
      JSON.stringify({ source: "resume_upload" }),
    );

    for (let index = 0; index < params.chunks.length; index += 1) {
      const chunk = params.chunks[index];
      await tx.$executeRawUnsafe(
        `INSERT INTO career_resume_chunks
         (id, document_id, chunk_index, content, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)`,
        randomUUID(),
        documentId,
        chunk.chunkIndex,
        chunk.content,
        JSON.stringify(chunk.metadata),
        toVectorLiteral(params.embeddings[index]),
      );
    }
  });

  return documentId;
}

interface RetrievedRow {
  id: string;
  document_id: string;
  resume_id: string | null;
  file_name: string;
  content: string;
  chunk_index: number;
  score: number | string;
}

export async function searchResumeChunks(params: {
  embedding: number[];
  limit: number;
  resumeId?: string;
}): Promise<ResumeRagDocument[]> {
  await ensureRagSchema();
  const rows = await prisma.$queryRawUnsafe<RetrievedRow[]>(
    `SELECT
       c.id,
       c.document_id,
       d.resume_id,
       d.file_name,
       c.content,
       c.chunk_index,
       1 - (c.embedding <=> $1::vector) AS score
     FROM career_resume_chunks c
     JOIN career_resume_documents d ON d.id = c.document_id
     WHERE ($2::text IS NOT NULL AND d.resume_id = $2)
        OR ($2::text IS NULL AND d.id = (
          SELECT id FROM career_resume_documents ORDER BY created_at DESC LIMIT 1
        ))
     ORDER BY c.embedding <=> $1::vector
     LIMIT $3`,
    toVectorLiteral(params.embedding),
    params.resumeId ?? null,
    params.limit,
  );

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    resumeId: row.resume_id,
    title: row.file_name,
    content: row.content,
    chunkIndex: row.chunk_index,
    score: Number(Number(row.score).toFixed(4)),
    citation: `${row.file_name}#chunk-${row.chunk_index + 1}`,
    tags: ["resume", `chunk-${row.chunk_index + 1}`],
  }));
}
