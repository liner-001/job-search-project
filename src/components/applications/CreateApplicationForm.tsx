"use client";

import { useActionState, useEffect, useRef } from "react";
import { createApplicationAction } from "@/app/applications/actions";
import {
  APPLICATION_STATUSES,
  type ApplicationActionState,
} from "@/lib/career/applications/schema";

const initialState: ApplicationActionState = { status: "idle" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{messages[0]}</p>;
}

export function CreateApplicationForm() {
  const [state, formAction, isPending] = useActionState(createApplicationAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">新增投递记录</h2>
        <p className="mt-1 text-sm text-slate-500">
          表单会在服务端再次校验，并自动关联最近一次 JD 分析。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-slate-700">
          公司
          <input
            name="company"
            placeholder="例如：字节跳动"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
          <FieldError
            messages={state.status === "error" ? state.fieldErrors?.company : undefined}
          />
        </label>

        <label className="text-sm text-slate-700">
          岗位
          <input
            name="position"
            placeholder="例如：前端开发工程师"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
          <FieldError
            messages={state.status === "error" ? state.fieldErrors?.position : undefined}
          />
        </label>

        <label className="text-sm text-slate-700">
          状态
          <select
            name="status"
            defaultValue="待投递"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          匹配度
          <input
            name="matchScore"
            type="number"
            min={0}
            max={100}
            defaultValue={75}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
          <FieldError
            messages={state.status === "error" ? state.fieldErrors?.matchScore : undefined}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm text-slate-700">
        下一步行动
        <input
          name="nextAction"
          placeholder="留空时使用最近一次 JD 分析建议"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
        />
        <FieldError
          messages={state.status === "error" ? state.fieldErrors?.nextAction : undefined}
        />
      </label>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p
          aria-live="polite"
          className={state.status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-600"}
        >
          {state.status === "idle" ? "" : state.message}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "保存中..." : "添加投递"}
        </button>
      </div>
    </form>
  );
}
