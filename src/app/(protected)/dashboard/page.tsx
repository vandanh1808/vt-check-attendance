"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DateRangeFilter from "@/components/attendance/DateRangeFilter";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import Spinner from "@/components/ui/Spinner";
import { getDefaultDateRange } from "@/lib/helpers/date";
import type { AttendanceRecord } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(() => getDefaultDateRange().fromDate);
  const [toDate, setToDate] = useState(() => getDefaultDateRange().toDate);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    hasFetched.current = true;

    try {
      const [attRes, holRes] = await Promise.all([
        fetch(`/api/attendance?fromDate=${fromDate}&toDate=${toDate}`),
        fetch(`/api/holidays?fromDate=${fromDate}&toDate=${toDate}`),
      ]);
      const attJson = await attRes.json();
      const holJson = await holRes.json();

      if (!attRes.ok) {
        setError(attJson.error ?? "Lỗi khi tải dữ liệu");
        setData([]);
        return;
      }

      setData(attJson.data);
      setHolidayDates(holRes.ok ? holJson.data : []);
    } catch {
      setError("Không thể kết nối server");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chấm công của tôi"
        description="Xem lịch sử giờ vào - ra của bạn"
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onApply={fetchData}
          loading={loading}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner className="py-12" />
      ) : hasFetched.current ? (
        <>
          <AttendanceSummary data={data} fromDate={fromDate} toDate={toDate} holidayDates={holidayDates} />
          <AttendanceTable data={data} fromDate={fromDate} toDate={toDate} holidayDates={holidayDates} />
        </>
      ) : null}
    </div>
  );
}
