"use client";

import { useMemo } from "react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/helpers/date";
import type { AttendanceRecord } from "@/types";

interface AttendanceTableProps {
  data: AttendanceRecord[];
  fromDate: string;
  toDate: string;
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1 < 10 ? "0" : ""}${d.getMonth() + 1}-${d.getDate() < 10 ? "0" : ""}${d.getDate()}`;
}

function fillMissingDates(
  data: AttendanceRecord[],
  from: string,
  to: string,
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

const columns: Column<AttendanceRecord>[] = [
  {
    key: "date",
    header: "Ngày",
    render: (row) => (
      <span className={`font-medium ${!row.checkIn ? "text-gray-400" : ""}`}>
        {formatDate(row.attendanceDate)}
      </span>
    ),
  },
  {
    key: "checkIn",
    header: "Giờ vào",
    render: (row) =>
      row.checkIn ? (
        <span className="text-green-700">{formatTime(row.checkIn)}</span>
      ) : (
        <Badge variant="danger">Nghỉ</Badge>
      ),
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

export default function AttendanceTable({ data, fromDate, toDate }: AttendanceTableProps) {
  const filledData = useMemo(
    () => fillMissingDates(data, fromDate, toDate),
    [data, fromDate, toDate],
  );

  return (
    <Table
      columns={columns}
      data={filledData}
      keyExtractor={(row) => row.attendanceDate}
      emptyMessage="Không có dữ liệu chấm công trong khoảng thời gian này"
    />
  );
}
