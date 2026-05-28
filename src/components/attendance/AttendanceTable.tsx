"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/helpers/date";
import type { AttendanceRecord } from "@/types";

interface AttendanceTableProps {
  data: AttendanceRecord[];
  fromDate: string;
  toDate: string;
  holidayDates?: string[];
}

interface DisplayOptions {
  showAbsentDays: boolean;
  hideWeekends: boolean;
  highlightLate: boolean;
  lateThreshold: string;
  onlyLate: boolean;
}

const LATE_MIN = "06:00";
const LATE_MAX = "10:00";
const STORAGE_KEY = "employee_attendance_display_options";

const DEFAULT_OPTIONS: DisplayOptions = {
  showAbsentDays: true,
  hideWeekends: false,
  highlightLate: false,
  lateThreshold: "08:00",
  onlyLate: false,
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

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

function isLate(checkIn: string | null, threshold: string): boolean {
  if (!checkIn) return false;
  return checkIn.substring(0, 5) > threshold;
}

function fillMissingDates(
  data: AttendanceRecord[],
  from: string,
  to: string,
  hideWeekends: boolean,
): AttendanceRecord[] {
  const existingDates = new Set(data.map((r) => r.attendanceDate));
  const filled = [...data];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const current = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  while (current <= end) {
    const dateStr = toLocalDateStr(current);
    if (!existingDates.has(dateStr)) {
      filled.push({
        attendanceDate: dateStr,
        checkIn: null,
        checkOut: null,
        tenMay: null,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return filled.sort((a, b) => a.attendanceDate.localeCompare(b.attendanceDate));
}

function activeCount(opts: DisplayOptions): number {
  let n = 0;
  if (!opts.showAbsentDays) n++;
  if (opts.hideWeekends) n++;
  if (opts.highlightLate) n++;
  if (opts.onlyLate) n++;
  return n;
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
    <div className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
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
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Đánh dấu</p>
              <ToggleSwitch
                checked={options.highlightLate}
                onChange={(v) => onChange({ ...options, highlightLate: v, onlyLate: v ? options.onlyLate : false })}
                label="Đánh dấu đi trễ"
              />
              {options.highlightLate && (
                <>
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
                  <ToggleSwitch
                    checked={options.onlyLate}
                    onChange={(v) => onChange({ ...options, onlyLate: v })}
                    label="Chỉ hiển thị ngày đi trễ"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildColumns(
  holidaySet: Set<string>,
  highlightLate: boolean,
  lateThreshold: string,
): Column<AttendanceRecord>[] {
  return [
    {
      key: "date",
      header: "Ngày",
      render: (row) => {
        const holiday = holidaySet.has(row.attendanceDate);
        const weekend = isWeekend(row.attendanceDate);
        return (
          <span className={`font-medium ${!row.checkIn ? (holiday ? "text-blue-400" : weekend ? "text-slate-400" : "text-gray-400") : ""}`}>
            {formatDate(row.attendanceDate)}
          </span>
        );
      },
    },
    {
      key: "checkIn",
      header: "Giờ vào",
      render: (row) => {
        if (row.checkIn) {
          const late = highlightLate && isLate(row.checkIn, lateThreshold);
          return (
            <span className={late ? "font-semibold text-amber-600" : "text-green-700"}>
              {formatTime(row.checkIn)}
              {late && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">trễ</span>}
            </span>
          );
        }
        if (holidaySet.has(row.attendanceDate)) return <Badge variant="info">Nghỉ lễ</Badge>;
        if (isWeekend(row.attendanceDate)) return <span className="text-slate-300">--</span>;
        return <Badge variant="danger">Nghỉ</Badge>;
      },
    },
    {
      key: "checkOut",
      header: "Giờ ra",
      render: (row) =>
        !row.checkIn ? (
          <span className="text-gray-300">--</span>
        ) : row.checkOut ? (
          <span className="text-blue-700">{formatTime(row.checkOut)}</span>
        ) : (
          <Badge variant="warning">Thiếu</Badge>
        ),
    },
    {
      key: "device",
      header: "Thiết bị",
      render: (row) => (
        <span className="text-gray-500">{!row.checkIn ? "--" : row.tenMay ?? "--"}</span>
      ),
    },
  ];
}

export default function AttendanceTable({
  data,
  fromDate,
  toDate,
  holidayDates = [],
}: AttendanceTableProps) {
  const [options, setOptions] = useState<DisplayOptions>(DEFAULT_OPTIONS);

  useEffect(() => {
    setOptions(loadOptions());
  }, []);

  const handleOptionsChange = useCallback((newOpts: DisplayOptions) => {
    setOptions(newOpts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOpts));
  }, []);

  const holidaySet = useMemo(() => new Set(holidayDates), [holidayDates]);

  const processedData = useMemo(() => {
    let rows = options.showAbsentDays
      ? fillMissingDates(data, fromDate, toDate, options.hideWeekends)
      : [...data].sort((a, b) => a.attendanceDate.localeCompare(b.attendanceDate));

    if (options.hideWeekends) {
      rows = rows.filter((r) => !isWeekend(r.attendanceDate));
    }

    if (options.onlyLate && options.highlightLate) {
      rows = rows.filter((r) => isLate(r.checkIn, options.lateThreshold));
    }

    return rows;
  }, [data, fromDate, toDate, options, holidayDates]);

  const columns = useMemo(
    () => buildColumns(holidaySet, options.highlightLate, options.lateThreshold),
    [holidaySet, options.highlightLate, options.lateThreshold],
  );

  return (
    <div className="space-y-4">
      <OptionsPanel options={options} onChange={handleOptionsChange} />
      <Table
        columns={columns}
        data={processedData}
        keyExtractor={(row) => row.attendanceDate}
        emptyMessage="Không có dữ liệu chấm công trong khoảng thời gian này"
      />
    </div>
  );
}
