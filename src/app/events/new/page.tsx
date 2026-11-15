import { requireRole } from "@/lib/session";
import { createEvent } from "@/app/actions/events";
import { EventForm } from "@/components/EventForm";

export const metadata = { title: "Create event" };

export default async function NewEventPage() {
  await requireRole("ORGANIZER", "ADMIN");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-extrabold">Create an event</h1>
      <EventForm action={createEvent} submitLabel="Publish event" />
    </div>
  );
}
