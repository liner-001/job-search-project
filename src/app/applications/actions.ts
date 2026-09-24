"use server";

import { revalidatePath } from "next/cache";
import {
  createApplicationSchema,
  type ApplicationActionState,
} from "@/lib/career/applications/schema";
import { createApplication } from "@/lib/career/applications/repository";
import { requireUser } from "@/lib/auth/session";

export async function createApplicationAction(
  _previousState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const user = await requireUser();
  const parsed = createApplicationSchema.safeParse({
    company: formData.get("company"),
    position: formData.get("position"),
    status: formData.get("status"),
    matchScore: formData.get("matchScore"),
    nextAction: formData.get("nextAction"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "请检查表单内容",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createApplication(user.id, parsed.data);
    revalidatePath("/applications");
    revalidatePath("/");

    return {
      status: "success",
      message: "投递记录已创建",
    };
  } catch (error) {
    console.error("Failed to create application:", error);
    return {
      status: "error",
      message: "创建失败，请稍后重试",
    };
  }
}
