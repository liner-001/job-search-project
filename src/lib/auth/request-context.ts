import { AsyncLocalStorage } from "node:async_hooks";

const userContext = new AsyncLocalStorage<{ userId: string }>();

export function runWithUserContext<T>(userId: string, callback: () => T): T {
  return userContext.run({ userId }, callback);
}

export function getContextUserId() {
  const userId = userContext.getStore()?.userId;
  if (!userId) throw new Error("Authenticated user context is unavailable");
  return userId;
}
