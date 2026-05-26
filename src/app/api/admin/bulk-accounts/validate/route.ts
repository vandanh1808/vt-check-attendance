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
import { parseExcelBuffer } from "@/lib/excel/parser";
import { findEmployeesByCodes } from "@/lib/queries/employees";
import { findRegisteredCodes } from "@/lib/queries/users";
import type { BulkAccountRow, BulkRowStatus } from "@/types";

const COLUMN_KEYWORDS: Record<string, string[]> = {
  maNhanVien: ["mã nhân viên", "ma nhan vien", "staff code", "manhanvien"],
  email: ["email", "địa chỉ email", "mail"],
};

function findColumn(
  headers: string[],
  keywords: string[],
): string | undefined {
  return headers.find((h) => {
    const lower = h.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorizedResponse();
    if (session.user.role !== ROLES.ADMIN) return forbiddenResponse();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("Vui lòng chọn file Excel");
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseExcelBuffer(buffer);

    if (parsed.rowCount === 0) {
      return errorResponse("File không có dữ liệu");
    }

    const codeCol = findColumn(parsed.headers, COLUMN_KEYWORDS.maNhanVien);
    if (!codeCol) {
      return errorResponse(
        'File thiếu cột "Mã nhân viên". Vui lòng tải template mẫu.',
      );
    }

    const emailCol = findColumn(parsed.headers, COLUMN_KEYWORDS.email);

    const rawRows = parsed.rows
      .map((row) => ({
        maNhanVien: row[codeCol]?.trim() ?? "",
        email: emailCol ? row[emailCol]?.trim() ?? "" : "",
      }))
      .filter((r) => r.maNhanVien !== "");

    if (rawRows.length === 0) {
      return errorResponse("Không tìm thấy nhân viên nào trong file");
    }

    const codes = rawRows.map((r) => r.maNhanVien);
    const [employees, registeredCodes] = await Promise.all([
      findEmployeesByCodes(codes),
      findRegisteredCodes(codes),
    ]);

    const employeeMap = new Map(
      employees.map((e) => [e.maNhanVien, e.tenNhanVien]),
    );
    const registeredSet = new Set(registeredCodes);

    const rows: BulkAccountRow[] = rawRows.map((raw) => {
      const found = employeeMap.has(raw.maNhanVien);
      const duplicate = registeredSet.has(raw.maNhanVien);
      const hasEmail = raw.email !== "";

      let status: BulkRowStatus;
      if (!found) status = "not_found";
      else if (duplicate) status = "duplicate";
      else if (!hasEmail) status = "missing_email";
      else status = "ready";

      return {
        id: crypto.randomUUID(),
        maNhanVien: raw.maNhanVien,
        tenNhanVien: employeeMap.get(raw.maNhanVien) ?? "",
        email: raw.email,
        status,
      };
    });

    return successResponse({ rows });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
