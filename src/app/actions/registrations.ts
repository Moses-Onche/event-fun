"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendPromotionEmail, sendRegistrationEmail } from "@/lib/mail";

function back(eventId: string, error?: string): never {
  redirect(error ? `/events/${eventId}?error=${encodeURIComponent(error)}` : `/events/${eventId}`);
}

export async function registerForEvent(eventId: string) {
  const user = await requireUser();
  if (user.role !== "ATTENDEE") {
    back(eventId, "Only attendee accounts can register for events.");
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event || event.status !== "PUBLISHED") return { error: "This event is not available." };
      if ((event.endsAt ?? event.startsAt) < new Date()) {
        return { error: "This event has already ended." };
      }

      const existing = await tx.registration.findUnique({
        where: { userId_eventId: { userId: user.id, eventId } },
      });
      if (existing && existing.status !== "CANCELLED") {
        return { error: "You are already registered for this event." };
      }

      const confirmed = await tx.registration.count({
        where: { eventId, status: "CONFIRMED" },
      });
      const status =
        event.capacity === null || confirmed < event.capacity ? "CONFIRMED" : "WAITLISTED";

      if (existing) {
        // Re-registering after a cancellation puts the person at the back of the line.
        await tx.registration.update({
          where: { id: existing.id },
          data: { status, createdAt: new Date() },
        });
      } else {
        await tx.registration.create({ data: { userId: user.id, eventId, status } });
      }
      return { status, event } as const;
    },
    { isolationLevel: "Serializable" },
  );

  if ("error" in result && result.error) back(eventId, result.error);

  if ("status" in result && result.event) {
    await sendRegistrationEmail(user.email!, user.name ?? null, result.event, result.status);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  back(eventId);
}

export async function cancelRegistration(eventId: string) {
  const user = await requireUser();

  const promoted = await prisma.$transaction(
    async (tx) => {
      const reg = await tx.registration.findUnique({
        where: { userId_eventId: { userId: user.id, eventId } },
      });
      if (!reg || reg.status === "CANCELLED") return null;

      await tx.registration.update({ where: { id: reg.id }, data: { status: "CANCELLED" } });

      // A confirmed seat just opened: promote the longest-waiting person.
      if (reg.status === "CONFIRMED") {
        const next = await tx.registration.findFirst({
          where: { eventId, status: "WAITLISTED" },
          orderBy: { createdAt: "asc" },
          include: { user: true, event: true },
        });
        if (next) {
          await tx.registration.update({ where: { id: next.id }, data: { status: "CONFIRMED" } });
          return next;
        }
      }
      return null;
    },
    { isolationLevel: "Serializable" },
  );

  if (promoted) {
    await sendPromotionEmail(promoted.user.email, promoted.user.name, promoted.event);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  redirect(`/events/${eventId}`);
}
