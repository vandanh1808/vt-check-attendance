import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["No./ STT", "Staff code/ Mã nhân viên", "Name/ Tên", "Địa chỉ email"],
    [1, "VT0001", "NGUYỄN VĂN A", "nguyen.vana@company.com"],
    [2, "VT0002", "TRẦN THỊ B", "tran.thib@company.com"],
  ]);

  ws["!cols"] = [{ wch: 10 }, { wch: 26 }, { wch: 24 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, "Email");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const uint8 = new Uint8Array(buf);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="bulk-accounts-template.xlsx"',
    },
  });
}
