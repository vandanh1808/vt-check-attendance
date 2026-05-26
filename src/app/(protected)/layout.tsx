import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import ProtectedShell from "./ProtectedShell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <ProtectedShell
      userName={session.user.tenNhanVien}
      userRole={session.user.role}
    >
      {children}
    </ProtectedShell>
  );
}
