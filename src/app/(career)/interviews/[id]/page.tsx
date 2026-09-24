import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInterviewSessionById } from "@/lib/career/interviews/repository";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "面试练习详情" };
export const dynamic = "force-dynamic";

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const session = await getInterviewSessionById(user.id, id);
  if (!session) notFound();
  return (
    <article>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">面试练习详情</h1>
        <span className="rounded-full bg-violet-100 px-4 py-2 text-sm text-violet-700">
          {session.score}/100
        </span>
      </div>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">问题</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{session.question}</p>
      </section>
      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">回答</h2>
        <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-slate-600">
          {session.answer}
        </p>
      </section>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {session.dimensions.map((item) => (
          <section key={item.name} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex justify-between">
              <h2 className="font-semibold">{item.name}</h2>
              <strong>{item.score}</strong>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.comment}</p>
          </section>
        ))}
      </div>
      <section className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-semibold">改进建议</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">{session.suggestion}</p>
      </section>
    </article>
  );
}
