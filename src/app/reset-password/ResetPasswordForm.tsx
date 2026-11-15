"use client";

import { useFormState } from "react-dom";
import { resetPassword } from "@/app/actions/account";
import { SubmitButton } from "@/components/SubmitButton";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPassword, undefined);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="label">New password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          className="input"
          autoComplete="new-password"
        />
        <p className="mt-1 text-xs text-slate-500">8 to 72 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm new password</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          className="input"
          autoComplete="new-password"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton label="Reset password" pendingLabel="Saving..." />
      <p className="text-xs text-slate-500">
        Resetting your password signs you out everywhere else.
      </p>
    </form>
  );
}
