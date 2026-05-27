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
import { updateHoliday, deleteHoliday } from "@/lib/queries/holidays";
import { isValidDateString } from "@/lib/helpers/date";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse("ID không hợp lệ");

    const body = (await request.json()) as { date?: string; name?: string };

    if (!body.date || !body.name?.trim()) {
      return errorResponse("Thiếu ngày hoặc tên ngày lễ");
    }

    if (!isValidDateString(body.date)) {
      return errorResponse("Định dạng ngày không hợp lệ (yyyy-MM-dd)");
    }

    await updateHoliday(id, body.date, body.name.trim());
    return successResponse({ id });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse("ID không hợp lệ");

    await deleteHoliday(id);
    return successResponse({ id });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}
