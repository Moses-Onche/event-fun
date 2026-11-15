import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: {
    registered?: string;
    verified?: string;
    reset?: string;
    callbackUrl?: string;
  };
}) {
  if (await getCurrentUser()) redirect("/dashboard");

  // Only allow same-site relative redirects after sign-in.
  const cb = searchParams.callbackUrl;
  const callbackUrl = cb && cb.startsWith("/") && !cb.startsWith("//") ? cb : "/dashboard";

  const notice = searchParams.registered
    ? "Account created. We've emailed you a confirmation link. Confirm your email, then sign in."
    : searchParams.verified
      ? "Email confirmed. You can sign in now."
      : searchParams.reset
        ? "Password updated. Sign in with your new password."
        : null;

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Welcome back</h1>
        {notice && (
          <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {notice}
          </p>
        )}
        <SignInForm googleEnabled={googleEnabled} callbackUrl={callbackUrl} />
        <p className="mt-6 text-center text-sm text-slate-600">
          New to EventFun?{" "}
          <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
