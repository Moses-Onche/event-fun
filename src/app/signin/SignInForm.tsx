"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function SignInForm({
  googleEnabled,
  callbackUrl,
}: {
  googleEnabled: boolean;
  callbackUrl: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const res = await signIn("credentials", {
      email,
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    setPending(false);
    if (res?.error === "EMAIL_NOT_VERIFIED") {
      setUnverifiedEmail(email);
      setError("Please confirm your email address before signing in. Check your inbox for the link.");
      return;
    }
    if (!res || res.error) {
      setError("Incorrect email or password, or your account is suspended.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="mb-1 text-xs font-semibold text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="input"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
            {unverifiedEmail && (
              <>
                {" "}
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="font-semibold underline"
                >
                  Send a new link
                </Link>
              </>
            )}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Continue with Google
          </button>
        </>
      )}
    </div>
  );
}
