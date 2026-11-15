import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatPrice, spotsLeft } from "@/lib/format";
import { LocalTime } from "@/components/LocalTime";
import { registerForEvent, cancelRegistration } from "@/app/actions/registrations";
import { deleteEvent } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { title: true, status: true },
  });
  return { title: event && event.status === "PUBLISHED" ? event.title : "Event" };
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
      include: { organizer: { select: { name: true } } },
    }),
    getCurrentUser(),
  ]);
  if (!event) notFound();

  const isOwner = user?.id === event.organizerId;
  const isAdmin = user?.role === "ADMIN";
  const canManage = isOwner || isAdmin;

  // Hidden (moderated) events are only visible to their organizer and admins.
  if (event.status === "HIDDEN" && !canManage) notFound();

  const [confirmed, waitlisted, myReg] = await Promise.all([
    prisma.registration.count({ where: { eventId: event.id, status: "CONFIRMED" } }),
    prisma.registration.count({ where: { eventId: event.id, status: "WAITLISTED" } }),
    user
      ? prisma.registration.findUnique({
          where: { userId_eventId: { userId: user.id, eventId: event.id } },
        })
      : null,
  ]);

  const left = spotsLeft(event.capacity, confirmed);
  const ended = (event.endsAt ?? event.startsAt) < new Date();
  const active = myReg && myReg.status !== "CANCELLED" ? myReg : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {event.status === "HIDDEN" && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          This event is hidden from the public by an administrator.
        </p>
      )}

      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.coverImageUrl} alt="" className="h-64 w-full rounded-2xl object-cover" />
      ) : (
        <div className="h-40 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400" />
      )}

      <header className="space-y-2">
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {event.category}
        </span>
        <h1 className="text-3xl font-extrabold">{event.title}</h1>
        <p className="text-sm text-slate-500">Organized by {event.organizer.name ?? "an EventFun host"}</p>
      </header>

      <dl className="card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">When</dt>
          <dd>
            <LocalTime iso={event.startsAt.toISOString()} />
            {event.endsAt && (
              <>
                {" "}to <LocalTime iso={event.endsAt.toISOString()} />
              </>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {event.locationType === "ONLINE" ? "Online" : "Where"}
          </dt>
          <dd className="break-words">{event.location}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Price</dt>
          <dd>{formatPrice(event.priceCents, event.currency)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Availability</dt>
          <dd>
            {left === null
              ? `${confirmed} registered`
              : left === 0
                ? `Full${waitlisted ? ` (${waitlisted} on waitlist)` : ""}`
                : `${left} of ${event.capacity} spots left`}
          </dd>
        </div>
      </dl>

      <section className="whitespace-pre-line leading-relaxed text-slate-700">{event.description}</section>

      {searchParams.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <section className="card space-y-3 p-5">
        {active ? (
          <>
            <p className="font-semibold">
              {active.status === "CONFIRMED"
                ? "You're registered for this event."
                : "You're on the waitlist. We'll email you if a spot opens."}
            </p>
            <form action={cancelRegistration.bind(null, event.id)}>
              <button type="submit" className="btn-secondary">
                {active.status === "CONFIRMED" ? "Cancel registration" : "Leave waitlist"}
              </button>
            </form>
          </>
        ) : ended ? (
          <p className="text-slate-600">This event has ended.</p>
        ) : !user ? (
          <p>
            <Link href={`/signin?callbackUrl=/events/${event.id}`} className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
              create an account
            </Link>{" "}
            to register.
          </p>
        ) : user.role !== "ATTENDEE" ? (
          <p className="text-slate-600">
            Organizer and admin accounts can&apos;t register for events. Use an attendee account to join.
          </p>
        ) : event.status === "HIDDEN" ? null : (
          <form action={registerForEvent.bind(null, event.id)}>
            <button type="submit" className="btn-primary">
              {left === 0 ? "Join waitlist" : "Register"}
            </button>
          </form>
        )}
      </section>

      {canManage && (
        <section className="card flex flex-wrap items-center gap-3 p-5">
          <span className="mr-auto text-sm font-semibold text-slate-600">Manage this event</span>
          <Link href={`/dashboard/events/${event.id}`} className="btn-secondary">Attendees</Link>
          <Link href={`/events/${event.id}/edit`} className="btn-secondary">Edit</Link>
          <form action={deleteEvent.bind(null, event.id)}>
            <button type="submit" className="btn-danger">Delete</button>
          </form>
        </section>
      )}
    </article>
  );
}
