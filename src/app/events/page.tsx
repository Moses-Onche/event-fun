import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EventCard } from "@/components/EventCard";
import { CATEGORIES } from "@/lib/constants";

export const metadata = { title: "Browse events" };
export const dynamic = "force-dynamic";

type SearchParams = { q?: string; category?: string; from?: string; to?: string };

function parseDay(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function BrowseEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = searchParams.q?.trim();
  const category = CATEGORIES.find((c) => c === searchParams.category);
  const from = parseDay(searchParams.from, false);
  const to = parseDay(searchParams.to, true);

  const now = new Date();
  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    startsAt: {
      // Never list past events; the "from" filter can only move the window forward.
      gte: from && from > now ? from : now,
      ...(to ? { lte: to } : {}),
    },
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    take: 60,
    include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
  });

  const filtered = Boolean(q || category || searchParams.from || searchParams.to);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Browse events</h1>

      <form method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search events..."
          className="input lg:col-span-2"
          aria-label="Search events"
        />
        <select name="category" defaultValue={category ?? ""} className="input" aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input name="from" type="date" defaultValue={searchParams.from} className="input" aria-label="From date" />
        <input name="to" type="date" defaultValue={searchParams.to} className="input" aria-label="To date" />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn-primary">Search</button>
          {filtered && (
            <Link href="/events" className="btn-secondary">Clear filters</Link>
          )}
        </div>
      </form>

      {events.length === 0 ? (
        <p className="card p-8 text-center text-slate-600">
          No events match your search. Try different filters.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
