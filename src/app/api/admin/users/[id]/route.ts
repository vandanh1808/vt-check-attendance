import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/helpers/api-response";
import { updateUser, deleteUser } from "@/lib/queries/users";
import type { UpdateUserPayload } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) return errorResponse("ID không hợp lệ");

    const body = (await request.json()) as UpdateUserPayload;
    await updateUser(userId, body);

    return successResponse({ message: "Cập nhật thành công" });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) return errorResponse("ID không hợp lệ");

    await deleteUser(userId);

    return successResponse({ message: "Xóa thành công" });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}
