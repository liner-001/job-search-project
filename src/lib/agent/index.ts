// // 导入系统提示词 as SYSTEM_PROMPT是重命名导入。意思是：DEFAULT_SYSTEM_PROMPT在当前文件里叫：SYSTEM_PROMPT
// import { DEFAULT_SYSTEM_PROMPT as SYSTEM_PROMPT } from "./prompt";
// // postgresCheckpointer 是 LangGraph 的状态存储器 负责：把 Agent 的执行状态保存到 PostgreSQL多轮记忆工具审批暂停/恢复刷新后恢复会话
// import { postgresCheckpointer } from "./memory";
// // 导入LangChain 的工具类型StructuredToolInterface可以理解成：结构化工具接口工具有：工具名工具描述参数 schema  执行函数
// // DynamicTool也是 LangChain 里的工具类型，用来给 Agent 调用。这里主要是 TypeScript 类型约束。
// import type { DynamicTool, StructuredToolInterface } from "@langchain/core/tools";
// // 导入模型工厂和默认模型配置
// import {
//   AgentConfigOptions,
//   createChatModel,
//   DEFAULT_MODEL_NAME,
//   DEFAULT_MODEL_PROVIDER,
// } from "./util";
// // getMCPTools() 负责加载 MCP 工具  一种让 Agent 动态接入外部工具的协议  比如以后可以接：文件工具浏览器工具数据库工具搜索工具企业内部系统工具
// import { getMCPTools } from "./mcp";
// // AgentBuilder 是真正构建 LangGraph 图的类  当前文件负责准备材料：llm tools prompt checkpointer approveAllTools
// // 然后交给：new AgentBuilder(...).build()生成真正可运行的 Agent。
// import { AgentBuilder } from "./builder";
// // 记录 postgresCheckpointer.setup() 是否已经开始/完成  Promise<void> | null   用 setupPromise 保证：初始化只做一次
// let setupPromise: Promise<void> | null = null;

// /**
//  * One-time initialization for the Postgres checkpointer.
//  * Ensures the underlying table/extension are ready before any agent runs.
//  * This is called automatically when creating an agent via `getAgent` or `ensureAgent`.
//  */
// // 定义异步函数确保 Postgres checkpointer 已经准备好
// async function setupOnce() {
//   if (!setupPromise) {
//     // 调用：postgresCheckpointer.setup()初始化 checkpoint 需要的数据库结构。创建 LangGraph checkpoint 相关表准备扩展 检查数据库连接
//     // 如果初始化失败：把 setupPromise 重置成 null
//     setupPromise = postgresCheckpointer.setup().catch((err) => {
//       // Reset so a future call can retry if initial setup failed.
//       setupPromise = null;
//       console.error("Failed to setup postgres checkpointer:", err);
//       throw err;
//     });
//   }
//   // 等待初始化完成。如果已经有人在初始化了，其他请求会在这里等同一个 Promise。这就是：只初始化一次，并发请求共享同一个初始化过程
//   await setupPromise;
// }

// /**
//  * Create a new agent instance with the given configuration.
//  * @param cfg Configuration options for the agent
//  * @returns
//  */
// // 这个函数真正创建 Agent
// async function createAgent(cfg?: AgentConfigOptions) {
//   // Resolve model/provider from cfg or defaults.
//   // 解析模型配置
//   const provider = cfg?.provider || DEFAULT_MODEL_PROVIDER;
//   const modelName = cfg?.model || DEFAULT_MODEL_NAME;
//   // 创建模型实例
//   const llm = createChatModel({ provider, model: modelName, temperature: 1 });

//   // Load MCP tools
//   // 加载 MCP 工具
//   const mcpTools = await getMCPTools();
//   // 合并配置工具和 MCP 工具
//   const configTools = (cfg?.tools || []) as StructuredToolInterface[];
//   const allTools = [...configTools, ...mcpTools] as DynamicTool[];
//   // 创建 AgentBuilder 并 build  AgentBuilder 会用这些东西构建 LangGraph 图   .build()返回一个可执行的 Agent。
//   const agent = new AgentBuilder({
//     llm,
//     tools: allTools,
//     prompt: cfg?.systemPrompt || SYSTEM_PROMPT,
//     checkpointer: postgresCheckpointer,
//     approveAllTools: cfg?.approveAllTools || false,
//   }).build();

//   return agent;
// }

// // Public helper if explicit readiness is ever needed elsewhere.
// export async function ensureAgent(cfg?: AgentConfigOptions) {
//   // Ensure checkpointer is ready before returning an agent instance.
//   await setupOnce();
//   return createAgent(cfg);
// }

// // Named export to explicitly fetch a configured agent.
// export async function getAgent(cfg?: AgentConfigOptions) {
//   return ensureAgent(cfg);
// }

// // Eagerly create a default agent at module load using env defaults.
// export const defaultAgent = await ensureAgent();

import { DEFAULT_SYSTEM_PROMPT as SYSTEM_PROMPT } from "./prompt";
import { postgresCheckpointer } from "./memory";
import type { DynamicTool, StructuredToolInterface } from "@langchain/core/tools";
import {
  AgentConfigOptions,
  createChatModel,
  DEFAULT_MODEL_NAME,
  DEFAULT_MODEL_PROVIDER,
} from "./util";
import { getMCPTools } from "./mcp";
import { careerTools } from "./careerTools";
import { AgentBuilder } from "./builder";

let setupPromise: Promise<void> | null = null;

/**
 * One-time initialization for the Postgres checkpointer.
 * Ensures the underlying table/extension are ready before any agent runs.
 * This is called automatically when creating an agent via `getAgent` or `ensureAgent`.
 */
async function setupOnce() {
  if (!setupPromise) {
    setupPromise = postgresCheckpointer.setup().catch((err) => {
      // Reset so a future call can retry if initial setup failed.
      setupPromise = null;
      console.error("Failed to setup postgres checkpointer:", err);
      throw err;
    });
  }

  await setupPromise;
}

/**
 * Create a new agent instance with the given configuration.
 * @param cfg Configuration options for the agent
 * @returns Configured LangGraph agent
 */
async function createAgent(cfg?: AgentConfigOptions) {
  // Resolve model/provider from cfg or defaults.
  const provider = cfg?.provider || DEFAULT_MODEL_PROVIDER;
  const modelName = cfg?.model || DEFAULT_MODEL_NAME;
  const llm = createChatModel({
    provider,
    model: modelName,
    temperature: 1,
  });

  // Load MCP tools from configured MCP servers.
  const mcpTools = await getMCPTools();

  // Tools passed in by runtime config.
  const configTools = (cfg?.tools || []) as StructuredToolInterface[];

  // Combine all tool sources:
  // 1. configTools: tools explicitly passed from config
  // 2. mcpTools: dynamically loaded MCP tools
  // 3. careerTools: project-specific JobPilot tools backed by Prisma/PostgreSQL
  const allTools = [...configTools, ...mcpTools, ...careerTools] as DynamicTool[];

  const agent = new AgentBuilder({
    llm,
    tools: allTools,
    prompt: cfg?.systemPrompt || SYSTEM_PROMPT,
    checkpointer: postgresCheckpointer,
    approveAllTools: cfg?.approveAllTools || false,
  }).build();

  return agent;
}

// Public helper if explicit readiness is ever needed elsewhere.
export async function ensureAgent(cfg?: AgentConfigOptions) {
  // Ensure checkpointer is ready before returning an agent instance.
  await setupOnce();
  return createAgent(cfg);
}

// Named export to explicitly fetch a configured agent.
export async function getAgent(cfg?: AgentConfigOptions) {
  return ensureAgent(cfg);
}
