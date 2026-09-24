// "use client";

// import { Thread } from "../Thread";

// export const AgentChatPanel = () => {
//   return (
//     <section className="h-[calc(100vh-48px)]">
//       <div className="mb-4">
//         <h2 className="text-2xl font-semibold">智能客服对话</h2>
//         <p className="mt-1 text-sm text-slate-500">
//           和客服 Agent 进行多轮对话，支持问题咨询、工单处理和工具调用。
//         </p>
//       </div>

//       <div className="relative h-[calc(100%-72px)] overflow-hidden rounded-lg border border-slate-200 bg-white">
//         <Thread threadId="customer-service-agent-thread-3" />
//       </div>
//     </section>
//   );
// };

"use client";

import { Thread } from "../Thread";

export const AgentChatPanel = ({ threadId }: { threadId: string }) => {
  return (
    <section className="h-[calc(100vh-48px)]">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">求职 Agent 对话</h2>
        <p className="mt-1 text-sm text-slate-500">
          和 JobPilot AI 进行多轮对话，支持简历优化、JD 匹配、模拟面试、投递规划和八股复习。
        </p>
      </div>

      <div className="relative h-[calc(100%-72px)] overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Thread threadId={threadId} />
      </div>
    </section>
  );
};
