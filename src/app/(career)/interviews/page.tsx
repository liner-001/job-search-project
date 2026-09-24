import type { Metadata } from "next";
import Link from "next/link";
import { InterviewPanel } from "@/components/career/InterviewPanel";
import { getRecentInterviewSessions } from "@/lib/career/interviews/repository";
import { INTERVIEW_QUESTIONS } from "@/lib/career/interviews/questions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "模拟面试" };
export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const user = await requireUser();
  const sessions = await getRecentInterviewSessions(user.id);
  return (
    <div className="space-y-6">
      <InterviewPanel questions={INTERVIEW_QUESTIONS} />
      {sessions.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">最近练习</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {sessions.map((item) => (
              <Link
                key={item.id}
                href={`/interviews/${item.id}`}
                className="flex items-center justify-between gap-4 py-3 text-sm hover:text-blue-600"
              >
                <span className="line-clamp-1">{item.question}</span>
                <span className="shrink-0 text-slate-500">{item.score}/100 →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
