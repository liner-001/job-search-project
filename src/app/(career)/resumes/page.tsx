import type { Metadata } from "next";
import Link from "next/link";
import { ResumePanel } from "@/components/career/ResumePanel";
import { getLatestResume, getRecentResumes } from "@/lib/career/resumes/repository";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "简历中心" };
export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const user = await requireUser();
  const [latestResume, resumes] = await Promise.all([
    getLatestResume(user.id),
    getRecentResumes(user.id),
  ]);

  return (
    <div className="space-y-6">
      <ResumePanel latestResume={latestResume} />
      {resumes.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">历史分析</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {resumes.map((resume) => (
              <Link
                key={resume.id}
                href={`/resumes/${resume.id}`}
                className="flex items-center justify-between gap-4 py-3 text-sm hover:text-blue-600"
              >
                <span>
                  <strong>{resume.fileName}</strong>
                  <span className="ml-3 text-slate-500">{resume.targetRole}</span>
                </span>
                <span className="text-slate-500">{resume.score}/100 →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
