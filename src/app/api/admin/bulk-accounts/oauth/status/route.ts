import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/helpers/api-response";
import { getOAuthToken, clearOAuthToken } from "@/lib/helpers/oauth-cookie";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorizedResponse();
  if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

  const token = await getOAuthToken();

  if (!token) {
    return successResponse({ authenticated: false });
  }

  return successResponse({
    authenticated: true,
    email: token.email,
    name: token.name,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorizedResponse();
  if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

  await clearOAuthToken();
  return successResponse({ message: "Đã đăng xuất" });
}
