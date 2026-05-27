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
import { isValidDateString } from "@/lib/helpers/date";
import { getHolidayDates } from "@/lib/queries/holidays";
import {
  getTodayOverview,
  getDeptStats,
  getEmployeeRankings,
  getDailyTrend,
  getOvertimeRankings,
  getWorkingHoursStats,
  getEarlyLeaveRankings,
  getWeekdayPattern,
} from "@/lib/queries/statistics";

function countWorkdays(from: string, to: string, holidays: string[]): number {
  const holidaySet = new Set(holidays);
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const current = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  let count = 0;
  while (current <= end) {
    const day = current.getDay();
    const str = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    if (day !== 0 && day !== 6 && !holidaySet.has(str)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const lateThreshold = searchParams.get("lateThreshold") ?? "08:00";
    const today = new Date().toISOString().split("T")[0];

    if (!fromDate || !toDate) {
      return errorResponse("Thiếu tham số fromDate hoặc toDate");
    }
    if (!isValidDateString(fromDate) || !isValidDateString(toDate)) {
      return errorResponse("Định dạng ngày không hợp lệ (yyyy-MM-dd)");
    }

    const overtimeAfter = searchParams.get("overtimeAfter") ?? "17:00";
    const earlyBefore = searchParams.get("earlyBefore") ?? "17:00";

    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(lateThreshold)) {
      return errorResponse("Định dạng giờ trễ không hợp lệ (HH:mm)");
    }
    if (!timeRegex.test(overtimeAfter)) {
      return errorResponse("Định dạng giờ tăng ca không hợp lệ (HH:mm)");
    }
    if (!timeRegex.test(earlyBefore)) {
      return errorResponse("Định dạng giờ về sớm không hợp lệ (HH:mm)");
    }

    const holidays = await getHolidayDates(fromDate, toDate);
    const workdays = countWorkdays(fromDate, toDate, holidays);

    const [overview, deptStats, rankings, trend, overtime, workingHours, earlyLeave, weekday] = await Promise.all([
      getTodayOverview(today, lateThreshold, fromDate, toDate),
      getDeptStats(fromDate, toDate, workdays, lateThreshold),
      getEmployeeRankings(fromDate, toDate, workdays, lateThreshold),
      getDailyTrend(fromDate, toDate, lateThreshold),
      getOvertimeRankings(fromDate, toDate, overtimeAfter),
      getWorkingHoursStats(fromDate, toDate),
      getEarlyLeaveRankings(fromDate, toDate, earlyBefore),
      getWeekdayPattern(fromDate, toDate, lateThreshold),
    ]);

    return successResponse({
      overview,
      deptStats,
      rankings,
      trend,
      overtime,
      workingHours,
      earlyLeave,
      weekday,
      meta: { fromDate, toDate, workdays, holidays: holidays.length },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
