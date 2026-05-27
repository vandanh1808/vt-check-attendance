export const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
} as const;

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ADMIN_ATTENDANCE: "/admin/attendance",
  ADMIN_USERS: "/admin/users",
  ADMIN_STATISTICS: "/admin/statistics",
  ADMIN_HOLIDAYS: "/admin/holidays",
  PROFILE: "/profile",
} as const;

export const PROTECTED_ROUTES = ["/dashboard", "/admin"] as const;
export const ADMIN_ROUTES = ["/admin"] as const;

export const DEFAULT_PAGE_SIZE = 50;

export const DATE_FORMAT = "yyyy-MM-dd";
export const TIME_FORMAT = "HH:mm:ss";
