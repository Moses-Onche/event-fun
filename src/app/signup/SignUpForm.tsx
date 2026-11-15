"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import { signUp } from "@/app/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action] = useFormState(signUp, undefined);

  return (
    <div className="mt-6 space-y-4">
      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" name="name" required className="input" autoComplete="name" />
        </div>
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
            minLength={8}
            className="input"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>

        <fieldset>
          <legend className="label">I want to...</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="card flex cursor-pointer items-start gap-2 p-3 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
              <input type="radio" name="role" value="ATTENDEE" defaultChecked className="mt-1" />
              <span>
                <span className="block font-semibold">Attend events</span>
                <span className="text-slate-500">Browse and register</span>
              </span>
            </label>
            <label className="card flex cursor-pointer items-start gap-2 p-3 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
              <input type="radio" name="role" value="ORGANIZER" className="mt-1" />
              <span>
                <span className="block font-semibold">Organize events</span>
                <span className="text-slate-500">Create and manage</span>
              </span>
            </label>
          </div>
        </fieldset>

        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <Submit />
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Continue with Google
          </button>
          <p className="text-center text-xs text-slate-500">
            Google accounts start as attendees; you can switch to organizer from your dashboard.
          </p>
        </>
      )}
    </div>
  );
}
