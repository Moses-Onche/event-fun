import "next-auth";
import "next-auth/jwt";

type AppRole = "ATTENDEE" | "ORGANIZER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: AppRole;
      active: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    active?: boolean;
  }
}
