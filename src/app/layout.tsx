import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "JobPilot AI - 智能求职 Agent 工作台",
    template: "%s | JobPilot AI",
  },
  description: "基于 Next.js 与 LangGraph.js 的智能求职 Agent 工作台。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
