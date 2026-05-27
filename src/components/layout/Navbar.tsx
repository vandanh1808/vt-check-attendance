"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import Badge from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types";

interface NavbarProps {
  userName: string;
  userRole: UserRole;
  mobileMenuButton?: ReactNode;
}

export default function Navbar({ userName, userRole, mobileMenuButton }: NavbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        {mobileMenuButton}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium text-slate-700">
              {userName}
            </span>
            <Badge variant={userRole === "admin" ? "info" : "neutral"}>
              {userRole === "admin" ? "Admin" : "Nhân viên"}
            </Badge>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Đăng xuất"
        >
          <svg
            className="h-4.5 w-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
