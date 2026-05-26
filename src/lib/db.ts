import sql from "mssql";
import { Pool as PgPool } from "pg";

// ── Attendance DB (SQL Server - read-only) ──

const attendanceDbConfig: sql.config = {
  server: process.env.ATTENDANCE_DB_SERVER!,
  database: process.env.ATTENDANCE_DB_NAME!,
  user: process.env.ATTENDANCE_DB_USER!,
  password: process.env.ATTENDANCE_DB_PASSWORD!,
  port: parseInt(process.env.ATTENDANCE_DB_PORT ?? "1433"),
  options: { encrypt: false, trustServerCertificate: true, useUTC: false },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

declare global {
  // eslint-disable-next-line no-var
  var _attendancePool: sql.ConnectionPool | undefined;
  // eslint-disable-next-line no-var
  var _appPool: PgPool | undefined;
}

export async function getAttendancePool(): Promise<sql.ConnectionPool> {
  if (!global._attendancePool || !global._attendancePool.connected) {
    global._attendancePool = await new sql.ConnectionPool(
      attendanceDbConfig,
    ).connect();
  }
  return global._attendancePool;
}

// ── App DB (PostgreSQL - read/write) ──

export function getAppPool(): PgPool {
  if (!global._appPool) {
    global._appPool = new PgPool({
      host: process.env.APP_DB_HOST!,
      port: parseInt(process.env.APP_DB_PORT ?? "5432"),
      database: process.env.APP_DB_NAME!,
      user: process.env.APP_DB_USER!,
      password: process.env.APP_DB_PASSWORD!,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return global._appPool;
}
