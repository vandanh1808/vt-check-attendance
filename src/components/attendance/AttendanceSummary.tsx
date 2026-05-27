"use client";

import { useMemo } from "react";
import type { AttendanceRecord } from "@/types";

interface AttendanceSummaryProps {
  data: AttendanceRecord[];
  fromDate: string;
  toDate: string;
  holidayDates?: string[];
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function countWorkdays(from: string, to: string, holidaySet: Set<string>): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const current = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  let count = 0;
  while (current <= end) {
    const day = current.getDay();
    const str = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    if (day !== 0 && day !== 6 && !holidaySet.has(str)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function AttendanceSummary({
  data,
  fromDate,
  toDate,
  holidayDates = [],
}: AttendanceSummaryProps) {
  const stats = useMemo(() => {
    const holidaySet = new Set(holidayDates);
    const presentDays = data.filter((r) => r.checkIn).length;
    const totalWorkdays = countWorkdays(fromDate, toDate, holidaySet);
    const absentDays = Math.max(0, totalWorkdays - presentDays);
    const missingCheckOut = data.filter((r) => r.checkIn && !r.checkOut).length;

    let totalMinutes = 0;
    for (const r of data) {
      if (r.checkIn && r.checkOut) {
        const diff =
          parseTimeToMinutes(r.checkOut) - parseTimeToMinutes(r.checkIn);
        if (diff > 0) totalMinutes += diff;
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return {
      presentDays,
      totalWorkdays,
      absentDays,
      holidayCount: holidayDates.length,
      totalHours: `${hours}h${mins.toString().padStart(2, "0")}m`,
      missingCheckOut,
    };
  }, [data, fromDate, toDate, holidayDates]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label="Ngày có mặt"
        value={`${stats.presentDays}/${stats.totalWorkdays}`}
        color="text-gray-900"
      />
      <StatCard
        label="Ngày nghỉ"
        value={stats.absentDays}
        color={stats.absentDays > 0 ? "text-red-600" : "text-green-600"}
      />
      <StatCard
        label="Tổng giờ làm"
        value={stats.totalHours}
        color="text-blue-700"
      />
      <StatCard
        label="Thiếu giờ ra"
        value={stats.missingCheckOut}
        color={stats.missingCheckOut > 0 ? "text-red-600" : "text-green-600"}
      />
    </div>
  );
}
