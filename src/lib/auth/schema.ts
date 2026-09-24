import { z } from "zod";

const email = z.string().trim().toLowerCase().email("请输入有效邮箱").max(254);
const password = z.string().min(8, "密码至少需要 8 个字符").max(128);

export const loginSchema = z.object({ email, password });
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "名称至少需要 2 个字符").max(50),
});

export interface AuthActionState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}
