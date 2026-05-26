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
import { getAllUsers, createUser } from "@/lib/queries/users";
import { findEmployeeByCode } from "@/lib/queries/employees";
import type { CreateUserPayload } from "@/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const users = await getAllUsers();
    return successResponse(users);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const body = (await request.json()) as Partial<CreateUserPayload>;

    if (!body.maNhanVien || !body.email || !body.password || !body.tenNhanVien) {
      return errorResponse("Thiếu thông tin bắt buộc");
    }

    if (body.password.length < 6) {
      return errorResponse("Mật khẩu phải có ít nhất 6 ký tự");
    }

    const employee = await findEmployeeByCode(body.maNhanVien);
    if (!employee) {
      return errorResponse(
        `Mã nhân viên "${body.maNhanVien}" không tồn tại trong hệ thống chấm công`,
      );
    }

    const id = await createUser({
      maNhanVien: body.maNhanVien,
      tenNhanVien: body.tenNhanVien,
      email: body.email,
      password: body.password,
      role: body.role ?? "employee",
    });

    return successResponse({ id }, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}
