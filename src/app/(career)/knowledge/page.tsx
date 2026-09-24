import type { Metadata } from "next";
import { RagPanel } from "@/components/career/RagPanel";

export const metadata: Metadata = { title: "简历知识库" };
export default function KnowledgePage() {
  return <RagPanel />;
}
