import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/helpers/api-response";
import { verifyPassword, updateUser } from "@/lib/queries/users";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!body.currentPassword || !body.newPassword) {
      return errorResponse("Vui lòng nhập đầy đủ thông tin");
    }

    if (body.newPassword.length < 6) {
      return errorResponse("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    const userId = Number(session.user.id);
    const isValid = await verifyPassword(userId, body.currentPassword);
    if (!isValid) {
      return errorResponse("Mật khẩu hiện tại không đúng");
    }

    await updateUser(userId, { password: body.newPassword });

    return successResponse({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
