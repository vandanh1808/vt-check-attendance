"use client";

import { useEffect, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DateRangeFilter from "@/components/attendance/DateRangeFilter";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import Spinner from "@/components/ui/Spinner";
import { useAttendance } from "@/hooks/useAttendance";

export default function DashboardPage() {
  const {
    data,
    loading,
    error,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    fetchAttendance,
  } = useAttendance();

  const hasFetched = useRef(false);

  const handleApply = () => {
    hasFetched.current = true;
    fetchAttendance();
  };

  useEffect(() => {
    handleApply();
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
          onApply={handleApply}
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
          <AttendanceSummary data={data} fromDate={fromDate} toDate={toDate} />
          <AttendanceTable data={data} fromDate={fromDate} toDate={toDate} />
        </>
      ) : null}
    </div>
  );
}
