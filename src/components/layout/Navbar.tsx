"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import Badge from "@/components/ui/Badge";
import type { UserRole } from "@/types";

interface NavbarProps {
  userName: string;
  userRole: UserRole;
  mobileMenuButton?: ReactNode;
}

export default function Navbar({ userName, userRole, mobileMenuButton }: NavbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {mobileMenuButton}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium text-gray-700">
              {userName}
            </span>
            <Badge variant={userRole === "admin" ? "info" : "neutral"}>
              {userRole === "admin" ? "Admin" : "Nhân viên"}
            </Badge>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Đăng xuất"
        >
          <svg
            className="h-5 w-5"
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
