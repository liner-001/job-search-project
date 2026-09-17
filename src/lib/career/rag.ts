import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "@/lib/agent/util";
import { splitResumeText } from "./rag/chunker";
import { embedQuery, embedTexts, getEmbeddingProviderName } from "./rag/embeddings";
import { saveResumeDocument, searchResumeChunks } from "./rag/database";
import type {
  IndexResumeInput,
  IndexResumeResult,
  ResumeRagDocument,
  ResumeRagResult,
} from "./rag/types";

export type RagDocument = ResumeRagDocument;
export type RagResult = ResumeRagResult;

function getMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
      return "";
    })
    .join("");
}

export async function indexResumeDocument(
  input: IndexResumeInput,
): Promise<IndexResumeResult> {
  const chunks = await splitResumeText(input.text);
  if (chunks.length === 0) throw new Error("简历文本切块后没有可索引内容");

  const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));
  const documentId = await saveResumeDocument({
    resumeId: input.resumeId,
    fileName: input.fileName,
    fullText: input.text,
    chunks,
    embeddings,
  });

  return {
    documentId,
    chunkCount: chunks.length,
    embeddingProvider: getEmbeddingProviderName(),
  };
}

export async function searchCareerKnowledge(
  query: string,
  limit = 5,
  resumeId?: string,
): Promise<ResumeRagDocument[]> {
  const embedding = await embedQuery(query);
  return searchResumeChunks({ embedding, limit, resumeId });
}

export async function answerWithCareerRag(
  query: string,
  options?: { resumeId?: string; limit?: number },
): Promise<ResumeRagResult> {
  const retrievedDocs = await searchCareerKnowledge(
    query,
    options?.limit ?? 5,
    options?.resumeId,
  );

  if (retrievedDocs.length === 0) {
    return {
      query,
      answer: "当前没有可检索的简历内容，请先在简历中心上传 TXT、PDF 或 DOCX 简历。",
      retrievedDocs,
      embeddingProvider: getEmbeddingProviderName(),
    };
  }

  const context = retrievedDocs
    .map(
      (document, index) =>
        `[${index + 1}] 来源：${document.citation}\n${document.content}`,
    )
    .join("\n\n");
  const llm = createChatModel({
    provider: process.env.RAG_MODEL_PROVIDER || "openai",
    model:
      process.env.RAG_MODEL ||
      process.env.DEFAULT_MODEL ||
      "deepseek-v4-flash",
    temperature: 0.2,
  });
  const response = await llm.invoke([
    new SystemMessage(
      "你是智能求职简历助手。只能根据给定的简历检索片段回答；每个关键结论后必须标注对应引用，如 [1]。如果证据不足，要明确说明，不得编造经历、技能或数据。",
    ),
    new HumanMessage(`用户问题：${query}\n\n简历检索片段：\n${context}`),
  ]);

  return {
    query,
    answer: getMessageText(response.content).trim(),
    retrievedDocs,
    embeddingProvider: getEmbeddingProviderName(),
  };
}
