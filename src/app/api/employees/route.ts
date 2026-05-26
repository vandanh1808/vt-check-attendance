import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/helpers/api-response";
import {
  searchEmployees,
  findEmployeeByCode,
} from "@/lib/queries/employees";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") ?? undefined;
    const maNhanVien = searchParams.get("maNhanVien");

    if (maNhanVien) {
      const employee = await findEmployeeByCode(maNhanVien);
      return successResponse(employee);
    }

    const employees = await searchEmployees(searchTerm);
    return successResponse(employees);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
