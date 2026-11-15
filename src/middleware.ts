import { withAuth } from "next-auth/middleware";

// Pages that need a signed-in user. Role checks happen on the server in each
// page and action (see src/lib/session.ts), which is the authoritative layer.
export default withAuth({
  pages: { signIn: "/signin" },
});

export const config = {
  matcher: ["/dashboard/:path*", "/events/new", "/events/:id/edit", "/admin/:path*"],
};
