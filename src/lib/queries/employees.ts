import { getAttendancePool } from "@/lib/db";
import type { NhanVien } from "@/types";

const SEARCH_EMPLOYEES_QUERY = `
  SELECT TOP 20
    nv.MaNhanVien   AS maNhanVien,
    nv.TenNhanVien  AS tenNhanVien,
    nv.MaChamCong   AS maChamCong,
    nv.MaPhongBan   AS maPhongBan,
    pb.TenPhongBan  AS tenPhongBan,
    nv.ChucVu       AS chucVu
  FROM NHANVIEN nv
  LEFT JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
  WHERE @searchTerm IS NULL
    OR nv.MaNhanVien LIKE '%' + @searchTerm + '%'
    OR nv.TenNhanVien LIKE '%' + @searchTerm + '%'
  ORDER BY nv.TenNhanVien
`;

export async function searchEmployees(
  searchTerm?: string,
): Promise<NhanVien[]> {
  const pool = await getAttendancePool();
  const result = await pool
    .request()
    .input("searchTerm", searchTerm ?? null)
    .query<NhanVien>(SEARCH_EMPLOYEES_QUERY);

  return result.recordset;
}

const FIND_EMPLOYEE_QUERY = `
  SELECT
    nv.MaNhanVien   AS maNhanVien,
    nv.TenNhanVien  AS tenNhanVien,
    nv.MaChamCong   AS maChamCong,
    nv.MaPhongBan   AS maPhongBan,
    pb.TenPhongBan  AS tenPhongBan,
    nv.ChucVu       AS chucVu
  FROM NHANVIEN nv
  LEFT JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
  WHERE nv.MaNhanVien = @maNhanVien
`;

export async function findEmployeeByCode(
  maNhanVien: string,
): Promise<NhanVien | null> {
  const pool = await getAttendancePool();
  const result = await pool
    .request()
    .input("maNhanVien", maNhanVien)
    .query<NhanVien>(FIND_EMPLOYEE_QUERY);

  return result.recordset[0] ?? null;
}

export async function findEmployeesByCodes(
  codes: string[],
): Promise<NhanVien[]> {
  if (codes.length === 0) return [];

  const pool = await getAttendancePool();
  const request = pool.request();

  const conditions = codes.map((code, i) => {
    const param = `code${i}`;
    request.input(param, code);
    return `@${param}`;
  });

  const query = `
    SELECT
      nv.MaNhanVien   AS maNhanVien,
      nv.TenNhanVien  AS tenNhanVien,
      nv.MaChamCong   AS maChamCong,
      nv.MaPhongBan   AS maPhongBan,
      pb.TenPhongBan  AS tenPhongBan,
      nv.ChucVu       AS chucVu
    FROM NHANVIEN nv
    LEFT JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
    WHERE nv.MaNhanVien IN (${conditions.join(", ")})
  `;

  const result = await request.query<NhanVien>(query);
  return result.recordset;
}
