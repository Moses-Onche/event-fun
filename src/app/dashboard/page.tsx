import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { becomeOrganizer } from "@/app/actions/auth";
import { cancelRegistration } from "@/app/actions/registrations";
import { LocalTime } from "@/components/LocalTime";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";

  const [registrations, myEvents] = await Promise.all([
    prisma.registration.findMany({
      where: { userId: user.id, status: { not: "CANCELLED" } },
      include: { event: true },
      orderBy: { event: { startsAt: "asc" } },
    }),
    isOrganizer
      ? prisma.event.findMany({
          where: { organizerId: user.id },
          orderBy: { startsAt: "desc" },
          include: {
            registrations: { select: { status: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold">Hi {user.name ?? "there"}</h1>
        <p className="text-slate-600">
          Signed in as {user.email} &middot;{" "}
          <span className="font-semibold text-brand-700">{user.role.toLowerCase()}</span>
        </p>
      </header>

      {user.role === "ATTENDEE" && (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-bold">Want to host your own events?</h2>
            <p className="text-sm text-slate-600">Switch your account to organizer. It&apos;s free.</p>
          </div>
          <form action={becomeOrganizer}>
            <button type="submit" className="btn-primary">Become an organizer</button>
          </form>
        </section>
      )}

      {isOrganizer && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My events</h2>
            <Link href="/events/new" className="btn-primary">Create event</Link>
          </div>
          {myEvents.length === 0 ? (
            <p className="card p-6 text-slate-600">You haven&apos;t created any events yet.</p>
          ) : (
            <ul className="space-y-3">
              {myEvents.map((e) => {
                const confirmed = e.registrations.filter((r) => r.status === "CONFIRMED").length;
                const waitlisted = e.registrations.filter((r) => r.status === "WAITLISTED").length;
                return (
                  <li key={e.id} className="card flex flex-wrap items-center gap-3 p-4">
                    <div className="mr-auto">
                      <Link href={`/events/${e.id}`} className="font-bold hover:text-brand-600">
                        {e.title}
                      </Link>
                      {e.status === "HIDDEN" && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                          Hidden by admin
                        </span>
                      )}
                      <p className="text-sm text-slate-500">
                        <LocalTime iso={e.startsAt.toISOString()} /> &middot; {confirmed}
                        {e.capacity ? `/${e.capacity}` : ""} registered
                        {waitlisted > 0 ? ` · ${waitlisted} waitlisted` : ""}
                      </p>
                    </div>
                    <Link href={`/dashboard/events/${e.id}`} className="btn-secondary">Attendees</Link>
                    <Link href={`/events/${e.id}/edit`} className="btn-secondary">Edit</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {user.role === "ATTENDEE" && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">My registrations</h2>
          {registrations.length === 0 ? (
            <p className="card p-6 text-slate-600">
              You haven&apos;t registered for anything yet.{" "}
              <Link href="/events" className="font-semibold text-brand-600 hover:underline">
                Browse events
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {registrations.map((r) => (
                <li key={r.id} className="card flex flex-wrap items-center gap-3 p-4">
                  <div className="mr-auto">
                    <Link href={`/events/${r.eventId}`} className="font-bold hover:text-brand-600">
                      {r.event.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      <LocalTime iso={r.event.startsAt.toISOString()} />
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.status === "CONFIRMED" ? "Confirmed" : "Waitlisted"}
                  </span>
                  <form action={cancelRegistration.bind(null, r.eventId)}>
                    <button type="submit" className="btn-secondary">
                      {r.status === "CONFIRMED" ? "Cancel" : "Leave"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
