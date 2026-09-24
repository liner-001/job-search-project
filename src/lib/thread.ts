// prisma 是数据库客户端。它用来操作 PostgreSQL。
import prisma from "@/lib/database/prisma";

/**
 * Ensure a thread exists; create if missing. Title derived from seed (first 100 chars) or fallback.
 * Returns the Prisma thread record.
 */
// ensureThread 负责确保数据库里有当前会话 thread，如果没有就创建一个。
export async function ensureThread(userId: string, threadId: string, titleSeed?: string) {
  if (!threadId) throw new Error("threadId is required");
  // thread对应数据库里的 Thread 表。
  // Prisma 查询。意思是：去 Thread 表里找 id 等于 threadId 的记录 等价 SQL 大概是：SELECT * FROM "Thread" WHERE id = threadId LIMIT 1;
  const existing = await prisma.thread.findFirst({ where: { id: threadId, userId } });
  if (existing) return existing;
  const title = (titleSeed?.trim() || "New thread").substring(0, 100);
  // 如果数据库没有这个 thread，就创建。
  return prisma.thread.create({ data: { id: threadId, title, userId } });
}
