"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, registerSchema, type AuthActionState } from "@/lib/auth/schema";
import prisma from "@/lib/database/prisma";

function safeDestination(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "请检查登录信息",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { status: "error", message: "邮箱或密码不正确" };
  }
  await createSession(user.id);
  redirect(safeDestination(formData.get("next")));
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "请检查注册信息",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.$transaction(async (tx) => {
      const isFirstUser = (await tx.user.count()) === 0;
      const created = await tx.user.create({
        data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
      });
      if (isFirstUser) {
        await Promise.all([
          tx.thread.updateMany({ where: { userId: null }, data: { userId: created.id } }),
          tx.resume.updateMany({ where: { userId: null }, data: { userId: created.id } }),
          tx.jobDescription.updateMany({ where: { userId: null }, data: { userId: created.id } }),
          tx.jobApplication.updateMany({ where: { userId: null }, data: { userId: created.id } }),
          tx.interviewSession.updateMany({ where: { userId: null }, data: { userId: created.id } }),
        ]);
      }
      return created;
    });
    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", message: "该邮箱已经注册" };
    }
    console.error("Failed to register user:", error);
    return { status: "error", message: "注册失败，请稍后重试" };
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
