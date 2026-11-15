import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  adminDeleteEvent,
  setEventStatus,
  setUserActive,
  setUserRole,
} from "@/app/actions/admin";
import { LocalTime } from "@/components/LocalTime";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireRole("ADMIN");

  const [events, users] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { organizer: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-extrabold">Admin moderation</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Events ({events.length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Event</th>
                <th className="px-4 py-2">Organizer</th>
                <th className="px-4 py-2">Starts</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/events/${e.id}`} className="font-semibold hover:text-brand-600">
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{e.organizer.name ?? e.organizer.email}</td>
                  <td className="px-4 py-2">
                    <LocalTime iso={e.startsAt.toISOString()} />
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        e.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {e.status === "PUBLISHED" ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <form
                        action={setEventStatus.bind(
                          null,
                          e.id,
                          e.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED",
                        )}
                      >
                        <button type="submit" className="btn-secondary">
                          {e.status === "PUBLISHED" ? "Hide" : "Unhide"}
                        </button>
                      </form>
                      <form action={adminDeleteEvent.bind(null, e.id)}>
                        <button type="submit" className="btn-danger">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Users ({users.length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === admin.id;
                return (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">
                      <div className="font-semibold">{u.name ?? "-"}</div>
                      <div className="text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-2">{u.role.toLowerCase()}</td>
                    <td className="px-4 py-2">{u.isActive ? "Active" : "Suspended"}</td>
                    <td className="px-4 py-2">
                      {self ? (
                        <span className="block text-right text-xs text-slate-400">You</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          {(["ATTENDEE", "ORGANIZER", "ADMIN"] as const)
                            .filter((r) => r !== u.role)
                            .map((r) => (
                              <form key={r} action={setUserRole.bind(null, u.id, r)}>
                                <button type="submit" className="btn-secondary">
                                  Make {r.toLowerCase()}
                                </button>
                              </form>
                            ))}
                          <form action={setUserActive.bind(null, u.id, !u.isActive)}>
                            <button type="submit" className={u.isActive ? "btn-danger" : "btn-primary"}>
                              {u.isActive ? "Suspend" : "Reactivate"}
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
