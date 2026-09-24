import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "jobpilot_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export interface SessionPayload {
  userId: string;
  expiresAt: Date;
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
  return { token, expiresAt };
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.exp !== "number") return null;
    return { userId: payload.userId, expiresAt: new Date(payload.exp * 1000) };
  } catch {
    return null;
  }
}
