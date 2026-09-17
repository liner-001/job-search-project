// 这是 Next.js App Router 的标记 这个组件必须在浏览器端运行
"use client";
import { MessageInput } from "./MessageInput";
// MessageList.tsx 导出 export default MessageList;
// / 默认导出
// export default MessageList;
// import MessageList from "./MessageList";默认导出甚至可以改名字导入：import AAA from "./MessageList";
// // 命名导出
// export const MessageInput = ...
// import { MessageInput } from "./MessageInput";
import MessageList from "./MessageList";
// 通常在 Next.js / TypeScript 项目里，@ 被配置成指向src
import { useChatThread } from "@/hooks/useChatThread";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { MessageOptions } from "@/types/message";
// Props 类型 组件接收两个 props
interface ThreadProps {
  threadId: string;
  // Thread 组件可以接收一个 onFirstMessageSent 函数。这个函数可传可不传。如果传了，它接收一个 string 类型的 threadId，不返回任何值。
  onFirstMessageSent?: (threadId: string) => void;
}

// export const Thread = (props: ThreadProps) => {
//   const threadId = props.threadId;
//   const onFirstMessageSent = props.onFirstMessageSent;
// };
// export const Thread = (props: ThreadProps) => {
//   const { threadId, onFirstMessageSent } = props;
// };
// 定义 Thread 组件。它接收一个 props 对象。这个 props 对象类型是 ThreadProps。然后从 props 里取出 threadId 和 onFirstMessageSent。
export const Thread = ({ threadId, onFirstMessageSent }: ThreadProps) => {
  // Thread 自己不直接写请求后端的逻辑，而是调用一个自定义 Hook  useChatThread({ threadId })
  const { messages, isLoadingHistory, isSending, sendMessage, approveToolExecution } =
    // 一个自定义 React Hook  给我当前 threadId 对应的聊天状态和操作函数。
    useChatThread({ threadId });
  // 创建一个 ref，初始值是 false 当前是否已经发起过第一条消息
  const firstMessageInitiatedRef = useRef(false);
  // 保存状态：是否正在等待新会话的第一条 AI 回复
  const [awaitingFirstResponse, setAwaitingFirstResponse] = useState(false);
  // Thread 传给 MessageInput 的函数
  const handleSendMessage = async (message: string, opts?: MessageOptions) => {
    // 判断当前会话是不是空会话 如果还没有任何消息，说明这是这个 thread 的第一条消息
    const wasEmpty = messages.length === 0;
    // 调用 useChatThread 返回的 sendMessage
    await sendMessage(message, opts);
    if (wasEmpty) {
      // 我正在等待这个新会话的第一条 AI 回复
      firstMessageInitiatedRef.current = true;
      setAwaitingFirstResponse(true);
    }
  };
  // 检测第一条 AI 回复是否来了
  // 组件首次渲染后执行 依赖数组里任意值变化后执行
  // Detect first AI/tool/error message arrival after initial user message to trigger redirect
  useEffect(() => {
    // 如果正在等待第一条回复，并且当前已经不在发送中
    if (awaitingFirstResponse && !isSending) {
      // 检查消息列表里有没有非 human 消息； human：用户消息 ；非 human：AI 消息、工具消息、错误消息等
      // 数组里只要有一个满足条件，就返回 true
      // 所以这行意思是：消息列表里是否已经出现 AI/tool/error 之类的回复
      const hasNonHuman = messages.some((m) => m.type !== "human");

      if (hasNonHuman) {
        // 不再等待
        setAwaitingFirstResponse(false);
        // 如果父组件传了 onFirstMessageSent，就调用它
        if (onFirstMessageSent) onFirstMessageSent(threadId);
      }
    }
  }, [awaitingFirstResponse, isSending, messages, onFirstMessageSent, threadId]);

  if (isLoadingHistory) {
    return (
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 absolute inset-0 flex items-center justify-center backdrop-blur">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-2">Loading conversation history...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {messages.length > 0 ? (
        <>

          <div className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-4 px-4 py-4">
                {/* 有消息时：显示 MessageList */}
                <MessageList messages={messages} approveToolExecution={approveToolExecution} />
              </div>
            </ScrollArea>
          </div>

          <div className="flex-shrink-0">
            <div className="w-full p-4 pb-6">
              <div className="mx-auto max-w-3xl">
                {/* 有消息时：底部输入框 */}
                <MessageInput onSendMessage={handleSendMessage} isLoading={isSending} />
              </div>
            </div>
          </div>

        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-3xl px-4">
            <div className="mb-5 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Chat with your Agent
              </h1>
              <p className="text-muted-foreground mt-2">
                Start a new conversation by sending a message
              </p>
            </div>
            {/* 没消息时：欢迎区 + 输入框 */}
            <MessageInput onSendMessage={handleSendMessage} isLoading={isSending} />
          </div>
        </div>
      )}
    </div>
  );
};
