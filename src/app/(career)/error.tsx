"use client";

export default function CareerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold">页面加载失败</h1>
      <p className="mt-2 text-sm text-slate-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
      >
        重新加载
      </button>
    </section>
  );
}
