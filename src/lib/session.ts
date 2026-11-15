import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export type AppRole = "ATTENDEE" | "ORGANIZER" | "ADMIN";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.active) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireRole(...roles: AppRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
