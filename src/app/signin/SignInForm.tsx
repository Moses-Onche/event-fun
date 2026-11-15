"use client";

import { useState } from "react";
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
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    setPending(false);
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
          <label htmlFor="password" className="label">Password</label>
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
