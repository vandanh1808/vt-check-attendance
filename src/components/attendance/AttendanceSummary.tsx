"use client";

import { useMemo } from "react";
import type { AttendanceRecord } from "@/types";

interface AttendanceSummaryProps {
  data: AttendanceRecord[];
  fromDate: string;
  toDate: string;
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

function countDaysInRange(from: string, to: string): number {
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function AttendanceSummary({ data, fromDate, toDate }: AttendanceSummaryProps) {
  const stats = useMemo(() => {
    const presentDays = data.filter((r) => r.checkIn).length;
    const totalDaysInRange = countDaysInRange(fromDate, toDate);
    const absentDays = totalDaysInRange - presentDays;
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
      totalDaysInRange,
      absentDays,
      totalHours: `${hours}h${mins.toString().padStart(2, "0")}m`,
      missingCheckOut,
    };
  }, [data, fromDate, toDate]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label="Ngày có mặt"
        value={`${stats.presentDays}/${stats.totalDaysInRange}`}
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
