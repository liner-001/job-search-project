import { z } from "zod";

export const APPLICATION_STATUSES = [
  "待投递",
  "已投递",
  "笔试",
  "一面",
  "二面",
  "HR面",
  "Offer",
  "已结束",
] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, "请输入公司名称").max(100, "公司名称不能超过 100 个字符"),
  position: z.string().trim().min(1, "请输入岗位名称").max(100, "岗位名称不能超过 100 个字符"),
  status: applicationStatusSchema.default("待投递"),
  matchScore: z.coerce.number().int().min(0).max(100).default(75),
  nextAction: z.string().trim().max(500, "下一步行动不能超过 500 个字符").optional(),
  jobDescriptionId: z.string().trim().optional(),
});

export const applicationFiltersSchema = z.object({
  status: z.union([applicationStatusSchema, z.literal("全部")]).catch("全部"),
  query: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type ApplicationFilters = z.infer<typeof applicationFiltersSchema>;

export type ApplicationActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<keyof CreateApplicationInput, string[]>>;
    };
