import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { isValidDateString } from "@/lib/helpers/date";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/helpers/api-response";
import {
  getEmployeeAttendance,
  getAdminAttendance,
} from "@/lib/queries/attendance";

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

    if (session.user.role === ROLES.ADMIN) {
      const maNhanVienList = searchParams.getAll("maNhanVien").filter(Boolean);
      const maPhongBan = searchParams.get("maPhongBan") ?? undefined;

      const records = await getAdminAttendance(
        fromDate,
        toDate,
        maNhanVienList.length > 0 ? maNhanVienList : undefined,
        maPhongBan,
      );
      return successResponse(records);
    }

    if (!session.user.maNhanVien) {
      return errorResponse("Tài khoản chưa liên kết mã nhân viên");
    }

    const records = await getEmployeeAttendance(
      session.user.maNhanVien,
      fromDate,
      toDate,
    );
    return successResponse(records);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
