import { getAppPool } from "@/lib/db";
import type { Holiday } from "@/types";

function mapRow(row: Record<string, unknown>): Holiday {
  return {
    id: row.id as number,
    date: (row.date as Date).toISOString().split("T")[0],
    name: row.name as string,
  };
}

export async function getHolidays(year?: number): Promise<Holiday[]> {
  const pool = getAppPool();
  if (year) {
    const result = await pool.query(
      "SELECT id, date, name FROM holidays WHERE EXTRACT(YEAR FROM date) = $1 ORDER BY date ASC",
      [year],
    );
    return result.rows.map(mapRow);
  }
  const result = await pool.query(
    "SELECT id, date, name FROM holidays ORDER BY date ASC",
  );
  return result.rows.map(mapRow);
}

export async function getHolidayDates(
  fromDate: string,
  toDate: string,
): Promise<string[]> {
  const pool = getAppPool();
  const result = await pool.query(
    "SELECT date FROM holidays WHERE date BETWEEN $1 AND $2 ORDER BY date ASC",
    [fromDate, toDate],
  );
  return result.rows.map((r: { date: Date }) => r.date.toISOString().split("T")[0]);
}

export async function createHoliday(
  date: string,
  name: string,
): Promise<number> {
  const pool = getAppPool();
  const exists = await pool.query(
    "SELECT id FROM holidays WHERE date = $1",
    [date],
  );
  if (exists.rows.length > 0) {
    throw new Error("Ngày lễ này đã tồn tại");
  }
  const result = await pool.query(
    "INSERT INTO holidays (date, name) VALUES ($1, $2) RETURNING id",
    [date, name],
  );
  return result.rows[0].id;
}

export async function updateHoliday(
  id: number,
  date: string,
  name: string,
): Promise<void> {
  const pool = getAppPool();
  const dup = await pool.query(
    "SELECT id FROM holidays WHERE date = $1 AND id != $2",
    [date, id],
  );
  if (dup.rows.length > 0) {
    throw new Error("Ngày lễ này đã tồn tại");
  }
  const result = await pool.query(
    "UPDATE holidays SET date = $1, name = $2 WHERE id = $3",
    [date, name, id],
  );
  if (!result.rowCount) {
    throw new Error("Không tìm thấy ngày lễ");
  }
}

export async function deleteHoliday(id: number): Promise<void> {
  const pool = getAppPool();
  const result = await pool.query("DELETE FROM holidays WHERE id = $1", [id]);
  if (!result.rowCount) {
    throw new Error("Không tìm thấy ngày lễ");
  }
}
