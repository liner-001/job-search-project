"use client";

export default function ApplicationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">投递记录加载失败</h1>
        <p className="mt-2 text-sm text-slate-500">请检查数据库连接，或稍后重新加载。</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          重新加载
        </button>
      </div>
    </main>
  );
}
