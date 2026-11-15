import Link from "next/link";
import { requestVerificationEmail } from "@/app/actions/account";
import { EmailRequestForm } from "@/components/EmailRequestForm";

export const metadata = { title: "Resend confirmation email" };

export default function ResendVerificationPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Resend confirmation email</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the email you signed up with and we&apos;ll send a new confirmation link.
        </p>
        <EmailRequestForm
          action={requestVerificationEmail}
          label="Send confirmation link"
          pendingLabel="Sending..."
          defaultEmail={searchParams.email}
        />
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/signin" className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
