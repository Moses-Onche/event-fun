import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Sign up" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">Join EventFun to host or attend events.</p>
        <SignUpForm googleEnabled={googleEnabled} />
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
