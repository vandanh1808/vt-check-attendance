"use client";

import { useMemo } from "react";
import type { AttendanceRecord } from "@/types";

interface AttendanceSummaryProps {
  data: AttendanceRecord[];
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

export default function AttendanceSummary({ data }: AttendanceSummaryProps) {
  const stats = useMemo(() => {
    const missingCheckOut = data.filter((r) => !r.checkOut).length;

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
      totalDays: data.length,
      totalHours: `${hours}h${mins.toString().padStart(2, "0")}m`,
      missingCheckOut,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Tổng ngày"
        value={stats.totalDays}
        color="text-gray-900"
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
