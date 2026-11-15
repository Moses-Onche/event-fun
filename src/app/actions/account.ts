"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { consumeToken, isTokenValid, issueToken } from "@/lib/tokens";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mail";
import { emailSchema, resetPasswordSchema } from "@/lib/validators";
import type { FormState } from "./auth";

// Same wording whether or not the email has an account, so these forms can't be
// used to find out who is registered.
const RESEND_MESSAGE =
  "If an unverified account exists for that email, we've sent a new confirmation link. Check your inbox (and spam folder).";
const FORGOT_MESSAGE =
  "If an account exists for that email, we've sent a link to reset the password. It expires in 1 hour.";

export async function requestVerificationEmail(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (user && user.isActive && user.passwordHash && !user.emailVerified) {
    const token = await issueToken(user.id, "EMAIL_VERIFY");
    if (token) await sendVerificationEmail(user.email, user.name, token);
  }
  return { success: RESEND_MESSAGE };
}

/** Called from the confirmation button on /verify-email (a click, not the link itself, uses the token). */
export async function confirmEmail(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const userId = await consumeToken(token, "EMAIL_VERIFY");
  if (!userId) redirect("/verify-email?status=invalid");

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  redirect("/signin?verified=1");
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (user && user.isActive) {
    const token = await issueToken(user.id, "PASSWORD_RESET");
    if (token) await sendPasswordResetEmail(user.email, user.name, token);
  }
  return { success: FORGOT_MESSAGE };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");

  // Check the password first so a typo doesn't use up the one-time link.
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if (!(await isTokenValid(token, "PASSWORD_RESET"))) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const userId = await consumeToken(token, "PASSWORD_RESET");
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: now, // ends every session that started before now
        emailVerified: now, // they just proved they control this inbox
      },
    }),
    // Any other outstanding reset or verification links are now stale.
    prisma.authToken.deleteMany({ where: { userId } }),
  ]);

  redirect("/signin?reset=1");
}
