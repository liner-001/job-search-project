import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { ResumeChunkInput } from "./types";

export async function splitResumeText(text: string): Promise<ResumeChunkInput[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 150,
    separators: ["\n\n", "\n", "。", "；", ";", "，", ",", " ", ""],
  });
  const documents = await splitter.createDocuments([text]);

  return documents
    .map((document, chunkIndex) => ({
      content: document.pageContent.trim(),
      chunkIndex,
      metadata: {
        chunkIndex,
        characterCount: document.pageContent.length,
      },
    }))
    .filter((chunk) => chunk.content.length > 0);
}
