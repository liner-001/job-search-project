import {
  // 用来创建状态图。
  StateGraph,
  // LangGraph 预定义的消息状态结构，里面主要有 messages
  MessagesAnnotation,
  END,
  START,
  // checkpoint 存储器类型，比如 PostgreSQL checkpointer。
  BaseCheckpointSaver,
  // 暂停图执行，等待人工输入
  interrupt,
  Command,
} from "@langchain/langgraph";
// ToolNode 是 LangGraph 预置的工具执行节点
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SystemMessage, ToolMessage, ContentBlock } from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import { DynamicTool } from "@langchain/core/tools";
// 接收 llm/tools/prompt/checkpointer 然后 build 出一个 LangGraph Agent
export class AgentBuilder {
  private toolNode!: ToolNode;
  private readonly model: BaseChatModel;
  private tools: DynamicTool[];
  private systemPrompt: string = "";
  private approveAllTools: boolean = false;
  private checkpointer?: BaseCheckpointSaver;


  // { tools, llm, prompt, ... }	从传入的对象中解构出这些属性
  // : { tools: DynamicTool[]; ... }	类型注解，定义参数对象的类型
  // constructor(config: {
  //   tools: DynamicTool[];
  //   llm: BaseChatModel;
  //   prompt: string;
  //   checkpointer?: BaseCheckpointSaver;
  //   approveAllTools?: boolean;
  // }) {
  //   const { tools, llm, prompt, checkpointer, approveAllTools } = config;
  //   // 构造函数体
  // }

  constructor({
    tools,
    llm,
    prompt,
    checkpointer,
    approveAllTools,
  }: {
    tools: DynamicTool[];
    llm: BaseChatModel;
    prompt: string;
    checkpointer?: BaseCheckpointSaver;
    approveAllTools?: boolean;
  }) {
    if (!llm) {
      throw new Error("Language model (llm) is required");
    }
    // 把传进来的参数保存到类里。
    this.tools = tools || [];
    // 这里创建工具节点。也就是：后面图里的 tools 节点会用这个 ToolNode 执行工具    this.toolNode = new ToolNode(tools || []);
    this.systemPrompt = prompt;
    this.model = llm;
    this.checkpointer = checkpointer;
    this.approveAllTools = approveAllTools || false;
  }
  // 判断模型是否要调用工具
  //  typeof MessagesAnnotation.State 表示：
  // "获取 MessagesAnnotation 类中 State 属性的类型"
  private shouldApproveTool(state: typeof MessagesAnnotation.State) {
    // const messages = state.messages;解构赋值从 state 对象中提取 messages 属性
    const { messages } = state;
    // 取最后一条消息。为什么看最后一条？因为刚刚执行完 agent 节点，最后一条通常是模型回复。如果模型想调用工具，工具调用信息就在最后一条 AI 消息里。
    const lastMessage = messages[messages.length - 1];
    // 判断最后一条消息里有没有工具调用。
    if (
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls?.length
    ) {
      return "tools";
    }
    return END;
  }
  // 人工审批工具调用
  private async approveToolCall(state: typeof MessagesAnnotation.State) {
    // 如果自动审批
    if (this.approveAllTools) {
      return new Command({ goto: "tools" });
    }
    // 找到最后一次工具调用
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    // 如果最后一条消息有工具调用，就取最后一个工具调用。
    if (
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls?.length
    ) {
      const toolCall = lastMessage.tool_calls![lastMessage.tool_calls!.length - 1];
      // 这是 Human-in-the-loop 的核心。interrupt(...) 会暂停 LangGraph 执行。前端可以根据这个展示：
      // Agent 想调用某个工具，是否允许？等用户点击允许/拒绝后，后端会通过前面学过的：new Command({ resume: ... })恢复这里。
      // 恢复后，humanReview 就会拿到用户的审批结果。
      const humanReview = interrupt<
        {
          question: string;
          toolCall: ToolCall;
        },
        {
          action: string;
          data: string | ContentBlock[];
        }
      >({
        question: "Is this correct?",
        toolCall: toolCall,
      });


      const reviewAction = humanReview.action;
      const reviewData = humanReview.data;
      // 如果允许工具调用：下一步去 tools 节点
      if (reviewAction === "continue") {
        return new Command({ goto: "tools" });
        // 用户修改了工具参数，然后继续执行工具。
        // 它构造一个新的 AI 消息，把 tool_calls 里的 args 替换成用户修改后的数据。
      } else if (reviewAction === "update") {
        const updatedMessage = {
          role: "ai",
          content: lastMessage.content,
          tool_calls: [
            {
              id: toolCall.id,
              name: toolCall.name,
              args: reviewData,
            },
          ],
          id: lastMessage.id,
        };
        return new Command({
          //  去工具节点，同时更新 LangGraph 状态里的 messages。
          goto: "tools",
          update: { messages: [updatedMessage] },
        });
        // 用户不给工具执行，而是给 Agent 一段反馈。
      } else if (reviewAction === "feedback") {
        const toolMessage = new ToolMessage({
          name: toolCall.name,
          content: reviewData,
          tool_call_id: toolCall.id,
        });
        return new Command({
          goto: "agent",
          update: { messages: [toolMessage] },
        });
      }
      throw new Error("Invalid review action");
    }
  }
  // 调用大模型节点
  private async callModel(state: typeof MessagesAnnotation.State) {
    // bindTools 是 LangChain 模型接口，用来把工具列表绑定给模型
    if (!this.model || !this.model.bindTools) {
      throw new Error("Invalid or missing language model (llm)");
    }
    // 构造发给模型的消息列表。
    const messages = [
      // Add always system prompt so it is not duplicated in the messages
      // 第一条是系统提示词：
      new SystemMessage(this.systemPrompt),
      // 后面接当前对话历史：
      ...state.messages,
    ];
    // 把工具绑定给模型。你可以使用这些工具 每个工具叫什么 工具参数是什么
    const modelInvoker = this.model.bindTools(this.tools);
    // 输入是完整 messages。输出是模型回复。
    const response = await modelInvoker.invoke(messages);
    // 把模型回复写回 LangGraph 状态。因为这个图用的是：MessagesAnnotation 返回 { messages: response } 表示： 把 response 加到 messages 状态里
    return { messages: response };
  }
  // 构建 LangGraph 图
  // build() {
  //   // 创建一个状态图
  //   const stateGraph = new StateGraph(MessagesAnnotation);
  //   stateGraph
  //     // 为什么要 .bind(this)？因为 callModel 和 approveToolCall 是类方法。传给 LangGraph 后，如果不 bind，里面的：
  //     // this.model  可能丢失。所以要： this.callModel.bind(this)  保证函数里的 this 还是当前 AgentBuilder 实例。
  //     .addNode("agent", this.callModel.bind(this))
  //     // .addNode("tools", this.toolNode)
  //     .addNode("tools", this.toolNode.invoke.bind(this.toolNode))
  //     .addNode("tool_approval", this.approveToolCall.bind(this), {
  //       ends: ["tools", "agent"],
  //     })
  //     .addEdge(START, "agent")
  //     .addConditionalEdges("agent", this.shouldApproveTool.bind(this), ["tool_approval", END])
  //     .addEdge("tools", "agent");

  //   const compiledGraph = stateGraph.compile({ checkpointer: this.checkpointer });
  //   return compiledGraph;
  // }
  private async callTools(state: typeof MessagesAnnotation.State) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];

    if (
      !("tool_calls" in lastMessage) ||
      !Array.isArray(lastMessage.tool_calls) ||
      !lastMessage.tool_calls.length
    ) {
      return { messages: [] };
    }

    const toolMessages: ToolMessage[] = [];

    for (const toolCall of lastMessage.tool_calls) {
      const tool = this.tools.find((item) => item.name === toolCall.name);

      if (!tool) {
        toolMessages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            name: toolCall.name,
            content: `Tool ${toolCall.name} not found`,
          }),
        );
        continue;
      }

      try {
        const result = await tool.invoke(toolCall.args ?? {});

        toolMessages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            name: toolCall.name,
            content: typeof result === "string" ? result : JSON.stringify(result),
          }),
        );
      } catch (error) {
        toolMessages.push(
          new ToolMessage({
            tool_call_id: toolCall.id!,
            name: toolCall.name,
            content: error instanceof Error ? error.message : "Tool execution failed",
          }),
        );
      }
    }

    return {
      messages: toolMessages,
    };
  }

  // build() {
  //   const stateGraph = new StateGraph(MessagesAnnotation);
  //   const toolNode = new ToolNode(this.tools || []);

  //   stateGraph
  //     .addNode("agent", this.callModel.bind(this))
  //     // .addNode("tools", toolNode)
  //     .addNode("tools", this.callTools.bind(this))
  //     .addNode("tool_approval", this.approveToolCall.bind(this), {
  //       ends: ["tools", "agent"],
  //     })
  //     .addEdge(START, "agent")
  //     .addConditionalEdges("agent", this.shouldApproveTool.bind(this), ["tool_approval", END])
  //     .addEdge("tools", "agent");

  //   const compiledGraph = stateGraph.compile({ checkpointer: this.checkpointer });
  //   return compiledGraph;
  // }


  build() {
    const stateGraph = new StateGraph(MessagesAnnotation);

    stateGraph
      .addNode("agent", this.callModel.bind(this))
      .addNode("tools", this.callTools.bind(this))
      .addEdge(START, "agent")
      .addConditionalEdges("agent", this.shouldApproveTool.bind(this), ["tools", END])
      .addEdge("tools", "agent");

    const compiledGraph = stateGraph.compile({ checkpointer: this.checkpointer });
    return compiledGraph;
  }


}
