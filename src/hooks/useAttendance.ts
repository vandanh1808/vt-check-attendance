"use client";

import { useState, useCallback } from "react";
import { getDefaultDateRange } from "@/lib/helpers/date";
import type { AttendanceRecord } from "@/types";

interface UseAttendanceOptions {
  adminMode?: boolean;
}

interface FetchParams {
  fromDate: string;
  toDate: string;
  maNhanVien?: string;
  maPhongBan?: string;
  searchTerm?: string;
}

export function useAttendance(options?: UseAttendanceOptions) {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { fromDate: defaultFromDate, toDate: defaultToDate } =
    getDefaultDateRange();
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const fetchAttendance = useCallback(
    async (params?: Partial<FetchParams>) => {
      setLoading(true);
      setError("");

      const query = new URLSearchParams({
        fromDate: params?.fromDate ?? fromDate,
        toDate: params?.toDate ?? toDate,
      });

      if (options?.adminMode) {
        if (params?.maNhanVien) query.set("maNhanVien", params.maNhanVien);
        if (params?.maPhongBan) query.set("maPhongBan", params.maPhongBan);
        if (params?.searchTerm) query.set("searchTerm", params.searchTerm);
      }

      try {
        const res = await fetch(`/api/attendance?${query}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Lỗi khi tải dữ liệu");
          setData([]);
          return;
        }

        setData(json.data);
      } catch {
        setError("Không thể kết nối server");
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate, options?.adminMode],
  );

  return {
    data,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    fetchAttendance,
  };
}
