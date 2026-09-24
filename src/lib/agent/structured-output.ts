import type { ZodType } from "zod";

export function getMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
        return item.text;
      }
      return "";
    })
    .join("");
}

export function parseStructuredOutput<T>(schema: ZodType<T>, content: unknown): T {
  const text = getMessageText(content)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start < 0 || end <= start) {
    throw new Error("模型未返回合法 JSON");
  }

  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  return schema.parse(parsed);
}

export function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
