import Link from "next/link";
import type { Metadata } from "next";
import { isTokenValid } from "@/lib/tokens";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  // Keep the one-time token out of Referer headers.
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  const valid = await isTokenValid(token, "PASSWORD_RESET");

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Choose a new password</h1>
        {valid && token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              This reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password" className="btn-primary w-full">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
