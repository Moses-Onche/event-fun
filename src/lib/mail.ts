import nodemailer from "nodemailer";
import { SITE_NAME } from "./constants";
import { formatDateUTC } from "./format";

type Mail = { to: string; subject: string; text: string };

async function send({ to, subject, text }: Mail) {
  const from = process.env.EMAIL_FROM ?? `${SITE_NAME} <no-reply@eventfun.example>`;

  if (!process.env.SMTP_HOST) {
    console.log(`[email:dev] to=${to}\nsubject=${subject}\n${text}\n`);
    return;
  }

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transport.sendMail({ from, to, subject, text });
  } catch (err) {
    // Never fail a registration because an email could not be delivered.
    console.error("Email failed to send:", err);
  }
}

type EventInfo = { id: string; title: string; startsAt: Date; location: string };

function eventUrl(id: string) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/events/${id}`;
}

export async function sendRegistrationEmail(
  to: string,
  name: string | null,
  event: EventInfo,
  status: "CONFIRMED" | "WAITLISTED",
) {
  const hello = `Hi ${name ?? "there"},`;
  if (status === "CONFIRMED") {
    await send({
      to,
      subject: `You're registered: ${event.title}`,
      text: `${hello}\n\nYou're confirmed for "${event.title}".\nWhen: ${formatDateUTC(event.startsAt)} UTC\nWhere: ${event.location}\n\nDetails: ${eventUrl(event.id)}\n\nSee you there!\n${SITE_NAME}`,
    });
  } else {
    await send({
      to,
      subject: `You're on the waitlist: ${event.title}`,
      text: `${hello}\n\n"${event.title}" is full right now, so you've been added to the waitlist. We'll email you if a spot opens up.\n\nDetails: ${eventUrl(event.id)}\n\n${SITE_NAME}`,
    });
  }
}

export async function sendPromotionEmail(to: string, name: string | null, event: EventInfo) {
  await send({
    to,
    subject: `A spot opened up: ${event.title}`,
    text: `Hi ${name ?? "there"},\n\nGood news! A spot opened up and you're now confirmed for "${event.title}".\nWhen: ${formatDateUTC(event.startsAt)} UTC\nWhere: ${event.location}\n\nDetails: ${eventUrl(event.id)}\n\n${SITE_NAME}`,
  });
}
