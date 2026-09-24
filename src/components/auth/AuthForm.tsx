"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/(auth)/actions";
import type { AuthActionState } from "@/lib/auth/schema";

const initialState: AuthActionState = { status: "idle" };

export function AuthForm({ mode, nextPath }: { mode: "login" | "register"; nextPath?: string }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"
    >
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      {!isLogin && (
        <label className="block text-sm font-medium text-slate-700">
          名称
          <input
            name="name"
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
          />
          {state.fieldErrors?.name?.[0] && (
            <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.name[0]}</span>
          )}
        </label>
      )}
      <label className="block text-sm font-medium text-slate-700">
        邮箱
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
        />
        {state.fieldErrors?.email?.[0] && (
          <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.email[0]}</span>
        )}
      </label>
      <label className="block text-sm font-medium text-slate-700">
        密码
        <input
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
        />
        {state.fieldErrors?.password?.[0] && (
          <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.password[0]}</span>
        )}
      </label>
      {state.message && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:bg-slate-400"
      >
        {pending ? "处理中…" : isLogin ? "登录" : "创建账户"}
      </button>
      <p className="text-center text-sm text-slate-500">
        {isLogin ? "还没有账户？" : "已经有账户？"}{" "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-slate-900 hover:underline"
        >
          {isLogin ? "注册" : "登录"}
        </Link>
      </p>
    </form>
  );
}
