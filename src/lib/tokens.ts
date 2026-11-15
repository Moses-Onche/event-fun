import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";

export type TokenType = "EMAIL_VERIFY" | "PASSWORD_RESET";

const TTL_MS: Record<TokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
};

/** Minimum gap between emails of the same kind to the same user (stops email bombing). */
const COOLDOWN_MS = 60 * 1000;

function hash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Creates a fresh token for the user and returns the raw value to put in the email link.
 * Returns null when a token was issued within the cooldown window, in which case the
 * caller should simply not send another email.
 */
export async function issueToken(userId: string, type: TokenType): Promise<string | null> {
  const now = Date.now();

  const recent = await prisma.authToken.findFirst({
    where: { userId, type, createdAt: { gt: new Date(now - COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) return null;

  // Only the newest link works, and expired rows are cleaned up as we go.
  await prisma.authToken.deleteMany({
    where: { OR: [{ userId, type }, { expiresAt: { lt: new Date(now) } }] },
  });

  const raw = randomBytes(32).toString("hex");
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hash(raw),
      expiresAt: new Date(now + TTL_MS[type]),
    },
  });
  return raw;
}

/** Checks that a token is valid without using it up (used to decide which page to show). */
export async function isTokenValid(raw: string | undefined, type: TokenType): Promise<boolean> {
  if (!raw) return false;
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hash(raw) } });
  return Boolean(record && record.type === type && record.expiresAt > new Date());
}

/**
 * Uses a token up. Returns the user id when it was valid, otherwise null.
 * The delete is the atomic step: if two requests race, only one gets count === 1.
 */
export async function consumeToken(raw: string | undefined, type: TokenType): Promise<string | null> {
  if (!raw) return null;

  const record = await prisma.authToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!record || record.type !== type || record.expiresAt <= new Date()) return null;

  const deleted = await prisma.authToken.deleteMany({ where: { id: record.id } });
  return deleted.count === 1 ? record.userId : null;
}
