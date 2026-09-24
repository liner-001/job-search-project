import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplicationById } from "@/lib/career/applications/repository";
import { requireUser } from "@/lib/auth/session";

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ApplicationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const application = await getApplicationById(user.id, id);

  return {
    title: application ? `${application.company} · ${application.position}` : "投递记录不存在",
  };
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const application = await getApplicationById(user.id, id);

  if (!application) notFound();

  const fields = [
    ["当前状态", application.status],
    ["岗位匹配度", `${application.matchScore}%`],
    [
      "关联 JD",
      application.jobDescription
        ? `${application.jobDescription.title || "未命名 JD"} · ${application.jobDescription.level}`
        : "未关联",
    ],
    ["下一步行动", application.nextAction || "暂无"],
    ["创建时间", application.createdAt.toLocaleString("zh-CN")],
    ["最近更新", application.updatedAt.toLocaleString("zh-CN")],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/applications" className="text-sm text-slate-500 hover:text-slate-900">
          ← 返回投递列表
        </Link>
        <p className="mt-8 text-sm font-medium text-slate-500">{application.company}</p>
        <h1 className="mt-2 text-3xl font-bold">{application.position}</h1>

        <dl className="mt-8 divide-y divide-slate-100 border-y border-slate-100">
          {fields.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="text-sm font-medium text-slate-500">{label}</dt>
              <dd className="text-sm text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </main>
  );
}
