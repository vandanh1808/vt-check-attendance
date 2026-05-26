import type { UserRole } from "@/types";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: UserRole;
    maNhanVien: string | null;
    tenNhanVien: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      maNhanVien: string | null;
      tenNhanVien: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    maNhanVien: string | null;
    tenNhanVien: string;
  }
}
