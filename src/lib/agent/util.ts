// 模型工厂：provider/model 是怎么变成真正可调用的大模型对象的  provider: openai model: deepseek-v4-flash最后就是在这个文件里被处理。
// LangChain 对不同模型厂商的封装
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
// 所有聊天模型的共同父类型  上层 Agent 不需要关心具体厂商，只要拿到一个统一的 llm 对象就能用
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DynamicStructuredTool } from "@langchain/core/tools";
// 这个类型定义了创建模型时需要的参数温度参数，可选。越低越稳定，越高越发散。
export interface CreateChatModelOptions {
  // 模型供应商，可选。
  provider?: string; // 'openai' | 'google' | 'anthropic'
  model: string;
  temperature?: number;
}

/**
 * Central factory for creating a chat model based on provider + model name.
 */
// 根据 provider 和 model 创建对应的大模型实例
// 调用时传一个对象  返回值:BaseChatModel  表示这个函数返回一个统一的大模型对象。
// : CreateChatModelOptions是TypeScript 类型注解  解构的这个对象参数必须符合 CreateChatModelOptions 类型   CreateChatModelOptions 应该是一个接口或类型别名，定义了对象的结构
// : BaseChatModel - 函数返回类型
// 不解构的话是这个样子
// export function createChatModel(
//   options: CreateChatModelOptions
// ): BaseChatModel {
//   const provider = options.provider ?? "google";
//   const model = options.model;
//   const temperature = options.temperature ?? 1;

//   switch (provider) {
//     // ...
//   }
// }
export function createChatModel({
  provider = "google",
  model,
  temperature = 1,
}: CreateChatModelOptions): BaseChatModel {
  switch (provider) {
    case "openai":
      // return new ChatOpenAI({ model, temperature });
      // 这段最重要，因为你接 DeepSeek 就靠它  new ChatOpenAI(...) 创建一个 OpenAI 客户端。
      // DeepSeek 的 API 是 OpenAI-compatible，也就是：请求格式兼容 OpenAI所以可以继续用：ChatOpenAI只要改：baseURL
      return new ChatOpenAI({
        model,
        temperature,
        apiKey: process.env.OPENAI_API_KEY,
        configuration: process.env.OPENAI_BASE_URL
          ? { baseURL: process.env.OPENAI_BASE_URL }
          : undefined,
      });
    case "anthropic":
      return new ChatAnthropic({ model, temperature });
    case "google":
    default:
      return new ChatGoogleGenerativeAI({ model, temperature });
  }
}
// ensureAgent 接收的配置类型
export interface AgentConfigOptions {
  model?: string;
  provider?: string; // 'google' | 'openai' etc.
  systemPrompt?: string; // system prompt override
  tools?: unknown[]; // tools from registry or direct tool objects
  approveAllTools?: boolean; // if true, skip tool approval prompts
}

/**
 * JSON Schema keywords that are not supported by Google Gemini's function calling API.
 * These need to be stripped from tool schemas before passing to the LLM.
 */
// 让工具 schema 兼容 Gemini 的 function calling
// sanitizeTool 是为 Gemini 工具调用做兼容处理的。
const UNSUPPORTED_SCHEMA_KEYWORDS = new Set([
  "$schema",
  "$id",
  "$ref",
  "$defs",
  "definitions",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minProperties",
  "maxProperties",
  "additionalProperties",
  "patternProperties",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "contentMediaType",
  "contentEncoding",
  "examples",
  "default",
  "const",
  "readOnly",
  "writeOnly",
  "deprecated",
  "title",
  "format", // Gemini doesn't support format validation
]);

/**
 * Normalizes a JSON Schema type field.
 * Gemini requires type to be a string, not an array.
 * For nullable types like ["string", "null"], we extract the non-null type.
 */
function normalizeType(type: unknown): string | undefined {
  if (typeof type === "string") {
    return type;
  }

  if (Array.isArray(type)) {
    // Filter out "null" and take the first remaining type
    const nonNullTypes = type.filter((t) => t !== "null");
    if (nonNullTypes.length > 0) {
      return nonNullTypes[0] as string;
    }
    // If only "null" types, default to "string"
    return "string";
  }

  return undefined;
}

/**
 * Recursively sanitizes a JSON Schema object by removing unsupported keywords
 * and normalizing values for Google Gemini's function calling API.
 */
function sanitizeSchema(schema: unknown): Record<string, unknown> | unknown {
  // Handle non-object values
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map((item) => sanitizeSchema(item));
  }

  const schemaObj = schema as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schemaObj)) {
    // Skip unsupported keywords
    if (UNSUPPORTED_SCHEMA_KEYWORDS.has(key)) {
      continue;
    }

    // Special handling for "type" field - normalize array types to string
    if (key === "type") {
      const normalizedType = normalizeType(value);
      if (normalizedType) {
        sanitized[key] = normalizedType;
      }
      continue;
    }

    // Special handling for "items" - if it's an array, take first element
    // JSON Schema allows items to be an array for tuple validation, but Gemini doesn't support it
    if (key === "items" && Array.isArray(value)) {
      if (value.length > 0) {
        sanitized[key] = sanitizeSchema(value[0]);
      }
      continue;
    }

    // Special handling for "properties" - preserve all property names (they are not schema keywords),
    // but sanitize each property's sub-schema recursively
    if (key === "properties" && value && typeof value === "object" && !Array.isArray(value)) {
      const propsObj = value as Record<string, unknown>;
      const sanitizedProps: Record<string, unknown> = {};
      for (const [propName, propSchema] of Object.entries(propsObj)) {
        sanitizedProps[propName] = sanitizeSchema(propSchema); // sanitize the sub-schema, not the name
      }
      sanitized[key] = sanitizedProps;
      continue;
    }

    // Special handling for "required" - filter out properties that don't exist in "properties"
    if (key === "required" && Array.isArray(value)) {
      const properties = schemaObj["properties"];
      if (properties && typeof properties === "object" && !Array.isArray(properties)) {
        const validProps = Object.keys(properties as Record<string, unknown>);
        const filtered = value.filter(
          (prop) => typeof prop === "string" && validProps.includes(prop),
        );
        if (filtered.length > 0) {
          sanitized[key] = filtered;
        }
      } else {
        sanitized[key] = value;
      }
      continue;
    }

    // Recursively sanitize nested objects and arrays
    if (value && typeof value === "object") {
      sanitized[key] = sanitizeSchema(value);
    } else {
      sanitized[key] = value;
    }
  }

  // Remove empty "properties" object - Gemini rejects tools with no parameters defined
  if (
    "properties" in sanitized &&
    typeof sanitized["properties"] === "object" &&
    sanitized["properties"] !== null &&
    Object.keys(sanitized["properties"] as Record<string, unknown>).length === 0
  ) {
    delete sanitized["properties"];
    delete sanitized["required"]; // required is meaningless without properties
  }

  return sanitized;
}

/**
 * Sanitizes a DynamicStructuredTool's schema to be compatible with Google Gemini.
 * Modifies the tool's schema in place to remove unsupported JSON Schema keywords.
 */
export function sanitizeTool(tool: DynamicStructuredTool): DynamicStructuredTool {
  // Access the schema property and sanitize it
  const originalSchema = tool.schema as Record<string, unknown>;
  const sanitizedSchema = sanitizeSchema(originalSchema) as Record<string, unknown>;

  // Update the tool's schema in place (lc_kwargs contains the constructor args)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tool as any).schema = sanitizedSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((tool as any).lc_kwargs?.schema) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tool as any).lc_kwargs.schema = sanitizedSchema;
  }

  return tool;
}
export const DEFAULT_MODEL_PROVIDER = "openai";
export const DEFAULT_MODEL_NAME = "deepseek-v4-flash";
