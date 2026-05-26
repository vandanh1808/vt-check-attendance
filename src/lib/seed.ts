import bcrypt from "bcryptjs";
import { getAppPool } from "./db";

const CREATE_APP_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS app_users (
    id            SERIAL PRIMARY KEY,
    ma_nhan_vien  VARCHAR(20) UNIQUE,
    ten_nhan_vien VARCHAR(200) NOT NULL,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'employee',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
  )
`;

const SALT_ROUNDS = 10;

export async function seedDatabase(): Promise<{ message: string }> {
  const pool = getAppPool();

  await pool.query(CREATE_APP_USERS_TABLE);

  const result = await pool.query(
    "SELECT COUNT(*) AS count FROM app_users WHERE role = 'admin'",
  );

  if (parseInt(result.rows[0].count) > 0) {
    return { message: "Database already seeded. Admin account exists." };
  }

  const email = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@company.com";
  const plainPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? "Admin@123";
  const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  await pool.query(
    "INSERT INTO app_users (ten_nhan_vien, email, password, role) VALUES ($1, $2, $3, 'admin')",
    ["Administrator", email, hashedPassword],
  );

  return { message: `Admin account created: ${email}` };
}
