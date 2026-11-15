# EventFun

EventFun is a web app for discovering, hosting and registering for events.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Auth.js (NextAuth v4)

## Features

- **Sign up / sign in** with email and password, plus optional Google sign-in
- **Email verification**: new password accounts must confirm their email before they can sign in (links expire after 24 hours, and can be re-sent)
- **Password reset** by email (links are single-use and expire after 1 hour); resetting signs the account out everywhere else
- **Three roles**
  - **Attendee**: browse events, register, cancel, join waitlists
  - **Organizer**: create, edit and delete their own events; see attendees and waitlists
  - **Admin**: hide/unhide or delete any event, suspend users, change roles
- **Events** with title, description, category, start/end time, in-person or online location, cover image, capacity and price
- **Registration rules**: instant confirmation, capacity limit with automatic waitlist, cancellation (the longest-waiting person is promoted and emailed)
- **Browse page** with search, category and date filters
- **Confirmation emails** (registration, waitlist, waitlist promotion)

## Getting started

Requires Node.js 18.18+ and a PostgreSQL database.

```bash
git clone https://github.com/Moses-Onche/event-fun.git
cd event-fun
npm install

cp .env.example .env      # then edit the values
npx prisma migrate dev --name init
npm run db:seed           # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public site URL (`http://localhost:3000` locally) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. Enables the Google button |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Optional. Without `SMTP_HOST`, emails are printed to the server console |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the seed script to create the admin |

For Google sign-in, add `http://localhost:3000/api/auth/callback/google` (and your production equivalent) as an authorized redirect URI.

### Upgrading an existing database

The email verification and password reset update adds a table and a column. Run the migration, then re-run the seed so the admin account counts as verified:

```bash
npx prisma migrate dev --name email-verification   # production: npx prisma migrate deploy
npm run db:seed
```

Accounts created before this update have no verified email, so those people will see a "confirm your email" message when they sign in. They can use **Send a new link** on that message (or `/resend-verification`) to confirm, or use **Forgot password?**, which also confirms the email. Google accounts are already treated as verified.

Without `SMTP_HOST`, verification and reset links are printed in the server console, which is handy for local development.

## Deploying to Vercel

1. Create a hosted PostgreSQL database (Neon, Supabase, Vercel Postgres, etc.).
2. Import the repo in Vercel and set the environment variables above (`NEXTAUTH_URL` = your production URL).
3. Run migrations against the production database once: `DATABASE_URL=... npx prisma migrate deploy`, then seed the admin with `npm run db:seed`.

## Design notes and known limitations

- **Payments are not enabled.** Prices are stored and displayed (`priceCents`, `currency`), but registration never charges anyone. Stripe can be added in `src/app/actions/registrations.ts`.
- **Roles are separate.** Only attendee accounts can register; organizer and admin accounts cannot. Attendees can upgrade themselves to organizer from the dashboard. Admins are created only via the seed script or by another admin.
- **Google accounts link to existing accounts by email**, but only when Google reports the email as verified. If a password account for that email was never verified, its password is removed and its sessions end, so someone who pre-registered another person's email can't keep access.
- **Verification and reset are rate-limited per account**: at most one email of each kind per minute. There is no per-IP rate limiting yet, so put the site behind a CDN or WAF rate limit for production.
- **Resetting a password signs out other sessions**, but changing it from inside the app is not built yet.
- **Cover images are URLs**, not uploads.
- Times are entered in the organizer's local timezone and shown in each viewer's local timezone. Emails show times in UTC.
- The code was written without running a build in the authoring environment, so expect to fix small type or lint issues on the first `npm run build`.
