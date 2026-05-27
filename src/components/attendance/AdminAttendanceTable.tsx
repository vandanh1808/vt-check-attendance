"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/helpers/date";
import type { EmployeeAttendanceRecord } from "@/types";

interface AdminAttendanceTableProps {
  data: EmployeeAttendanceRecord[];
  fromDate: string;
  toDate: string;
  holidayDates?: string[];
}

interface GroupedEmployee {
  maNhanVien: string;
  tenNhanVien: string;
  phongBan: string | null;
  records: EmployeeAttendanceRecord[];
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
}

type SortBy = "name" | "department" | "attendance_asc" | "attendance_desc";

interface DisplayOptions {
  showAbsentDays: boolean;
  hideWeekends: boolean;
  groupByDept: boolean;
  sortBy: SortBy;
  highlightLate: boolean;
  lateThreshold: string;
}

const LATE_MIN = "06:00";
const LATE_MAX = "10:00";
const STORAGE_KEY = "admin_attendance_display_options";

const DEFAULT_OPTIONS: DisplayOptions = {
  showAbsentDays: true,
  hideWeekends: false,
  groupByDept: false,
  sortBy: "department",
  highlightLate: false,
  lateThreshold: "08:00",
};

function loadOptions(): DisplayOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OPTIONS;
    return { ...DEFAULT_OPTIONS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

function padTwo(n: number): string {
  return n.toString().padStart(2, "0");
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

function generateDateRange(from: string, to: string, hideWeekends: boolean): string[] {
  const dates: string[] = [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const current = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  while (current <= end) {
    const str = toLocalDateStr(current);
    if (!hideWeekends || !isWeekend(str)) {
      dates.push(str);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function countWorkdays(from: string, to: string, holidaySet: Set<string>): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const current = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  let count = 0;
  while (current <= end) {
    const day = current.getDay();
    const str = toLocalDateStr(current);
    if (day !== 0 && day !== 6 && !holidaySet.has(str)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function groupByEmployee(
  data: EmployeeAttendanceRecord[],
  allDates: string[],
  showAbsentDays: boolean,
  totalWeekdays: number,
): GroupedEmployee[] {
  const map = new Map<string, GroupedEmployee>();

  for (const r of data) {
    let group = map.get(r.maNhanVien);
    if (!group) {
      group = {
        maNhanVien: r.maNhanVien,
        tenNhanVien: r.tenNhanVien,
        phongBan: r.phongBan,
        records: [],
        presentDays: 0,
        absentDays: 0,
        attendanceRate: 0,
      };
      map.set(r.maNhanVien, group);
    }
    if (allDates.includes(r.attendanceDate)) {
      group.records.push(r);
    }
  }

  for (const group of map.values()) {
    const existingDates = new Set(group.records.map((r) => r.attendanceDate));
    if (showAbsentDays) {
      for (const date of allDates) {
        if (!existingDates.has(date)) {
          group.records.push({
            maNhanVien: group.maNhanVien,
            tenNhanVien: group.tenNhanVien,
            phongBan: group.phongBan,
            attendanceDate: date,
            checkIn: null,
            checkOut: null,
            tenMay: null,
          });
        }
      }
    }
    group.records.sort((a, b) => a.attendanceDate.localeCompare(b.attendanceDate));
    group.presentDays = group.records.filter((r) => r.checkIn).length;
    group.absentDays = totalWeekdays - group.presentDays;
    group.attendanceRate = totalWeekdays > 0 ? group.presentDays / totalWeekdays : 0;
  }

  return Array.from(map.values());
}

function sortEmployees(employees: GroupedEmployee[], sortBy: SortBy): GroupedEmployee[] {
  const sorted = [...employees];
  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.tenNhanVien.localeCompare(b.tenNhanVien, "vi"));
    case "department":
      return sorted.sort((a, b) => {
        const da = a.phongBan ?? "";
        const db = b.phongBan ?? "";
        if (da !== db) return da.localeCompare(db, "vi");
        return a.tenNhanVien.localeCompare(b.tenNhanVien, "vi");
      });
    case "attendance_asc":
      return sorted.sort((a, b) => a.attendanceRate - b.attendanceRate);
    case "attendance_desc":
      return sorted.sort((a, b) => b.attendanceRate - a.attendanceRate);
  }
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function OptionsPanel({
  options,
  onChange,
}: {
  options: DisplayOptions;
  onChange: (opts: DisplayOptions) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200/80">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Tùy chọn hiển thị</span>
          {activeCount(options) > 0 && (
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
              {activeCount(options)}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ngày</p>
              <ToggleSwitch
                checked={options.showAbsentDays}
                onChange={(v) => onChange({ ...options, showAbsentDays: v })}
                label="Hiển thị ngày nghỉ"
              />
              <ToggleSwitch
                checked={options.hideWeekends}
                onChange={(v) => onChange({ ...options, hideWeekends: v })}
                label="Ẩn thứ 7 & chủ nhật"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nhóm & Sắp xếp</p>
              <ToggleSwitch
                checked={options.groupByDept}
                onChange={(v) => onChange({ ...options, groupByDept: v })}
                label="Nhóm theo phòng ban"
              />
              <label className="flex items-center gap-2.5">
                <span className="text-sm text-slate-700">Sắp xếp:</span>
                <select
                  value={options.sortBy}
                  onChange={(e) => onChange({ ...options, sortBy: e.target.value as SortBy })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="department">Phòng ban</option>
                  <option value="name">Tên A → Z</option>
                  <option value="attendance_desc">Đi làm nhiều nhất</option>
                  <option value="attendance_asc">Nghỉ nhiều nhất</option>
                </select>
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Đánh dấu</p>
              <ToggleSwitch
                checked={options.highlightLate}
                onChange={(v) => onChange({ ...options, highlightLate: v })}
                label="Đánh dấu đi trễ"
              />
              {options.highlightLate && (
                <label className="flex items-center gap-2.5 pl-[46px]">
                  <span className="text-sm text-slate-500">Trễ sau:</span>
                  <input
                    type="time"
                    value={options.lateThreshold}
                    min={LATE_MIN}
                    max={LATE_MAX}
                    onChange={(e) => {
                      if (e.target.value) onChange({ ...options, lateThreshold: e.target.value });
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function activeCount(opts: DisplayOptions): number {
  let n = 0;
  if (!opts.showAbsentDays) n++;
  if (opts.hideWeekends) n++;
  if (opts.groupByDept) n++;
  if (opts.sortBy !== "department") n++;
  if (opts.highlightLate) n++;
  return n;
}

function isLate(checkIn: string | null, threshold: string): boolean {
  if (!checkIn) return false;
  const hhmm = checkIn.substring(0, 5);
  return hhmm > threshold;
}

function AttendanceRateBadge({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const variant = pct >= 90 ? "success" : pct >= 70 ? "warning" : "danger";
  return <Badge variant={variant}>{pct}%</Badge>;
}

function DeptHeader({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-indigo-50/70 px-4 py-2.5 ring-1 ring-indigo-100">
      <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <span className="text-sm font-semibold text-indigo-900">{name}</span>
      <span className="text-xs text-indigo-500">{count} nhân viên</span>
    </div>
  );
}

export default function AdminAttendanceTable({
  data,
  fromDate,
  toDate,
  holidayDates = [],
}: AdminAttendanceTableProps) {
  const [options, setOptions] = useState<DisplayOptions>(DEFAULT_OPTIONS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOptions(loadOptions());
    setHydrated(true);
  }, []);

  const updateOptions = useCallback((next: DisplayOptions) => {
    setOptions(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const holidaySet = useMemo(() => new Set(holidayDates), [holidayDates]);

  const totalWorkdays = useMemo(
    () => countWorkdays(fromDate, toDate, holidaySet),
    [fromDate, toDate, holidaySet],
  );

  const allDates = useMemo(
    () => generateDateRange(fromDate, toDate, options.hideWeekends),
    [fromDate, toDate, options.hideWeekends],
  );

  const grouped = useMemo(
    () => groupByEmployee(data, allDates, options.showAbsentDays, totalWorkdays),
    [data, allDates, options.showAbsentDays, totalWorkdays],
  );

  const sorted = useMemo(
    () => sortEmployees(grouped, options.sortBy),
    [grouped, options.sortBy],
  );

  const PAGE_SIZE_OPTIONS = [50, 100, 150] as const;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () =>
    setExpanded(new Set(paged.map((e) => e.maNhanVien)));
  const collapseAll = () => setExpanded(new Set());

  const deptGroups = useMemo(() => {
    if (!options.groupByDept) return null;
    const map = new Map<string, GroupedEmployee[]>();
    for (const emp of paged) {
      const dept = emp.phongBan ?? "Chưa phân phòng";
      const arr = map.get(dept) ?? [];
      arr.push(emp);
      map.set(dept, arr);
    }
    return Array.from(map.entries());
  }, [paged, options.groupByDept]);

  function renderEmployee(emp: GroupedEmployee) {
    const isOpen = expanded.has(emp.maNhanVien);
    const lateCount = options.highlightLate
      ? emp.records.filter((r) => isLate(r.checkIn, options.lateThreshold)).length
      : 0;

    return (
      <div
        key={emp.maNhanVien}
        className="overflow-hidden rounded-lg border border-slate-200/80 shadow-sm"
      >
        <button
          type="button"
          onClick={() => toggle(emp.maNhanVien)}
          className="flex w-full items-center gap-2 bg-slate-50/80 px-3 py-3 text-left transition-colors hover:bg-slate-100 sm:gap-4 sm:px-4"
        >
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-900">{emp.maNhanVien}</span>
            <span className="truncate text-slate-700">{emp.tenNhanVien}</span>
            {!options.groupByDept && emp.phongBan && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
                {emp.phongBan}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {options.highlightLate && lateCount > 0 && (
              <Badge variant="warning">{lateCount} trễ</Badge>
            )}
            <AttendanceRateBadge rate={emp.attendanceRate} />
            <span className="text-xs text-slate-400">
              {emp.presentDays}/{totalWorkdays}
            </span>
          </div>
        </button>

        {isOpen && (
          <>
            {/* Mobile */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {emp.records.map((row) => {
                const absent = !row.checkIn;
                const holiday = holidaySet.has(row.attendanceDate);
                const weekend = isWeekend(row.attendanceDate);
                const late = options.highlightLate && isLate(row.checkIn, options.lateThreshold);
                const rowBg = holiday ? "bg-blue-50/50" : absent ? "bg-red-50/50" : late ? "bg-amber-50/50" : "";
                return (
                  <div
                    key={row.attendanceDate}
                    className={`flex items-center justify-between px-3 py-2.5 text-sm ${rowBg}`}
                  >
                    <div>
                      <p className={`font-medium ${absent && !holiday ? "text-slate-400" : holiday ? "text-blue-400" : ""}`}>
                        {formatDate(row.attendanceDate)}
                        {weekend && <span className="ml-1.5 text-[10px] text-slate-400">(cuối tuần)</span>}
                      </p>
                      {!absent && (
                        <p className="mt-0.5 text-xs text-slate-500">{row.tenMay ?? "--"}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {absent ? (
                        holiday ? <Badge variant="info">Nghỉ lễ</Badge> : <Badge variant="danger">Nghỉ</Badge>
                      ) : (
                        <>
                          <span className={late ? "font-medium text-amber-700" : "text-green-700"}>
                            {formatTime(row.checkIn)}
                          </span>
                          <span className="mx-1 text-slate-300">→</span>
                          {row.checkOut ? (
                            <span className="text-blue-700">{formatTime(row.checkOut)}</span>
                          ) : (
                            <Badge variant="warning">Thiếu</Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop */}
            <table className="hidden w-full text-left text-sm sm:table">
              <thead className="bg-slate-50/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Ngày</th>
                  <th className="px-4 py-2 font-semibold">Giờ vào</th>
                  <th className="px-4 py-2 font-semibold">Giờ ra</th>
                  <th className="px-4 py-2 font-semibold">Thiết bị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emp.records.map((row) => {
                  const absent = !row.checkIn;
                  const holiday = holidaySet.has(row.attendanceDate);
                  const weekend = isWeekend(row.attendanceDate);
                  const late = options.highlightLate && isLate(row.checkIn, options.lateThreshold);
                  const rowBg = holiday ? "bg-blue-50/40" : absent ? "bg-red-50/40" : late ? "bg-amber-50/40" : "hover:bg-slate-50";
                  return (
                    <tr
                      key={row.attendanceDate}
                      className={`transition-colors ${rowBg}`}
                    >
                      <td className={`px-4 py-3 font-medium ${absent && !holiday ? "text-slate-400" : holiday ? "text-blue-400" : ""}`}>
                        {formatDate(row.attendanceDate)}
                        {weekend && <span className="ml-1.5 text-[10px] text-slate-400">(cuối tuần)</span>}
                      </td>
                      <td className="px-4 py-3">
                        {absent ? (
                          holiday ? <Badge variant="info">Nghỉ lễ</Badge> : <Badge variant="danger">Nghỉ</Badge>
                        ) : (
                          <span className={late ? "font-medium text-amber-700" : "text-green-700"}>
                            {formatTime(row.checkIn)}
                            {late && (
                              <span className="ml-1.5 text-[10px] text-amber-500">trễ</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {absent ? (
                          <span className="text-slate-300">--</span>
                        ) : row.checkOut ? (
                          <span className="text-blue-700">{formatTime(row.checkOut)}</span>
                        ) : (
                          <Badge variant="warning">Thiếu</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {absent ? "--" : row.tenMay ?? "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <>
        <OptionsPanel options={options} onChange={updateOptions} />
        <div className="rounded-lg border border-slate-200 px-4 py-8 text-center text-slate-400">
          Không có dữ liệu chấm công
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <OptionsPanel options={options} onChange={updateOptions} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={expandAll}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Mở tất cả
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Đóng tất cả
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>/ {sorted.length} nhân viên</span>
          <span className="text-slate-300">·</span>
          <span>{totalWorkdays} ngày làm việc</span>
        </div>
      </div>

      {deptGroups ? (
        <div className="space-y-5">
          {deptGroups.map(([dept, emps]) => (
            <div key={dept} className="space-y-3">
              <DeptHeader name={dept} count={emps.length} />
              <div className="space-y-3 pl-0 sm:pl-4">
                {emps.map(renderEmployee)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map(renderEmployee)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trước
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                page === currentPage
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
