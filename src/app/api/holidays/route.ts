import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/helpers/api-response";
import { getHolidayDates } from "@/lib/queries/holidays";
import { isValidDateString } from "@/lib/helpers/date";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!fromDate || !toDate) {
      return errorResponse("Thiếu tham số fromDate hoặc toDate");
    }
    if (!isValidDateString(fromDate) || !isValidDateString(toDate)) {
      return errorResponse("Định dạng ngày không hợp lệ (yyyy-MM-dd)");
    }

    const dates = await getHolidayDates(fromDate, toDate);
    return successResponse(dates);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
