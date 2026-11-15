import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EventCard } from "@/components/EventCard";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 6,
    include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
  });

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-accent-400 px-6 py-14 text-center text-white shadow-lg sm:px-12">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Find your next great experience
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
          Discover events near you and online, or host your own in minutes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/events" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Browse events
          </Link>
          <Link href="/signup" className="btn border border-white/60 text-white hover:bg-white/10">
            Host an event
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/events?category=${encodeURIComponent(c)}`}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium hover:border-brand-500 hover:text-brand-600"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">Upcoming events</h2>
          <Link href="/events" className="text-sm font-semibold text-brand-600 hover:underline">
            See all
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="card p-8 text-center text-slate-600">
            No upcoming events yet. Be the first to{" "}
            <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
              create one
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
