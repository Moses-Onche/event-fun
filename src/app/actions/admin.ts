"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/events");
}

export async function setEventStatus(eventId: string, status: "PUBLISHED" | "HIDDEN") {
  await requireRole("ADMIN");
  await prisma.event.update({ where: { id: eventId }, data: { status } });
  refresh();
  revalidatePath(`/events/${eventId}`);
}

export async function adminDeleteEvent(eventId: string) {
  await requireRole("ADMIN");
  await prisma.event.delete({ where: { id: eventId } });
  refresh();
}

export async function setUserActive(userId: string, isActive: boolean) {
  const admin = await requireRole("ADMIN");
  if (admin.id === userId) return; // never lock yourself out
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  refresh();
}

export async function setUserRole(userId: string, role: "ATTENDEE" | "ORGANIZER" | "ADMIN") {
  const admin = await requireRole("ADMIN");
  if (admin.id === userId) return; // never demote yourself
  await prisma.user.update({ where: { id: userId }, data: { role } });
  refresh();
}
