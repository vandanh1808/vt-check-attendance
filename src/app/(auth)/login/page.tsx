import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES, ROUTES } from "@/lib/constants";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const isAdmin = session.user?.role === ROLES.ADMIN;
    redirect(isAdmin ? ROUTES.ADMIN_ATTENDANCE : ROUTES.DASHBOARD);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 text-lg font-bold text-white shadow-lg shadow-indigo-500/25">
            VT
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            VT Check Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đăng nhập để xem chấm công
          </p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200/60">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
