// 把前端传来的用户消息，转换成 LangGraph Agent 输入；调用 agent.stream；再把 LangGraph 输出转换成前端统一的 MessageResponse。
// ensureAgent负责创建或准备 LangGraph Agent
import { ensureAgent } from "@/lib/agent";
// ensureThread负责确保当前会话 thread 存在。如果数据库里没有这个 thread，它会创建
import { ensureThread } from "@/lib/thread";
// MessageOptions：前端传来的配置  MessageResponse：返回给前端的消息格式  ToolCall：工具调用结构
import type { MessageOptions, MessageResponse, ToolCall } from "@/types/message";
// Prisma 数据库客户端，用于查数据库  fetchThreadHistory 会用
import prisma from "@/lib/database/prisma";
// 从 LangGraph checkpoint / memory 里获取历史消息
import { getHistory } from "@/lib/agent/memory";
// LangChain 消息类型  HumanMessage  表示用户消息  输入：你好后端会包装成：new HumanMessage({ content: "你好" })给 Agent
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
// LangGraph 的命令对象  主要用于：恢复被工具审批暂停的 Agent
import { Command } from "@langchain/langgraph";
// 处理附件，把上传的文件转换成模型可理解的内容
import { processAttachmentsForAI } from "@/lib/storage/content";
// Langfuse 观测工具，用来记录 LLM 调用链路。
import { CallbackHandler } from "@langfuse/langchain";

// Only instantiate when tracing is explicitly enabled to avoid silent errors
// when Langfuse credentials are absent.
const langfuseHandler = process.env.LANGFUSE_ENABLED === "true" ? new CallbackHandler() : null;

/**
 * Returns an async iterable producing incremental AI text chunks for a user text input.
 * Thread is ensured before streaming. The consumer (route) can package into SSE or any protocol.
 */
// 这个函数被 route.ts 调用
export async function streamResponse(params: {
  // 当前会话 ID  用户输入内容  模型、provider、附件、工具审批等配置
  threadId: string;
  userText: string;
  opts?: MessageOptions;
}) {
  // 解构参数  const threadId = params.threadId;
  const { threadId, userText, opts } = params;
  // 确保数据库中存在当前会话。如果是新 thread，就创建
  // 为什么传 userText  可以用第一条消息生成 thread 标题  你好，请帮我分析简历可以变成会话标题
  await ensureThread(threadId, userText);

  // If allowTool is present, use Command with resume action instead of regular inputs
  if (opts?.allowTool) {
    // 创建 LangGraph Command  如果用户允许工具  action: "continue"让 Agent 继续执行。
    const inputs = new Command({
      // 恢复暂停的图执行
      resume: {
        action: opts.allowTool === "allow" ? "continue" : "update",
        data: {},
      },
    });
    // 创建 Agent
    const agent = await ensureAgent({
      model: opts?.model,
      provider: opts?.provider,
      tools: opts?.tools,
      approveAllTools: opts?.approveAllTools,
    });

    // Type assertion needed for Command union with state update in v1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // 真正调用 LangGraph Agent  agent.stream(...)以流式方式执行 Agent
    // inputs as any Agent 输入，这里是恢复命令 Command  as any 是类型绕过，因为 LangGraph 的类型比较复杂
    const iterable = await agent.stream(inputs as any, {
      // 表示只要 Agent 状态有更新，就流式返回
      streamMode: ["updates"],
      // 告诉 LangGraph：当前执行属于哪个 thread
      configurable: { thread_id: threadId },
      ...(langfuseHandler ? { callbacks: [langfuseHandler] } : {}),
    });
    // Agent 原始输出格式比较复杂用 generator 转换成前端要的：MessageResponse
    return generator(iterable);
  }

  // Build multimodal message with attachments
  // 普通纯文本 string  多模态数组 Array
  let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

  if (opts?.attachments && opts.attachments.length > 0) {
    // Process attachments and build content array
    // 会把附件变成模型能理解的内容。
    const attachmentContents = await processAttachmentsForAI(opts.attachments);

    // Combine user text with attachment contents
    // 把用户文本和附件内容拼在一起
    messageContent = [{ type: "text", text: userText }, ...attachmentContents];
  } else {
    // Simple text message普通字符串
    messageContent = userText;
  }
  // 前端传来的普通字符串不能直接给 LangGraph Agent  要包装成 LangChain 消息格式：new HumanMessage({ content: messageContent })
  // {
  //   messages: [
  //     HumanMessage("你好")
  //   ]
  // }用户消息进入 Agent 的标准格式。
  const inputs = {
    messages: [new HumanMessage({ content: messageContent })],
  };
  // 创建 Agent  创建一个配置好的 LangGraph Agent
  const agent = await ensureAgent({
    model: opts?.model,
    provider: opts?.provider,
    tools: opts?.tools,
    approveAllTools: opts?.approveAllTools,
  });

  // Type assertion needed for Command union with state update in v1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // 流式执行 Agent  Agent 真正运行的地方  agent.stream启动 Agent 执行。
  const iterable = await agent.stream(inputs as any, {
    // 让 LangGraph 每次有更新都返回
    streamMode: ["updates"],
    // 告诉 checkpoint：这个会话的状态存到这个 thread_id 下
    configurable: { thread_id: threadId },
    ...(langfuseHandler ? { callbacks: [langfuseHandler] } : {}),
  });
  // 把 LangGraph 原始输出转成前端消息流
  return generator(iterable);
}

// Helper generator function to process stream chunks
// 一个异步生成器函数  async function* 表示：这个函数可以异步地产生多个值不是一次性 return 一个数组，而是：yield processedMessage;一条一条吐出去。
async function* generator(
  iterable: AsyncIterable<unknown>,
  // 异步生成 MessageResponse 类型的数据  也是为什么 route.ts 可以：for await (const chunk of iterable)
): AsyncGenerator<MessageResponse, void, unknown> {
  for await (const chunk of iterable) {
    if (!chunk) continue;

    // Handle tuple format: [type, data]
    if (Array.isArray(chunk) && chunk.length === 2) {
      const [chunkType, chunkData] = chunk;

      if (
        chunkType === "updates" &&
        chunkData &&
        typeof chunkData === "object" &&
        !Array.isArray(chunkData)
      ) {
        // Handle updates: ['updates', { agent: { messages: [Array] } }]
        // 取出 agent.messages  安全地判断：chunkData 里有没有 agent.messages
        if (
          "agent" in chunkData &&
          chunkData.agent &&
          typeof chunkData.agent === "object" &&
          !Array.isArray(chunkData.agent) &&
          "messages" in chunkData.agent
        ) {
          // 如果 messages 本来就是数组，就直接用。如果不是数组，就包成数组。保证后面统一遍历：for (const message of messages)
          const messages = Array.isArray(chunkData.agent.messages)
            ? chunkData.agent.messages
            : [chunkData.agent.messages];
          for (const message of messages) {
            if (!message) continue;
            // 只处理 AIMessage
            const isAIMessage =
              message?.constructor?.name === "AIMessageChunk" ||
              message?.constructor?.name === "AIMessage";

            if (!isAIMessage) continue;
            // 把 LangChain 的 AIMessage 转成前端统一的：MessageResponse
            const messageWithTools = message as Record<string, unknown>;
            const processedMessage = processAIMessage(messageWithTools);
            // 如果转换成功：yield processedMessage;把它吐给上一层route.ts
            if (processedMessage) {
              yield processedMessage;
            }
          }
        }
      }
    }
  }
}

// Helper function to process any AI message and return the appropriate MessageResponse
function processAIMessage(message: Record<string, unknown>): MessageResponse | null {
  // Check if this is a tool call (content is array with functionCall)判断是不是工具调用
  const hasToolCall =
    // 如果 message.content 是数组，并且里面某一项有：functionCall就认为这是工具调用相关消息。
    Array.isArray(message.content) &&
    message.content.some(
      (item: unknown) => item && typeof item === "object" && "functionCall" in item,
    );
  // 工具调用消息处理
  if (hasToolCall) {
    // Return full AIMessageData for tool calls to preserve all information
    return {
      type: "ai",
      data: {
        id: (message.id as string) || Date.now().toString(),
        content: typeof message.content === "string" ? message.content : "",
        tool_calls: (message.tool_calls as ToolCall[]) || undefined,
        additional_kwargs: (message.additional_kwargs as Record<string, unknown>) || undefined,
        response_metadata: (message.response_metadata as Record<string, unknown>) || undefined,
      },
    };
    // 普通文本 AI 消息
  } else {
    // Handle regular text content - extract text from various content types
    let text = "";
    if (typeof message.content === "string") {
      text = message.content;
    } else if (Array.isArray(message.content)) {
      text = message.content
        .map((c: string | { text?: string }) => (typeof c === "string" ? c : c?.text || ""))
        .join("");
    } else {
      text = String(message.content ?? "");
    }

    // Only return message if we have actual text content
    if (text.trim()) {
      return {
        type: "ai",
        data: { id: (message.id as string) || Date.now().toString(), content: text },
      };
    }
  }
  return null;
}

/** Fetch prior messages for a thread from the LangGraph checkpoint/memory system. */
// 根据 threadId 获取历史消息。
export async function fetchThreadHistory(threadId: string): Promise<MessageResponse[]> {
  // 先查数据库里有没有这个 thread。如果没有，返回空数组。
  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) return [];
  try {
    // 从 LangGraph checkpoint/memory 中取历史消息
    const history = await getHistory(threadId);
    // 然后把 LangChain BaseMessage 转成普通对象：msg.toDict()并断言成：MessageResponse
    return history.map((msg: BaseMessage) => msg.toDict() as MessageResponse);
  } catch (e) {
    console.error("fetchThreadHistory error", e);
    return [];
  }
}
