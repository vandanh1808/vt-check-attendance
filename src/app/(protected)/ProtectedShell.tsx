"use client";

import { useState, type ReactNode } from "react";
import Sidebar, { MenuIcon } from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import type { UserRole } from "@/types";

interface ProtectedShellProps {
  userName: string;
  userRole: UserRole;
  children: ReactNode;
}

export default function ProtectedShell({
  userName,
  userRole,
  children,
}: ProtectedShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userRole={userRole}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          userName={userName}
          userRole={userRole}
          mobileMenuButton={
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              {MenuIcon}
            </button>
          }
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
