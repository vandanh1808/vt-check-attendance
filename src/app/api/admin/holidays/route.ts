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
import { getHolidays, createHoliday } from "@/lib/queries/holidays";
import { isValidDateString } from "@/lib/helpers/date";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const holidays = await getHolidays(year ? parseInt(year, 10) : undefined);
    return successResponse(holidays);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const body = (await request.json()) as { date?: string; name?: string };

    if (!body.date || !body.name?.trim()) {
      return errorResponse("Thiếu ngày hoặc tên ngày lễ");
    }

    if (!isValidDateString(body.date)) {
      return errorResponse("Định dạng ngày không hợp lệ (yyyy-MM-dd)");
    }

    const id = await createHoliday(body.date, body.name.trim());
    return successResponse({ id }, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}
