import type { Metadata } from "next";
import Link from "next/link";
import { JDMatchPanel } from "@/components/career/JDMatchPanel";
import { getRecentJDMatches } from "@/lib/career/jd/repository";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "JD 匹配" };
export const dynamic = "force-dynamic";

export default async function JDMatchPage() {
  const user = await requireUser();
  const history = await getRecentJDMatches(user.id);
  return (
    <div className="space-y-6">
      <JDMatchPanel />
      {history.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">最近分析</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/jd-match/${item.id}`}
                className="flex items-center justify-between gap-4 py-3 text-sm hover:text-blue-600"
              >
                <span className="line-clamp-1">{item.title ?? item.content.slice(0, 50)}</span>
                <span className="shrink-0 text-slate-500">
                  {item.level} · {item.matchScore}% →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
