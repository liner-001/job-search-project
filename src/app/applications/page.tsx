import type { Metadata } from "next";
import Link from "next/link";
import { CreateApplicationForm } from "@/components/applications/CreateApplicationForm";
import { getApplications, type ApplicationListItem } from "@/lib/career/applications/repository";
import { APPLICATION_STATUSES, applicationFiltersSchema } from "@/lib/career/applications/schema";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "投递管理",
  description: "管理岗位投递状态、JD 匹配结果和下一步行动。",
};

export const dynamic = "force-dynamic";

interface ApplicationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusClassName(status: string) {
  if (status === "Offer") return "bg-emerald-100 text-emerald-700";
  if (status === "已结束") return "bg-slate-200 text-slate-600";
  if (status.includes("面") || status === "笔试") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-blue-100 text-blue-700";
}

function pageHref(page: number, filters: { status: string; query: string }) {
  const params = new URLSearchParams();
  if (filters.status !== "全部") params.set("status", filters.status);
  if (filters.query) params.set("query", filters.query);
  if (page > 1) params.set("page", String(page));
  const queryString = params.toString();
  return queryString ? `/applications?${queryString}` : "/applications";
}

function ApplicationRow({ item }: { item: ApplicationListItem }) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-4">
        <Link
          href={`/applications/${item.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {item.company}
        </Link>
        <p className="mt-1 text-xs text-slate-500">{item.position}</p>
      </td>
      <td className="px-4 py-4">
        <span className={`rounded-full px-2.5 py-1 text-xs ${statusClassName(item.status)}`}>
          {item.status}
        </span>
      </td>
      <td className="px-4 py-4 font-medium text-slate-700">{item.matchScore}%</td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {item.jobDescription
          ? `${item.jobDescription.level} / ${item.jobDescription.matchScore}%`
          : "未关联"}
      </td>
      <td className="max-w-sm px-4 py-4 text-sm text-slate-600">{item.nextAction || "暂无"}</td>
      <td className="px-4 py-4 text-xs whitespace-nowrap text-slate-500">
        {item.createdAt.toLocaleDateString("zh-CN")}
      </td>
    </tr>
  );
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const user = await requireUser();
  const rawSearchParams = await searchParams;
  const filters = applicationFiltersSchema.parse({
    status: firstValue(rawSearchParams.status) ?? "全部",
    query: firstValue(rawSearchParams.query) ?? "",
    page: firstValue(rawSearchParams.page) ?? "1",
  });
  const result = await getApplications(user.id, filters);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
              ← 返回 JobPilot 工作台
            </Link>
            <h1 className="mt-3 text-3xl font-bold">投递管理</h1>
            <p className="mt-2 text-slate-500">
              服务端读取、URL 筛选和类型安全表单的完整 Next.js 数据流。
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            共 <strong>{result.total}</strong> 条投递记录
          </div>
        </header>

        <CreateApplicationForm />

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <form
            method="get"
            className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4"
          >
            <label className="text-sm text-slate-600">
              搜索
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="公司或岗位"
                className="mt-1 block rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
              />
            </label>
            <label className="text-sm text-slate-600">
              状态
              <select
                name="status"
                defaultValue={filters.status}
                className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
              >
                <option value="全部">全部</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
              筛选
            </button>
            <Link
              href="/applications"
              className="px-2 py-2 text-sm text-slate-500 hover:text-slate-900"
            >
              清除
            </Link>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-5xl text-left">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">公司 / 岗位</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">匹配度</th>
                  <th className="px-4 py-3">关联 JD</th>
                  <th className="px-4 py-3">下一步行动</th>
                  <th className="px-4 py-3">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <ApplicationRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>

          {result.items.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              当前筛选条件下没有投递记录。
            </div>
          )}

          {result.totalPages > 1 && (
            <nav
              aria-label="投递记录分页"
              className="flex items-center justify-center gap-2 border-t border-slate-200 px-4 py-4"
            >
              {Array.from({ length: result.totalPages }, (_, index) => {
                const page = index + 1;
                return (
                  <Link
                    key={page}
                    href={pageHref(page, filters)}
                    aria-current={page === result.page ? "page" : undefined}
                    className={
                      page === result.page
                        ? "rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white"
                        : "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                    }
                  >
                    {page}
                  </Link>
                );
              })}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
