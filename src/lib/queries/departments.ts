import { getAttendancePool } from "@/lib/db";
import type { Department } from "@/types";

const ALL_DEPARTMENTS_QUERY = `
  SELECT
    MaPhongBan  AS maPhongBan,
    TenPhongBan AS tenPhongBan
  FROM PHONGBAN
  ORDER BY TenPhongBan
`;

export async function getAllDepartments(): Promise<Department[]> {
  const pool = await getAttendancePool();
  const result = await pool
    .request()
    .query<Department>(ALL_DEPARTMENTS_QUERY);

  return result.recordset;
}
