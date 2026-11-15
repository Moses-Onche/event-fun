"use client";

import { useFormState } from "react-dom";
import type { FormState } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** A single "enter your email" form, used for password reset and for re-sending the verification link. */
export function EmailRequestForm({
  action,
  label,
  pendingLabel,
  defaultEmail,
}: {
  action: Action;
  label: string;
  pendingLabel: string;
  defaultEmail?: string;
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          className="input"
          autoComplete="email"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <SubmitButton label={label} pendingLabel={pendingLabel} />
    </form>
  );
}
