import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getAppPool } from "./db";
import { ROUTES } from "./constants";
import type { UserRole } from "@/types";

const FIND_USER_QUERY = `
  SELECT id, ma_nhan_vien, ten_nhan_vien, email, password, role
  FROM app_users
  WHERE email = $1 OR ma_nhan_vien = $1
`;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: ROUTES.LOGIN },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email hoặc Mã NV", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const pool = getAppPool();
        const result = await pool.query(FIND_USER_QUERY, [
          credentials.identifier.trim(),
        ]);

        const user = result.rows[0] as
          | {
              id: number;
              ma_nhan_vien: string | null;
              ten_nhan_vien: string;
              email: string;
              password: string;
              role: UserRole;
            }
          | undefined;

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!passwordMatch) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
          maNhanVien: user.ma_nhan_vien,
          tenNhanVien: user.ten_nhan_vien,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.maNhanVien = user.maNhanVien;
        token.tenNhanVien = user.tenNhanVien;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.maNhanVien = token.maNhanVien;
      session.user.tenNhanVien = token.tenNhanVien;
      return session;
    },
  },
};
