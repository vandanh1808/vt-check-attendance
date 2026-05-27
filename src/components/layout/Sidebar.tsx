"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types";

const MenuIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  employeeOnly?: boolean;
}

const ClockIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ProfileIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const navItems: NavItem[] = [
  { label: "Chấm công", href: ROUTES.DASHBOARD, icon: ClockIcon, employeeOnly: true },
  { label: "Chấm công NV", href: ROUTES.ADMIN_ATTENDANCE, icon: ChartIcon, adminOnly: true },
  { label: "Quản lý tài khoản", href: ROUTES.ADMIN_USERS, icon: UsersIcon, adminOnly: true },
  { label: "Hồ sơ cá nhân", href: ROUTES.PROFILE, icon: ProfileIcon },
];

interface SidebarProps {
  userRole: UserRole;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export default function Sidebar({ userRole, mobileOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && userRole !== "admin") return false;
    if (item.employeeOnly && userRole === "admin") return false;
    return true;
  });

  const navContent = (
    <>
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
          VT
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            Check Attendance
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            V-Takeuchi Vietnam
          </span>
        </div>
        <button
          onClick={onMobileToggle}
          className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
        >
          {CloseIcon}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileToggle}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className={`transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden h-full w-60 flex-col bg-slate-900 lg:flex">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onMobileToggle}
          />
          <aside className="relative z-50 flex h-full w-60 flex-col bg-slate-900 shadow-2xl animate-slide-left">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

export { MenuIcon };
