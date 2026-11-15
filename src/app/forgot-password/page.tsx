import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/account";
import { EmailRequestForm } from "@/components/EmailRequestForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Forgot your password?</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>
        <EmailRequestForm
          action={requestPasswordReset}
          label="Send reset link"
          pendingLabel="Sending..."
        />
        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered it?{" "}
          <Link href="/signin" className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
