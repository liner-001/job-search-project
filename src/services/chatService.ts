// 前端请求后端 Agent API 的封装层
// MessageOptions:发送消息时的配置 MessageResponce 后端返回的消息 Thread会话线程  用import是这些只在编译时做类型检查  运行时不需要真正加载
import type { MessageOptions, MessageResponse, Thread } from "@/types/message";
// ChatServiceConfig接口
export interface ChatServiceConfig {
  baseUrl?: string;
  // 各个接口路径
  endpoints?: {
    history?: string;
    chat?: string;
    stream?: string;
    threads?: string;
  };
  // 一个对象，key是string，value也是string
  headers?: Record<string, string>;
}
// config配置对象
const config: ChatServiceConfig = {
  // 读取环境变量 以NEXT_PUBLIC开头，所以可以暴露给浏览器端代码
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/agent",
  // 会拼成/api/agent/history
  endpoints: {
    history: "/history",
    chat: "/chat",
    stream: "/stream",
    threads: "/threads",
  },
};
// endpoint参数只能是endpoints里的key
// function getUrl(){return "/api/agent";}
// TS在JS基础上加了类型 function getUrl():string{return "/api/agent";}
// :string 表示这个函数的返回值必须是字符串 定义一个getUrl函数 他返回string类型
function getUrl(endpoint: keyof Required<ChatServiceConfig>["endpoints"]): string {
  return `${config.baseUrl}${config.endpoints?.[endpoint] || ""}`;
}
// 可以导出  异步 里面可以用await 定义函数参数Threa是string :Promisse<MessageResponse[]> 表示这个函数返回Promise<MessageReaponse[]>
// 也就是一个异步接如果  等他完成后 会得到MessageResponse数组  MessageResponse[]表示MessageResponse类型的数组
// 这个函数给useChatThread用  根据ThreadID加载某个会话的历史消息
// 这个函数不会立即返回数组 而是返回一个Promise 将来await完以后 才得到MessageResponse数组
// 为什么async函数返回Promise 因为里面有有异步请求  const response = ... const data = ...网络请求需要时间，所以函数不能立即返回真实数据
// 等网络请求和Json解析完成后最终得到消息数组
export async function fetchMessageHistory(threadId: string): Promise<MessageResponse[]> {
  const response = await fetch(`${getUrl("history")}/${threadId}`, {
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Failed to load history");
  }
  // 后端返回的json解析为js对象
  const data = await response.json();

  return data as MessageResponse[];
}
// 创建SSE流
// 接收当前会话ID message 用户输入 opts 模型 provider 工具 返回EventSouce 是浏览器原生SSE对象
export function createMessageStream(
  threadId: string,
  message: string,
  opts?: MessageOptions,
  // : EventSource 表示这个函数返回一个 EventSource 对象
): EventSource {
  // 创建URL查询参数 URLSearchParams 是浏览器提供的工具，用来构造 URL 查询参数
  // 当属性名和变量名一样时，可以简写{ content: message, threadId }{content: message,  threadId: threadId}
  const params = new URLSearchParams({ content: message, threadId });
  // 模型名 供应商 工具列表 工具审批结果
  if (opts?.model) params.set("model", opts.model);
  if (opts?.provider) params.set("provider", opts.provider);
  if (opts?.tools?.length) params.set("tools", opts.tools.join(","));
  if (opts?.allowTool) params.set("allowTool", opts.allowTool);
  if (opts?.approveAllTools !== undefined)
    params.set("approveAllTools", opts.approveAllTools ? "true" : "false");
  if (opts?.attachments && opts.attachments.length > 0) {
    // Serialize attachments as JSON string for query parameter
    // 如果有附件，就把附件数组转成 JSON 字符串，放进 URL 参数。
    params.set("attachments", JSON.stringify(opts.attachments));
  }
  // 创建 SSE 连接。
  return new EventSource(`${getUrl("stream")}?${params}`);
}
// fetchThreads：获取会话列表 异步返回 Thread 数组
export async function fetchThreads(): Promise<Thread[]> {
  const response = await fetch(getUrl("threads"), {
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Failed to load threads");
  }
  return await response.json();
}
// 创建新会话
export async function createNewThread(): Promise<Thread> {
  const response = await fetch(getUrl("threads"), {
    // POST 因为它是在创建资源  返回新建的会话对象
    method: "POST",
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Failed to create thread");
  }
  return await response.json();
}
// 删除一个 thread
export async function deleteThread(threadId: string): Promise<void> {
  const response = await fetch(getUrl("threads"), {
    method: "DELETE",
    headers: {
      // 告诉后端：我发送的是 JSON 数据
      "Content-Type": "application/json",
      // 把额外 headers 合并进来。
      ...config.headers,
    },
    body: JSON.stringify({ id: threadId }),
  });
  // 如果删除失败，尝试读取后端返回的错误。
  if (!response.ok) {
    // 如果 response.json() 解析失败，就返回空对象
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete thread");
  }
}
