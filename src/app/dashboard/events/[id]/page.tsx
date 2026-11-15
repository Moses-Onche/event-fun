import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { LocalTime } from "@/components/LocalTime";

export const metadata = { title: "Attendees" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  createdAt: Date;
  user: { name: string | null; email: string };
};

function AttendeeTable({ rows, title }: { rows: Row[]; title: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">
        {title} ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="card p-4 text-sm text-slate-600">Nobody here yet.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{r.user.name ?? "-"}</td>
                  <td className="px-4 py-2">{r.user.email}</td>
                  <td className="px-4 py-2">
                    <LocalTime iso={r.createdAt.toISOString()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function EventAttendeesPage({ params }: { params: { id: string } }) {
  const user = await requireRole("ORGANIZER", "ADMIN");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      registrations: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/dashboard");

  const confirmed = event.registrations.filter((r) => r.status === "CONFIRMED");
  const waitlisted = event.registrations.filter((r) => r.status === "WAITLISTED");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-600 hover:underline">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">{event.title}</h1>
        <p className="text-slate-600">
          <LocalTime iso={event.startsAt.toISOString()} />
          {event.capacity ? ` · capacity ${event.capacity}` : " · unlimited capacity"}
        </p>
      </div>
      <AttendeeTable rows={confirmed} title="Confirmed" />
      <AttendeeTable rows={waitlisted} title="Waitlist" />
    </div>
  );
}
