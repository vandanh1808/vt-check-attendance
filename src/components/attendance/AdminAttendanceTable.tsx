"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/helpers/date";
import type { EmployeeAttendanceRecord } from "@/types";

interface AdminAttendanceTableProps {
  data: EmployeeAttendanceRecord[];
}

interface GroupedEmployee {
  maNhanVien: string;
  tenNhanVien: string;
  phongBan: string | null;
  records: EmployeeAttendanceRecord[];
}

function groupByEmployee(
  data: EmployeeAttendanceRecord[],
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
      };
      map.set(r.maNhanVien, group);
    }
    group.records.push(r);
  }

  return Array.from(map.values()).sort((a, b) => {
    const deptA = a.phongBan ?? "";
    const deptB = b.phongBan ?? "";
    if (deptA !== deptB) return deptA.localeCompare(deptB, "vi");
    return a.tenNhanVien.localeCompare(b.tenNhanVien, "vi");
  });
}

export default function AdminAttendanceTable({
  data,
}: AdminAttendanceTableProps) {
  const grouped = useMemo(() => groupByEmployee(data), [data]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 px-4 py-8 text-center text-gray-400">
        Không có dữ liệu chấm công
      </div>
    );
  }

  const PAGE_SIZE_OPTIONS = [50, 100, 150] as const;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(grouped.length / pageSize);
  const paged = grouped.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () =>
    setExpanded(new Set(paged.map((e) => e.maNhanVien)));

  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mở tất cả
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Đóng tất cả
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>/ {grouped.length} nhân viên</span>
        </div>
      </div>

      {paged.map((emp) => {
        const isOpen = expanded.has(emp.maNhanVien);

        return (
          <div
            key={emp.maNhanVien}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            <button
              type="button"
              onClick={() => toggle(emp.maNhanVien)}
              className="flex w-full items-center gap-2 bg-gray-50 px-3 py-3 text-left transition-colors hover:bg-gray-100 sm:gap-4 sm:px-4"
            >
              <svg
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-gray-900">
                  {emp.maNhanVien}
                </span>
                <span className="truncate text-gray-700">{emp.tenNhanVien}</span>
                {emp.phongBan && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {emp.phongBan}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {emp.records.length} ngày
              </span>
            </button>

            {isOpen && (
              <>
                {/* Mobile: card list */}
                <div className="divide-y divide-gray-100 sm:hidden">
                  {emp.records.map((row) => (
                    <div
                      key={`${row.attendanceDate}-${row.tenMay}`}
                      className="flex items-center justify-between px-3 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-medium">{formatDate(row.attendanceDate)}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{row.tenMay ?? "--"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-700">{formatTime(row.checkIn)}</span>
                        <span className="mx-1 text-gray-300">→</span>
                        {row.checkOut ? (
                          <span className="text-blue-700">{formatTime(row.checkOut)}</span>
                        ) : (
                          <Badge variant="warning">Thiếu</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <table className="hidden w-full text-left text-sm sm:table">
                  <thead className="bg-gray-50/50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Ngày</th>
                      <th className="px-4 py-2 font-semibold">Giờ vào</th>
                      <th className="px-4 py-2 font-semibold">Giờ ra</th>
                      <th className="px-4 py-2 font-semibold">Thiết bị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {emp.records.map((row) => (
                      <tr
                        key={`${row.attendanceDate}-${row.tenMay}`}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {formatDate(row.attendanceDate)}
                        </td>
                        <td className="px-4 py-3 text-green-700">
                          {formatTime(row.checkIn)}
                        </td>
                        <td className="px-4 py-3">
                          {row.checkOut ? (
                            <span className="text-blue-700">
                              {formatTime(row.checkOut)}
                            </span>
                          ) : (
                            <Badge variant="warning">Thiếu</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {row.tenMay ?? "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
