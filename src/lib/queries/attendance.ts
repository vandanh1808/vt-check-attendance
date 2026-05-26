import { getAttendancePool } from "@/lib/db";
import type { AttendanceRecord, EmployeeAttendanceRecord } from "@/types";

const EMPLOYEE_ATTENDANCE_QUERY = `
  SELECT
    CONVERT(VARCHAR(10), c.NgayCham, 120)                              AS attendanceDate,
    CONVERT(VARCHAR(8), MIN(c.GioCham), 108)                           AS checkIn,
    CASE WHEN COUNT(*) > 1 THEN CONVERT(VARCHAR(8), MAX(c.GioCham), 108) ELSE NULL END AS checkOut,
    c.TenMay                                                           AS tenMay
  FROM CheckInOut c
  INNER JOIN NHANVIEN nv ON c.MaChamCong = nv.MaChamCong
  WHERE nv.MaNhanVien = @maNhanVien
    AND CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
  GROUP BY CONVERT(VARCHAR(10), c.NgayCham, 120), c.TenMay
  ORDER BY attendanceDate ASC
`;

export async function getEmployeeAttendance(
  maNhanVien: string,
  fromDate: string,
  toDate: string,
): Promise<AttendanceRecord[]> {
  const pool = await getAttendancePool();
  const result = await pool
    .request()
    .input("maNhanVien", maNhanVien)
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .query<AttendanceRecord>(EMPLOYEE_ATTENDANCE_QUERY);

  return result.recordset;
}

export async function getAdminAttendance(
  fromDate: string,
  toDate: string,
  maNhanVienList?: string[],
  maPhongBan?: string,
): Promise<EmployeeAttendanceRecord[]> {
  const pool = await getAttendancePool();
  const request = pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .input("maPhongBan", maPhongBan ?? null);

  let employeeFilter = "";
  if (maNhanVienList && maNhanVienList.length > 0) {
    const conditions = maNhanVienList.map((code, i) => {
      const paramName = `nv${i}`;
      request.input(paramName, code);
      return `@${paramName}`;
    });
    employeeFilter = `AND nv.MaNhanVien IN (${conditions.join(", ")})`;
  }

  const query = `
    SELECT
      nv.MaNhanVien                                                      AS maNhanVien,
      nv.TenNhanVien                                                     AS tenNhanVien,
      pb.TenPhongBan                                                     AS phongBan,
      CONVERT(VARCHAR(10), c.NgayCham, 120)                              AS attendanceDate,
      CONVERT(VARCHAR(8), MIN(c.GioCham), 108)                           AS checkIn,
      CASE WHEN COUNT(*) > 1 THEN CONVERT(VARCHAR(8), MAX(c.GioCham), 108) ELSE NULL END AS checkOut,
      c.TenMay                                                           AS tenMay
    FROM CheckInOut c
    INNER JOIN NHANVIEN nv ON c.MaChamCong = nv.MaChamCong
    LEFT JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
    WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
      ${employeeFilter}
      AND (@maPhongBan IS NULL OR nv.MaPhongBan = @maPhongBan)
    GROUP BY nv.MaNhanVien, nv.TenNhanVien, pb.TenPhongBan,
             CONVERT(VARCHAR(10), c.NgayCham, 120), c.TenMay
    ORDER BY nv.TenNhanVien, attendanceDate ASC
  `;

  const result = await request.query<EmployeeAttendanceRecord>(query);
  return result.recordset;
}
