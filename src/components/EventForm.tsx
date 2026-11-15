"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CATEGORIES } from "@/lib/constants";
import type { FormState } from "@/app/actions/auth";

export type EventFormValues = {
  title: string;
  description: string;
  category: string;
  startsAt: string; // ISO
  endsAt: string; // ISO or ""
  locationType: "PHYSICAL" | "ONLINE";
  location: string;
  coverImageUrl: string;
  capacity: string;
  price: string;
};

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Convert an ISO string into the "YYYY-MM-DDTHH:mm" value that datetime-local expects, in local time. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving..." : label}
    </button>
  );
}

export function EventForm({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: EventFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [locationType, setLocationType] = useState<"PHYSICAL" | "ONLINE">(
    initial?.locationType ?? "PHYSICAL",
  );

  // Populate local-time values after mount so server (UTC) and browser output never mismatch.
  useEffect(() => {
    setStartsAt(toLocalInput(initial?.startsAt ?? ""));
    setEndsAt(toLocalInput(initial?.endsAt ?? ""));
  }, [initial?.startsAt, initial?.endsAt]);

  // Send real ISO timestamps so the event keeps the organizer's timezone.
  function submit(formData: FormData) {
    for (const key of ["startsAt", "endsAt"] as const) {
      const raw = String(formData.get(key) ?? "");
      const date = raw ? new Date(raw) : null;
      formData.set(key, date && !Number.isNaN(date.getTime()) ? date.toISOString() : "");
    }
    formAction(formData);
  }

  return (
    <form action={submit} className="card space-y-5 p-6">
      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" name="title" required maxLength={120} defaultValue={initial?.title} className="input" />
      </div>

      <div>
        <label htmlFor="description" className="label">Description</label>
        <textarea
          id="description"
          name="description"
          required
          rows={6}
          defaultValue={initial?.description}
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">Category</label>
          <select id="category" name="category" defaultValue={initial?.category ?? CATEGORIES[0]} className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="coverImageUrl" className="label">Cover image URL (optional)</label>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            placeholder="https://..."
            defaultValue={initial?.coverImageUrl}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className="label">Starts</label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="endsAt" className="label">Ends (optional)</label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="locationType" className="label">Event type</label>
          <select
            id="locationType"
            name="locationType"
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as "PHYSICAL" | "ONLINE")}
            className="input"
          >
            <option value="PHYSICAL">In person</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
        <div>
          <label htmlFor="location" className="label">
            {locationType === "ONLINE" ? "Meeting link" : "Venue / address"}
          </label>
          <input id="location" name="location" required defaultValue={initial?.location} className="input" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="capacity" className="label">Capacity (leave empty for unlimited)</label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            step={1}
            defaultValue={initial?.capacity}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="price" className="label">Ticket price (USD)</label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial?.price}
            placeholder="0 = free"
            className="input"
          />
          <p className="mt-1 text-xs text-slate-500">
            Online payments are not enabled yet, so the price is shown for information only.
          </p>
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Submit label={submitLabel} />
    </form>
  );
}
