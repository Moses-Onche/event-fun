import Link from "next/link";
import { formatPrice, spotsLeft } from "@/lib/format";
import { LocalTime } from "./LocalTime";

export type EventCardData = {
  id: string;
  title: string;
  category: string;
  startsAt: Date;
  location: string;
  locationType: "PHYSICAL" | "ONLINE";
  coverImageUrl: string | null;
  capacity: number | null;
  priceCents: number;
  currency: string;
  _count: { registrations: number };
};

export function EventCard({ event }: { event: EventCardData }) {
  const left = spotsLeft(event.capacity, event._count.registrations);

  return (
    <Link
      href={`/events/${event.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.coverImageUrl} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-500 to-accent-400 text-4xl font-black text-white/90">
          {event.title.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {event.category}
        </span>
        <h3 className="text-lg font-bold leading-snug group-hover:text-brand-600">{event.title}</h3>
        <p className="text-sm text-slate-600">
          <LocalTime iso={event.startsAt.toISOString()} />
        </p>
        <p className="truncate text-sm text-slate-500">
          {event.locationType === "ONLINE" ? "Online" : event.location}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="font-semibold text-brand-700">
            {formatPrice(event.priceCents, event.currency)}
          </span>
          <span className={left === 0 ? "font-medium text-red-600" : "text-slate-500"}>
            {left === null ? "Open registration" : left === 0 ? "Full (waitlist)" : `${left} spots left`}
          </span>
        </div>
      </div>
    </Link>
  );
}
