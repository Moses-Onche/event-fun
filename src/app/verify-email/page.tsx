import Link from "next/link";
import type { Metadata } from "next";
import { confirmEmail } from "@/app/actions/account";
import { isTokenValid } from "@/lib/tokens";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: "Confirm your email",
  // Keep the one-time token out of Referer headers.
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string; status?: string };
}) {
  const token = searchParams.token;
  // The token is only used up when the button is pressed. Mail scanners that pre-open
  // links therefore can't burn it before the person gets there.
  const valid = searchParams.status !== "invalid" && (await isTokenValid(token, "EMAIL_VERIFY"));

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Confirm your email</h1>
        {valid && token ? (
          <form action={confirmEmail} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <p className="text-sm text-slate-600">
              One last step: confirm that this email address is yours to finish setting up your
              account.
            </p>
            <SubmitButton label="Confirm my email" pendingLabel="Confirming..." />
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              This confirmation link is invalid or has expired.
            </p>
            <Link href="/resend-verification" className="btn-primary w-full">
              Send me a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
