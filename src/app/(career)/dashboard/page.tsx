import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardData } from "@/lib/career/dashboard/query";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "求职总览",
  description: "汇总简历、JD 匹配、投递和模拟面试数据。",
};
export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/resumes", label: "分析简历", description: "解析简历并建立知识库" },
  { href: "/jd-match", label: "匹配 JD", description: "结合简历评估岗位匹配度" },
  { href: "/interviews", label: "模拟面试", description: "练习回答并获得结构化评分" },
] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return (
    <section>
      <header>
        <p className="text-sm font-medium text-slate-500">JobPilot AI</p>
        <h1 className="mt-1 text-3xl font-bold">求职总览</h1>
        <p className="mt-2 text-sm text-slate-500">
          数据由 PostgreSQL 并行聚合，页面在服务端完成渲染。
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <div className="mt-3 flex items-end gap-1">
              <strong className="text-3xl">{item.value}</strong>
              <span className="mb-1 text-sm text-slate-500">{item.suffix}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">下一步行动</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {data.todos.map((todo) => (
              <li key={todo} className="flex gap-2">
                <span aria-hidden>•</span>
                {todo}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Agent 建议</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{data.agentSuggestion}</p>
        </article>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <h2 className="font-semibold">{item.label} →</h2>
            <p className="mt-2 text-sm text-slate-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
