import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { SITE_NAME } from "@/lib/constants";
import { SignOutButton } from "./SignOutButton";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-brand-600">
          {SITE_NAME}
          <span className="text-accent-500">.</span>
        </Link>

        <div className="flex items-center gap-2 text-sm font-medium">
          <Link href="/events" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            Browse events
          </Link>

          {user ? (
            <>
              {(user.role === "ORGANIZER" || user.role === "ADMIN") && (
                <Link href="/events/new" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                  Create event
                </Link>
              )}
              <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                Dashboard
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/signin" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
