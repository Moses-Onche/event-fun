import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} - discover and host events`, template: `%s | ${SITE_NAME}` },
  description: "Create events, find things to do, and register in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} {SITE_NAME}. Made for people who love getting together.
        </footer>
      </body>
    </html>
  );
}
