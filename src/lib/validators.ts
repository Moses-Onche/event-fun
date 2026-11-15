import { z } from "zod";
import { CATEGORIES } from "./constants";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");

// bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.");

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["ATTENDEE", "ORGANIZER"]),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short.").max(120),
    description: z.string().trim().min(10, "Add a longer description.").max(5000),
    category: z.enum(CATEGORIES),
    // ISO strings are produced client-side so the user's timezone is respected.
    startsAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid start date and time.")
      .transform((v) => new Date(v)),
    endsAt: optionalText.refine(
      (v) => v === undefined || !Number.isNaN(Date.parse(v)),
      "Enter a valid end date and time.",
    ),
    locationType: z.enum(["PHYSICAL", "ONLINE"]),
    location: z.string().trim().min(2, "Add a location or meeting link.").max(300),
    coverImageUrl: optionalText.refine(
      (v) => v === undefined || /^https?:\/\//i.test(v),
      "Cover image must be an http(s) URL.",
    ),
    capacity: optionalText
      .refine((v) => v === undefined || /^\d+$/.test(v), "Capacity must be a whole number.")
      .transform((v) => (v === undefined ? null : parseInt(v, 10)))
      .refine((v) => v === null || v >= 1, "Capacity must be at least 1."),
    price: optionalText
      .refine(
        (v) => v === undefined || (!Number.isNaN(Number(v)) && Number(v) >= 0),
        "Price must be 0 or more.",
      )
      .transform((v) => (v === undefined ? 0 : Math.round(Number(v) * 100))),
  })
  .refine((d) => !d.endsAt || new Date(d.endsAt) > d.startsAt, {
    message: "End time must be after the start time.",
    path: ["endsAt"],
  });

export type EventInput = z.infer<typeof eventSchema>;
