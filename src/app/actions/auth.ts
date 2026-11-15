"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validators";
import { requireUser } from "@/lib/session";

export type FormState = { error?: string } | undefined;

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash, role } });

  redirect("/signin?registered=1");
}

/** Lets an attendee upgrade themselves to organizer (admins are unaffected). */
export async function becomeOrganizer() {
  const user = await requireUser();
  if (user.role === "ATTENDEE") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ORGANIZER" } });
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
