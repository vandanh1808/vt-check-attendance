"use client";

import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/helpers/date";
import type { AttendanceRecord } from "@/types";

interface AttendanceTableProps {
  data: AttendanceRecord[];
}

const columns: Column<AttendanceRecord>[] = [
  {
    key: "date",
    header: "Ngày",
    render: (row) => (
      <span className="font-medium">{formatDate(row.attendanceDate)}</span>
    ),
  },
  {
    key: "checkIn",
    header: "Giờ vào",
    render: (row) => (
      <span className="text-green-700">{formatTime(row.checkIn)}</span>
    ),
  },
  {
    key: "checkOut",
    header: "Giờ ra",
    render: (row) =>
      row.checkOut ? (
        <span className="text-blue-700">{formatTime(row.checkOut)}</span>
      ) : (
        <Badge variant="warning">Thiếu</Badge>
      ),
  },
  {
    key: "device",
    header: "Thiết bị",
    render: (row) => (
      <span className="text-gray-500">{row.tenMay ?? "--"}</span>
    ),
  },
];

export default function AttendanceTable({ data }: AttendanceTableProps) {
  return (
    <Table
      columns={columns}
      data={data}
      keyExtractor={(row) => `${row.attendanceDate}-${row.tenMay}`}
      emptyMessage="Không có dữ liệu chấm công trong khoảng thời gian này"
    />
  );
}
