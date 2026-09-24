import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-blue-600">JobPilot AI</p>
        <h1 className="mt-2 text-3xl font-bold">登录求职工作台</h1>
        <p className="mt-2 text-sm text-slate-500">你的简历、岗位和面试数据只对当前账户可见。</p>
      </div>
      <AuthForm mode="login" nextPath={next} />
    </div>
  );
}
