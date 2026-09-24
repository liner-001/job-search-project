import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJDMatchById } from "@/lib/career/jd/repository";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "JD 匹配详情" };
export const dynamic = "force-dynamic";

export default async function JDMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const match = await getJDMatchById(user.id, id);
  if (!match) notFound();
  const groups = [
    ["优势匹配", match.strengths],
    ["能力缺口", match.weaknesses],
    ["优化建议", match.suggestions],
  ] as const;
  return (
    <article>
      <p className="text-sm text-slate-500">JD 匹配详情</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{match.title ?? "岗位分析"}</h1>
        <span className="rounded-full bg-green-100 px-4 py-2 text-sm text-green-700">
          {match.level} · {match.matchScore}%
        </span>
      </div>
      <pre className="mt-6 rounded-xl border border-slate-200 bg-white p-5 font-sans text-sm leading-7 whitespace-pre-wrap text-slate-600">
        {match.content}
      </pre>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {groups.map(([title, items]) => (
          <section key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">{title}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
