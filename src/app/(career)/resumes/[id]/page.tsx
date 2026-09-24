import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getResumeById } from "@/lib/career/resumes/repository";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "简历分析详情" };
export const dynamic = "force-dynamic";

export default async function ResumeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await getResumeById(user.id, id);
  if (!resume) notFound();

  const groups = [
    ["技能栈", resume.skills],
    ["项目亮点", resume.projectHighlights],
    ["优化建议", resume.suggestions],
  ] as const;

  return (
    <article>
      <p className="text-sm text-slate-500">简历分析详情</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{resume.fileName}</h1>
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm text-blue-700">
          {resume.score}/100
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["目标方向", resume.targetRole],
          ["教育背景", resume.education],
          ["经验阶段", resume.experienceLevel],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 font-medium">{value}</p>
          </div>
        ))}
      </div>
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
