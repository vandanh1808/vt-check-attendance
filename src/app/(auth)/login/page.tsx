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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            VT
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            VT Check Attendance
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Đăng nhập để xem chấm công
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
