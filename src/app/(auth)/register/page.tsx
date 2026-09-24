import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "注册" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-blue-600">JobPilot AI</p>
        <h1 className="mt-2 text-3xl font-bold">创建账户</h1>
        <p className="mt-2 text-sm text-slate-500">首个账户会接管升级前已有的本地求职数据。</p>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}
