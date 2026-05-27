import { getAttendancePool } from "@/lib/db";

export interface TodayOverview {
  totalEmployees: number;
  checkedIn: number;
  notCheckedIn: number;
  lateCount: number;
  lateThreshold: string;
}

export interface DeptStats {
  maPhongBan: string;
  tenPhongBan: string;
  totalEmployees: number;
  presentDays: number;
  totalWorkdays: number;
  attendanceRate: number;
  lateCount: number;
  avgCheckInMinutes: number;
}

export interface EmployeeRanking {
  maNhanVien: string;
  tenNhanVien: string;
  tenPhongBan: string | null;
  absentDays: number;
  lateDays: number;
  presentDays: number;
  totalWorkdays: number;
  attendanceRate: number;
}

export interface DailyTrend {
  date: string;
  presentCount: number;
  totalEmployees: number;
  lateCount: number;
}

export interface OvertimeEmployee {
  maNhanVien: string;
  tenNhanVien: string;
  tenPhongBan: string | null;
  overtimeDays: number;
  totalOvertimeMinutes: number;
}

export interface DeptOvertime {
  tenPhongBan: string;
  overtimeDays: number;
  totalOvertimeMinutes: number;
  employeeCount: number;
}

export interface DeptWorkingHours {
  tenPhongBan: string;
  avgWorkingMinutes: number;
  minWorkingMinutes: number;
  maxWorkingMinutes: number;
}

export interface EarlyLeaveEmployee {
  maNhanVien: string;
  tenNhanVien: string;
  tenPhongBan: string | null;
  earlyLeaveDays: number;
  avgCheckOutMinutes: number;
}

export interface WeekdayPattern {
  dayOfWeek: number;
  dayName: string;
  presentCount: number;
  lateCount: number;
  avgCount: number;
}

export async function getTodayOverview(
  today: string,
  lateThreshold: string,
  fromDate: string,
  toDate: string,
): Promise<TodayOverview> {
  const pool = await getAttendancePool();

  const totalRes = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .query(`
      SELECT COUNT(DISTINCT nv.MaNhanVien) AS cnt
      FROM CheckInOut c
      INNER JOIN NHANVIEN nv ON c.MaChamCong = nv.MaChamCong
      WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
    `);
  const totalEmployees = totalRes.recordset[0].cnt;

  const result = await pool
    .request()
    .input("today", today)
    .input("threshold", lateThreshold)
    .query(`
      SELECT
        COUNT(DISTINCT MaNhanVien) AS checkedIn,
        SUM(CASE WHEN firstIn > @threshold THEN 1 ELSE 0 END) AS lateCount
      FROM (
        SELECT
          nv.MaNhanVien,
          CONVERT(VARCHAR(5), MIN(c.GioCham), 108) AS firstIn
        FROM CheckInOut c
        INNER JOIN NHANVIEN nv ON c.MaChamCong = nv.MaChamCong
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) = @today
        GROUP BY nv.MaNhanVien
      ) t
    `);

  const checkedIn = result.recordset[0].checkedIn ?? 0;
  const lateCount = result.recordset[0].lateCount ?? 0;

  return {
    totalEmployees,
    checkedIn,
    notCheckedIn: totalEmployees - checkedIn,
    lateCount,
    lateThreshold,
  };
}

export async function getDeptStats(
  fromDate: string,
  toDate: string,
  workdays: number,
  lateThreshold: string,
): Promise<DeptStats[]> {
  const pool = await getAttendancePool();

  const empCountRes = await pool
    .request()
    .input("fromDate2", fromDate)
    .input("toDate2", toDate)
    .query(`
      SELECT nv.MaPhongBan AS maPhongBan, pb.TenPhongBan AS tenPhongBan,
             COUNT(DISTINCT nv.MaNhanVien) AS totalEmployees
      FROM NHANVIEN nv
      INNER JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
      INNER JOIN CheckInOut c ON c.MaChamCong = nv.MaChamCong
      WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate2 AND @toDate2
      GROUP BY nv.MaPhongBan, pb.TenPhongBan
    `);

  const attRes = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .input("threshold", lateThreshold)
    .query(`
      SELECT
        nv.MaPhongBan AS maPhongBan,
        COUNT(DISTINCT CAST(nv.MaNhanVien AS VARCHAR) + '-' + t.ngay) AS presentDays,
        SUM(CASE WHEN t.firstIn > @threshold THEN 1 ELSE 0 END) AS lateCount,
        AVG(t.firstInMinutes) AS avgCheckInMinutes
      FROM (
        SELECT
          c.MaChamCong,
          CONVERT(VARCHAR(10), c.NgayCham, 120) AS ngay,
          CONVERT(VARCHAR(5), MIN(c.GioCham), 108) AS firstIn,
          DATEPART(HOUR, MIN(c.GioCham)) * 60 + DATEPART(MINUTE, MIN(c.GioCham)) AS firstInMinutes
        FROM CheckInOut c
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
        GROUP BY c.MaChamCong, CONVERT(VARCHAR(10), c.NgayCham, 120)
      ) t
      INNER JOIN NHANVIEN nv ON t.MaChamCong = nv.MaChamCong
      WHERE nv.MaPhongBan IS NOT NULL
      GROUP BY nv.MaPhongBan
    `);

  const attMap = new Map<string, { presentDays: number; lateCount: number; avgCheckInMinutes: number }>();
  for (const r of attRes.recordset) {
    attMap.set(r.maPhongBan, {
      presentDays: r.presentDays ?? 0,
      lateCount: r.lateCount ?? 0,
      avgCheckInMinutes: r.avgCheckInMinutes ?? 0,
    });
  }

  return empCountRes.recordset.map((r: Record<string, unknown>) => {
    const dept = r.maPhongBan as string;
    const empCount = r.totalEmployees as number;
    const att = attMap.get(dept) ?? { presentDays: 0, lateCount: 0, avgCheckInMinutes: 0 };
    const totalWorkdays = empCount * workdays;
    return {
      maPhongBan: dept,
      tenPhongBan: r.tenPhongBan as string,
      totalEmployees: empCount,
      presentDays: att.presentDays,
      totalWorkdays,
      attendanceRate: totalWorkdays > 0 ? att.presentDays / totalWorkdays : 0,
      lateCount: att.lateCount,
      avgCheckInMinutes: att.avgCheckInMinutes,
    };
  });
}

export async function getEmployeeRankings(
  fromDate: string,
  toDate: string,
  workdays: number,
  lateThreshold: string,
  limit: number = 10,
): Promise<{ mostAbsent: EmployeeRanking[]; mostLate: EmployeeRanking[] }> {
  const pool = await getAttendancePool();

  const result = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .input("threshold", lateThreshold)
    .query(`
      SELECT
        nv.MaNhanVien AS maNhanVien,
        nv.TenNhanVien AS tenNhanVien,
        pb.TenPhongBan AS tenPhongBan,
        COUNT(DISTINCT t.ngay) AS presentDays,
        SUM(CASE WHEN t.firstIn > @threshold THEN 1 ELSE 0 END) AS lateDays
      FROM NHANVIEN nv
      LEFT JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
      LEFT JOIN (
        SELECT
          c.MaChamCong,
          CONVERT(VARCHAR(10), c.NgayCham, 120) AS ngay,
          CONVERT(VARCHAR(5), MIN(c.GioCham), 108) AS firstIn
        FROM CheckInOut c
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
        GROUP BY c.MaChamCong, CONVERT(VARCHAR(10), c.NgayCham, 120)
      ) t ON t.MaChamCong = nv.MaChamCong
      WHERE nv.MaChamCong IS NOT NULL
      GROUP BY nv.MaNhanVien, nv.TenNhanVien, pb.TenPhongBan
    `);

  function mapRow(r: Record<string, unknown>): EmployeeRanking {
    const present = (r.presentDays as number) ?? 0;
    return {
      maNhanVien: r.maNhanVien as string,
      tenNhanVien: r.tenNhanVien as string,
      tenPhongBan: (r.tenPhongBan as string) ?? null,
      presentDays: present,
      absentDays: Math.max(0, workdays - present),
      lateDays: (r.lateDays as number) ?? 0,
      totalWorkdays: workdays,
      attendanceRate: workdays > 0 ? present / workdays : 0,
    };
  }

  const all = result.recordset.map(mapRow).filter((e) => e.presentDays > 0);

  const mostAbsent = [...all]
    .sort((a, b) => a.presentDays - b.presentDays)
    .slice(0, limit);

  const mostLate = [...all]
    .filter((e) => e.lateDays > 0)
    .sort((a, b) => b.lateDays - a.lateDays)
    .slice(0, limit);

  return { mostAbsent, mostLate };
}

export async function getDailyTrend(
  fromDate: string,
  toDate: string,
  lateThreshold: string,
): Promise<DailyTrend[]> {
  const pool = await getAttendancePool();

  const result = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .input("threshold", lateThreshold)
    .query(`
      SELECT
        t.ngay AS date,
        COUNT(DISTINCT t.MaChamCong) AS presentCount,
        SUM(CASE WHEN t.firstIn > @threshold THEN 1 ELSE 0 END) AS lateCount
      FROM (
        SELECT
          c.MaChamCong,
          CONVERT(VARCHAR(10), c.NgayCham, 120) AS ngay,
          CONVERT(VARCHAR(5), MIN(c.GioCham), 108) AS firstIn
        FROM CheckInOut c
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
        GROUP BY c.MaChamCong, CONVERT(VARCHAR(10), c.NgayCham, 120)
      ) t
      GROUP BY t.ngay
      ORDER BY t.ngay
    `);

  const totalActive = result.recordset.length > 0
    ? Math.max(...result.recordset.map((r: Record<string, unknown>) => (r.presentCount as number) ?? 0))
    : 0;

  return result.recordset.map((r: Record<string, unknown>) => ({
    date: r.date as string,
    presentCount: (r.presentCount as number) ?? 0,
    totalEmployees: totalActive,
    lateCount: (r.lateCount as number) ?? 0,
  }));
}

export async function getOvertimeRankings(
  fromDate: string,
  toDate: string,
  overtimeAfter: string,
  limit: number = 10,
): Promise<{ employees: OvertimeEmployee[]; departments: DeptOvertime[] }> {
  const pool = await getAttendancePool();

  const result = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .input("overtimeAfter", overtimeAfter)
    .query(`
      SELECT
        nv.MaNhanVien AS maNhanVien,
        nv.TenNhanVien AS tenNhanVien,
        pb.TenPhongBan AS tenPhongBan,
        COUNT(DISTINCT t.ngay) AS overtimeDays,
        SUM(t.extraMinutes) AS totalOvertimeMinutes
      FROM (
        SELECT
          c.MaChamCong,
          CONVERT(VARCHAR(10), c.NgayCham, 120) AS ngay,
          MAX(c.GioCham) AS lastOut,
          DATEDIFF(MINUTE,
            CAST(CONVERT(VARCHAR(10), c.NgayCham, 120) + ' ' + @overtimeAfter AS DATETIME),
            MAX(c.GioCham)
          ) AS extraMinutes
        FROM CheckInOut c
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
        GROUP BY c.MaChamCong, CONVERT(VARCHAR(10), c.NgayCham, 120)
        HAVING MAX(c.GioCham) > CAST(CONVERT(VARCHAR(10), c.NgayCham, 120) + ' ' + @overtimeAfter AS DATETIME)
      ) t
      INNER JOIN NHANVIEN nv ON t.MaChamCong = nv.MaChamCong
      LEFT JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
      GROUP BY nv.MaNhanVien, nv.TenNhanVien, pb.TenPhongBan
    `);

  const employees: OvertimeEmployee[] = result.recordset
    .map((r: Record<string, unknown>) => ({
      maNhanVien: r.maNhanVien as string,
      tenNhanVien: r.tenNhanVien as string,
      tenPhongBan: (r.tenPhongBan as string) ?? null,
      overtimeDays: (r.overtimeDays as number) ?? 0,
      totalOvertimeMinutes: (r.totalOvertimeMinutes as number) ?? 0,
    }))
    .sort((a, b) => b.totalOvertimeMinutes - a.totalOvertimeMinutes)
    .slice(0, limit);

  const deptMap = new Map<string, DeptOvertime>();
  for (const r of result.recordset) {
    const dept = (r.tenPhongBan as string) ?? "Không rõ";
    const existing = deptMap.get(dept);
    if (existing) {
      existing.overtimeDays += (r.overtimeDays as number) ?? 0;
      existing.totalOvertimeMinutes += (r.totalOvertimeMinutes as number) ?? 0;
      existing.employeeCount += 1;
    } else {
      deptMap.set(dept, {
        tenPhongBan: dept,
        overtimeDays: (r.overtimeDays as number) ?? 0,
        totalOvertimeMinutes: (r.totalOvertimeMinutes as number) ?? 0,
        employeeCount: 1,
      });
    }
  }
  const departments = [...deptMap.values()].sort((a, b) => b.totalOvertimeMinutes - a.totalOvertimeMinutes);

  return { employees, departments };
}

export async function getWorkingHoursStats(
  fromDate: string,
  toDate: string,
): Promise<DeptWorkingHours[]> {
  const pool = await getAttendancePool();

  const result = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .query(`
      SELECT
        pb.TenPhongBan AS tenPhongBan,
        AVG(t.workMinutes) AS avgWorkingMinutes,
        MIN(t.workMinutes) AS minWorkingMinutes,
        MAX(t.workMinutes) AS maxWorkingMinutes
      FROM (
        SELECT
          c.MaChamCong,
          CONVERT(VARCHAR(10), c.NgayCham, 120) AS ngay,
          DATEDIFF(MINUTE, MIN(c.GioCham), MAX(c.GioCham)) AS workMinutes
        FROM CheckInOut c
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
        GROUP BY c.MaChamCong, CONVERT(VARCHAR(10), c.NgayCham, 120)
        HAVING COUNT(*) >= 2
      ) t
      INNER JOIN NHANVIEN nv ON t.MaChamCong = nv.MaChamCong
      INNER JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
      GROUP BY pb.TenPhongBan
    `);

  return result.recordset
    .map((r: Record<string, unknown>) => ({
      tenPhongBan: r.tenPhongBan as string,
      avgWorkingMinutes: (r.avgWorkingMinutes as number) ?? 0,
      minWorkingMinutes: (r.minWorkingMinutes as number) ?? 0,
      maxWorkingMinutes: (r.maxWorkingMinutes as number) ?? 0,
    }))
    .sort((a, b) => b.avgWorkingMinutes - a.avgWorkingMinutes);
}

export async function getEarlyLeaveRankings(
  fromDate: string,
  toDate: string,
  earlyBefore: string,
  limit: number = 10,
): Promise<EarlyLeaveEmployee[]> {
  const pool = await getAttendancePool();

  const result = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .input("earlyBefore", earlyBefore)
    .query(`
      SELECT
        nv.MaNhanVien AS maNhanVien,
        nv.TenNhanVien AS tenNhanVien,
        pb.TenPhongBan AS tenPhongBan,
        COUNT(DISTINCT t.ngay) AS earlyLeaveDays,
        AVG(t.lastOutMinutes) AS avgCheckOutMinutes
      FROM (
        SELECT
          c.MaChamCong,
          CONVERT(VARCHAR(10), c.NgayCham, 120) AS ngay,
          MAX(c.GioCham) AS lastOut,
          DATEPART(HOUR, MAX(c.GioCham)) * 60 + DATEPART(MINUTE, MAX(c.GioCham)) AS lastOutMinutes
        FROM CheckInOut c
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
        GROUP BY c.MaChamCong, CONVERT(VARCHAR(10), c.NgayCham, 120)
        HAVING COUNT(*) >= 2
          AND MAX(c.GioCham) < CAST(CONVERT(VARCHAR(10), c.NgayCham, 120) + ' ' + @earlyBefore AS DATETIME)
      ) t
      INNER JOIN NHANVIEN nv ON t.MaChamCong = nv.MaChamCong
      LEFT JOIN PHONGBAN pb ON nv.MaPhongBan = pb.MaPhongBan
      GROUP BY nv.MaNhanVien, nv.TenNhanVien, pb.TenPhongBan
    `);

  return result.recordset
    .map((r: Record<string, unknown>) => ({
      maNhanVien: r.maNhanVien as string,
      tenNhanVien: r.tenNhanVien as string,
      tenPhongBan: (r.tenPhongBan as string) ?? null,
      earlyLeaveDays: (r.earlyLeaveDays as number) ?? 0,
      avgCheckOutMinutes: (r.avgCheckOutMinutes as number) ?? 0,
    }))
    .sort((a, b) => b.earlyLeaveDays - a.earlyLeaveDays)
    .slice(0, limit);
}

const WEEKDAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export async function getWeekdayPattern(
  fromDate: string,
  toDate: string,
  lateThreshold: string,
): Promise<WeekdayPattern[]> {
  const pool = await getAttendancePool();

  const result = await pool
    .request()
    .input("fromDate", fromDate)
    .input("toDate", toDate)
    .input("threshold", lateThreshold)
    .query(`
      SELECT
        DATEPART(WEEKDAY, CAST(t.ngay AS DATETIME)) AS dw,
        COUNT(DISTINCT t.ngay) AS totalDays,
        COUNT(DISTINCT CAST(nv.MaNhanVien AS VARCHAR) + '-' + t.ngay) AS presentCount,
        SUM(CASE WHEN t.firstIn > @threshold THEN 1 ELSE 0 END) AS lateCount
      FROM (
        SELECT
          c.MaChamCong,
          CONVERT(VARCHAR(10), c.NgayCham, 120) AS ngay,
          CONVERT(VARCHAR(5), MIN(c.GioCham), 108) AS firstIn
        FROM CheckInOut c
        WHERE CONVERT(VARCHAR(10), c.NgayCham, 120) BETWEEN @fromDate AND @toDate
        GROUP BY c.MaChamCong, CONVERT(VARCHAR(10), c.NgayCham, 120)
      ) t
      INNER JOIN NHANVIEN nv ON t.MaChamCong = nv.MaChamCong
      GROUP BY DATEPART(WEEKDAY, CAST(t.ngay AS DATETIME))
      ORDER BY DATEPART(WEEKDAY, CAST(t.ngay AS DATETIME))
    `);

  return result.recordset.map((r: Record<string, unknown>) => {
    const dw = (r.dw as number) ?? 1;
    const totalDays = (r.totalDays as number) ?? 1;
    const presentCount = (r.presentCount as number) ?? 0;
    return {
      dayOfWeek: dw,
      dayName: WEEKDAY_NAMES[dw - 1] ?? `Day ${dw}`,
      presentCount,
      lateCount: (r.lateCount as number) ?? 0,
      avgCount: Math.round(presentCount / totalDays),
    };
  });
}
