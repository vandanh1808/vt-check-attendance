export type UserRole = "admin" | "employee";

export interface AppUser {
  id: number;
  maNhanVien: string | null;
  tenNhanVien: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AttendanceRecord {
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  tenMay: string | null;
}

export interface EmployeeAttendanceRecord extends AttendanceRecord {
  maNhanVien: string;
  tenNhanVien: string;
  phongBan: string | null;
}

export interface NhanVien {
  maNhanVien: string;
  tenNhanVien: string;
  maChamCong: number;
  maPhongBan: string | null;
  tenPhongBan: string | null;
  chucVu: string | null;
}

export interface Department {
  maPhongBan: string;
  tenPhongBan: string;
}

export interface AttendanceFilter {
  fromDate: string;
  toDate: string;
}

export interface AdminAttendanceFilter extends AttendanceFilter {
  maNhanVien?: string;
  maPhongBan?: string;
  searchTerm?: string;
}

export interface CreateUserPayload {
  maNhanVien: string;
  tenNhanVien: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  tenNhanVien?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

export interface AttendanceSummaryData {
  totalDays: number;
  totalWorkDays: number;
  totalHours: number;
  lateCount: number;
  earlyLeaveCount: number;
  missingCheckOut: number;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
}

export type BulkRowStatus =
  | "ready"
  | "duplicate"
  | "not_found"
  | "missing_email";

export interface BulkAccountRow {
  id: string;
  maNhanVien: string;
  tenNhanVien: string;
  email: string;
  status: BulkRowStatus;
}

export interface BulkCreateEvent {
  maNhanVien: string;
  success: boolean;
  stage: "email_sent" | "email_failed" | "skipped";
  error?: string;
}

export interface BulkCreateSummary {
  done: true;
  total: number;
  created: number;
  emailFailed: number;
  skipped: number;
}
