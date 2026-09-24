// 接收前端传来的消息和模型配置
//NextRequuest是Next.js提供的请求对象类型，比原生Request多一些Next.js能力
import { NextRequest } from "next/server";
// streamResponse真正调用agent的服务函数
import { streamResponse } from "@/services/agentService";
// 类型导入 MessageResponse:前后端统一消息格式    FileAttachment 附件格式
import type { MessageResponse, FileAttachment } from "@/types/message";
import { getCurrentUser } from "@/lib/auth/session";
import { runWithUserContext } from "@/lib/auth/request-context";
// 这个接口是动态的，不要静态缓存 因为每次聊天内容都不一样，必须动态执行。

import {
  formatCareerOrchestratorResult,
  runCareerOrchestrator,
  shouldUseCareerOrchestrator,
} from "@/lib/career/orchestrator";
// /api/agent/stream 是聊天框真正请求的 SSE 接口。把 RAG 接这里，用户在 Agent Chat 里提问时才会真正走 RAG。
export const dynamic = "force-dynamic";
// 告诉 Next.js： 这个 API 跑在 Node.js 环境；；为什么要 Node.js；后面 Agent、数据库、LangGraph、一些 Node 包更适合 Node runtime
export const runtime = "nodejs";

/**
 * SSE endpoint that streams incremental AI response chunks produced by the LangGraph React agent.
 * Query params:
 *  - content: user message text
 *  - threadId: (currently unused for history; placeholder for future multi-turn support)
 */
// route.ts 里 export GET，就处理 GET 请求
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  // req.url 是完整请求地址http://localhost:3000/api/agent/stream?content=你好&threadId=abc&model=deepseek-v4-flash&provider=openai
  // new URL(req.url)把字符串解析成 URL 对象 searchParams就是问号后面的参数。
  const { searchParams } = new URL(req.url);
  // 分别取前端传来的用户消息 会话 ID 模型名 模型供应商
  const userContent = searchParams.get("content") || "";
  const threadId = searchParams.get("threadId") || "unknown";
  // 为什么 model 用 undefined 后面如果没传模型，就让 Agent 用默认模型
  const model = searchParams.get("model") || undefined;
  const provider = searchParams.get("provider") || undefined;

  const allowTool = searchParams.get("allowTool") as "allow" | "deny" | null;
  // tools：工具列表字符串，比如 calculator,search approveAllTools：是否自动审批工具 attachments：附件 JSON 字符串
  const toolsParam = searchParams.get("tools") || "";
  const approveAllTools = searchParams.get("approveAllTools") === "true";
  const attachmentsParam = searchParams.get("attachments") || "";

  const tools = toolsParam
    ? toolsParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;

  // Parse attachments from JSON. 解析附件参数
  // 前端传附件时，之前做了：params.set("attachments", JSON.stringify(opts.attachments));就是把数组转成 JSON 字符串
  // 类型：
  let attachments: FileAttachment[] | undefined;
  if (attachmentsParam) {
    try {
      // 后端这里： 再把字符串转回数组
      attachments = JSON.parse(attachmentsParam);
    } catch (error) {
      console.error("Failed to parse attachments:", error);
    }
  }

  // Thread existence handled in service.
  // 创建 TextEncoder// ReadableStream 往外发送的是字节数据  但我们现在写的是字符串  需要 TextEncoder 把字符串转成Uint8Array 就是字节数组
  const encoder = new TextEncoder();
  // 创建 ReadableStream Web Streams API  创建一个可以持续往客户端写数据的流  泛型：ReadableStream<Uint8Array>  表示这个流里写出去的数据类型是字节数组。
  const stream = new ReadableStream<Uint8Array>({
    // 当客户端连接上这个流时，会执行 start
    start(controller) {
      // send 函数：按 SSE 格式发送消息  内部小函数，它接收一条消息：MessageResponse 然后发送给前端。
      // 会生成：data: {"type":"ai","data":{"id":"1","content":"你好"}}
      // 然后：encoder.encode(...)把字符串转成字节。最后：controller.enqueue(...)写入流，前端 EventSource.onmessage 就能收到。
      const send = (data: MessageResponse) => {
        // controller 是流控制器，可以用它往前端推数据
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial comment to establish stream初始连接注释 : connected不是业务消息，
      // 不会触发：stream.onmessage = ...也不会被你当成 AI 回复展示出来。它的作用是：先往连接里写一点东西，让这条 SSE 连接真正建立起来

      controller.enqueue(encoder.encode(": connected\n\n"));

      // Run the agent streaming in the background后台异步运行 Agent
      // 一个立即执行的异步函数 ？ 因为 start(controller) 本身不是直接 async，但里面要用await streamResponse(...)for await (...)所以包一个 async 函数，并立刻执行
      // (async () => {
      //   try {
      //     // 调用 Agent 服务层  这是后端真正进入 Agent 的地方 和前端参数一一对应  params.set("model", opts.model)  searchParams.get("model")
      //     const iterable = await streamResponse({
      //       threadId,
      //       userText: userContent,
      //       opts: {
      //         model,
      //         provider,
      //         tools,
      //         allowTool: allowTool || undefined,
      //         approveAllTools,
      //         attachments,
      //       },
      //     });

      // 这是“RAG 短路模式”。
      // 当用户问求职知识类问题时，先不走大模型 Agent，而是直接走 answerWithCareerRag，
      // 把检索增强后的回答用 SSE 推给聊天框。其他问题仍然走原来的 streamResponse，不会破坏原 Agent 能力。
      runWithUserContext(user.id, async () => {
        try {
          if (shouldUseCareerOrchestrator(userContent)) {
            const result = await runCareerOrchestrator(userContent, user.id);
            const answer = formatCareerOrchestratorResult(result);

            send({
              type: "ai",
              data: {
                id: `career-orchestrator-${Date.now()}`,
                content: answer,
                additional_kwargs: {
                  source: "career_orchestrator",
                  intent: result.intent,
                  route: result.route,
                  tools: result.tools,
                },
              },
            });

            controller.enqueue(encoder.encode("event: done\n"));
            controller.enqueue(encoder.encode("data: {}\n\n"));
            return;
          }

          // 调用 Agent 服务层  这是后端真正进入 Agent 的地方 和前端参数一一对应  params.set("model", opts.model)  searchParams.get("model")
          const iterable = await streamResponse({
            userId: user.id,
            threadId,
            userText: userContent,
            opts: {
              model,
              provider,
              tools,
              allowTool: allowTool || undefined,
              approveAllTools,
              attachments,
            },
          });
          // 遍历 Agent 流式输出  streamResponse 返回的是一个异步可迭代对象 Agent 每生成一段，就 yield 一个 chunk
          for await (const chunk of iterable) {
            // Only forward AI/tool chunks; ignore human/system
            // 只发 ai/tool 因为前端用户消息已经自己乐观显示了，不需要后端再发 humanai：AI 回复tool：工具消息
            if (chunk.type === "ai" || chunk.type === "tool") {
              send(chunk);
            }
          }

          // Signal completion
          // 后端发送：event: done前端监听：addEventListener("done")
          controller.enqueue(encoder.encode("event: done\n"));
          controller.enqueue(encoder.encode("data: {}\n\n"));
        } catch (err: unknown) {
          // 如果 Agent 调用出错，就发送 SSE error 事件
          // Emit an error event (client onerror will capture general network; providing data for diagnostics)
          // 前端对应：stream.addEventListener("error", ...)
          controller.enqueue(encoder.encode("event: error\n"));
          controller.enqueue(
            encoder.encode(
              // err as Error是类型断言，告诉 TypeScript 我把 err 当作 Error 类型处理
              `data: ${JSON.stringify({ message: (err as Error)?.message || "Stream error", threadId })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      });
    },
    // 如果前端断开连接，比如刷新页面、关闭标签页，流会触发 cancel
    cancel() {
      // If client disconnects, nothing special yet (LangGraph stream will stop as iteration halts)
    },
  });
  // 这里把刚才创建的 ReadableStream 返回给浏览器
  return new Response(stream, {
    headers: {
      // 告诉浏览器：这是 SSE 流
      "Content-Type": "text/event-stream; charset=utf-8",
      // 不要缓存，也不要被代理改写
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // 告诉 Nginx 这类代理不要缓冲响应。否则流式数据可能被攒起来一次性返回
      "X-Accel-Buffering": "no",
    },
  });
}
