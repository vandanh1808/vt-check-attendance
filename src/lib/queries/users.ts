import bcrypt from "bcryptjs";
import { getAppPool } from "@/lib/db";
import type { AppUser, CreateUserPayload, UpdateUserPayload } from "@/types";

const SALT_ROUNDS = 10;

function mapRow(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as number,
    maNhanVien: (row.ma_nhan_vien as string) ?? null,
    tenNhanVien: row.ten_nhan_vien as string,
    email: row.email as string,
    role: row.role as AppUser["role"],
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function getAllUsers(): Promise<AppUser[]> {
  const pool = getAppPool();
  const result = await pool.query(
    "SELECT id, ma_nhan_vien, ten_nhan_vien, email, role, created_at FROM app_users ORDER BY created_at DESC",
  );
  return result.rows.map(mapRow);
}

export async function findUserById(id: number): Promise<AppUser | null> {
  const pool = getAppPool();
  const result = await pool.query(
    "SELECT id, ma_nhan_vien, ten_nhan_vien, email, role, created_at FROM app_users WHERE id = $1",
    [id],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

async function emailExists(
  email: string,
  excludeId?: number,
): Promise<boolean> {
  const pool = getAppPool();
  const result = excludeId
    ? await pool.query(
        "SELECT COUNT(*) AS cnt FROM app_users WHERE email = $1 AND id != $2",
        [email, excludeId],
      )
    : await pool.query(
        "SELECT COUNT(*) AS cnt FROM app_users WHERE email = $1",
        [email],
      );
  return parseInt(result.rows[0].cnt) > 0;
}

async function maNhanVienExists(
  maNhanVien: string,
  excludeId?: number,
): Promise<boolean> {
  const pool = getAppPool();
  const result = excludeId
    ? await pool.query(
        "SELECT COUNT(*) AS cnt FROM app_users WHERE ma_nhan_vien = $1 AND id != $2",
        [maNhanVien, excludeId],
      )
    : await pool.query(
        "SELECT COUNT(*) AS cnt FROM app_users WHERE ma_nhan_vien = $1",
        [maNhanVien],
      );
  return parseInt(result.rows[0].cnt) > 0;
}

export async function createUser(payload: CreateUserPayload): Promise<number> {
  if (await emailExists(payload.email)) {
    throw new Error("Email đã được sử dụng");
  }
  if (await maNhanVienExists(payload.maNhanVien)) {
    throw new Error("Mã nhân viên đã được đăng ký");
  }

  const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const pool = getAppPool();
  const result = await pool.query(
    "INSERT INTO app_users (ma_nhan_vien, ten_nhan_vien, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [
      payload.maNhanVien,
      payload.tenNhanVien,
      payload.email,
      hashedPassword,
      payload.role,
    ],
  );

  return result.rows[0].id;
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<void> {
  const existing = await findUserById(id);
  if (!existing) throw new Error("Không tìm thấy tài khoản");

  if (payload.email && payload.email !== existing.email) {
    if (await emailExists(payload.email, id)) {
      throw new Error("Email đã được sử dụng");
    }
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (payload.tenNhanVien) {
    setClauses.push(`ten_nhan_vien = $${paramIndex++}`);
    values.push(payload.tenNhanVien);
  }
  if (payload.email) {
    setClauses.push(`email = $${paramIndex++}`);
    values.push(payload.email);
  }
  if (payload.role) {
    setClauses.push(`role = $${paramIndex++}`);
    values.push(payload.role);
  }
  if (payload.password) {
    const hashed = await bcrypt.hash(payload.password, SALT_ROUNDS);
    setClauses.push(`password = $${paramIndex++}`);
    values.push(hashed);
  }

  if (setClauses.length === 0) return;

  values.push(id);
  const pool = getAppPool();
  await pool.query(
    `UPDATE app_users SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
    values,
  );
}

export async function findRegisteredCodes(
  codes: string[],
): Promise<string[]> {
  if (codes.length === 0) return [];

  const pool = getAppPool();
  const result = await pool.query(
    "SELECT ma_nhan_vien FROM app_users WHERE ma_nhan_vien = ANY($1)",
    [codes],
  );
  return result.rows.map(
    (row: { ma_nhan_vien: string }) => row.ma_nhan_vien,
  );
}

export async function verifyPassword(
  userId: number,
  password: string,
): Promise<boolean> {
  const pool = getAppPool();
  const result = await pool.query(
    "SELECT password FROM app_users WHERE id = $1",
    [userId],
  );
  if (result.rows.length === 0) return false;
  return bcrypt.compare(password, result.rows[0].password);
}

export async function deleteUser(id: number): Promise<void> {
  const user = await findUserById(id);
  if (!user) throw new Error("Không tìm thấy tài khoản");

  if (user.role === "admin") {
    const pool = getAppPool();
    const result = await pool.query(
      "SELECT COUNT(*) AS cnt FROM app_users WHERE role = 'admin'",
    );
    if (parseInt(result.rows[0].cnt) <= 1) {
      throw new Error("Không thể xóa admin cuối cùng");
    }
  }

  const pool = getAppPool();
  await pool.query("DELETE FROM app_users WHERE id = $1", [id]);
}
