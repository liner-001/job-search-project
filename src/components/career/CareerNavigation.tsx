"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  MessagesSquare,
  Search,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

const links = [
  { href: "/dashboard", label: "总览", icon: BarChart3 },
  { href: "/resumes", label: "简历中心", icon: FileText },
  { href: "/knowledge", label: "简历知识库", icon: Search },
  { href: "/jd-match", label: "JD 匹配", icon: ClipboardList },
  { href: "/interviews", label: "模拟面试", icon: MessagesSquare },
  { href: "/applications", label: "投递管理", icon: BriefcaseBusiness },
  { href: "/agent-chat", label: "Agent 对话", icon: Bot },
] as const;

export function CareerNavigation({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <Link href="/dashboard" className="text-lg font-semibold">
          JobPilot AI
        </Link>
        <p className="mt-1 text-sm text-slate-500">智能求职 Agent 工作台</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4">
        <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
        <form action={logoutAction}>
          <button className="mt-3 text-xs font-medium text-slate-600 hover:text-slate-950">
            退出登录
          </button>
        </form>
      </div>
    </aside>
  );
}
