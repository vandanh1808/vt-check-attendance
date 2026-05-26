import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await getRequiredSession();
  if (session.user.role !== ROLES.ADMIN) {
    throw new Error("Forbidden");
  }
  return session;
}
