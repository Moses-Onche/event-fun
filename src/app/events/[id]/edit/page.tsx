import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { updateEvent } from "@/app/actions/events";
import { EventForm } from "@/components/EventForm";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const user = await requireRole("ORGANIZER", "ADMIN");

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-extrabold">Edit event</h1>
      <EventForm
        action={updateEvent.bind(null, event.id)}
        submitLabel="Save changes"
        initial={{
          title: event.title,
          description: event.description,
          category: event.category,
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt?.toISOString() ?? "",
          locationType: event.locationType,
          location: event.location,
          coverImageUrl: event.coverImageUrl ?? "",
          capacity: event.capacity?.toString() ?? "",
          price: event.priceCents ? (event.priceCents / 100).toString() : "",
        }}
      />
    </div>
  );
}
