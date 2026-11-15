"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { eventSchema, type EventInput } from "@/lib/validators";
import type { FormState } from "./auth";

function readEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? undefined,
    locationType: formData.get("locationType"),
    location: formData.get("location"),
    coverImageUrl: formData.get("coverImageUrl") ?? undefined,
    capacity: formData.get("capacity") ?? undefined,
    price: formData.get("price") ?? undefined,
  });
}

function toData(d: EventInput) {
  return {
    title: d.title,
    description: d.description,
    category: d.category,
    startsAt: d.startsAt,
    endsAt: d.endsAt ? new Date(d.endsAt) : null,
    locationType: d.locationType,
    location: d.location,
    coverImageUrl: d.coverImageUrl ?? null,
    capacity: d.capacity,
    priceCents: d.price,
  };
}

export async function createEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("ORGANIZER", "ADMIN");

  const parsed = readEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const event = await prisma.event.create({
    data: { ...toData(parsed.data), organizerId: user.id },
  });

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function updateEvent(
  eventId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("ORGANIZER", "ADMIN");

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return { error: "Event not found." };
  if (existing.organizerId !== user.id && user.role !== "ADMIN") {
    return { error: "You can only edit your own events." };
  }

  const parsed = readEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await prisma.event.update({ where: { id: eventId }, data: toData(parsed.data) });

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const user = await requireRole("ORGANIZER", "ADMIN");

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) redirect("/dashboard");
  if (existing.organizerId !== user.id && user.role !== "ADMIN") redirect("/dashboard");

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/events");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
