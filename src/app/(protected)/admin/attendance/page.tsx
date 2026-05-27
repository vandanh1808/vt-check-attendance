"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DateRangeFilter from "@/components/attendance/DateRangeFilter";
import EmployeeFilter, { type AutocompleteOption } from "@/components/attendance/EmployeeFilter";
import AdminAttendanceTable from "@/components/attendance/AdminAttendanceTable";
import Spinner from "@/components/ui/Spinner";
import { getFirstDayOfMonth, getToday } from "@/lib/helpers/date";
import type { EmployeeAttendanceRecord } from "@/types";

export default function AdminAttendancePage() {
  const [data, setData] = useState<EmployeeAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth);
  const [toDate, setToDate] = useState(getToday);
  const [selectedEmployees, setSelectedEmployees] = useState<AutocompleteOption[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    hasFetched.current = true;

    const query = new URLSearchParams({ fromDate, toDate });
    for (const emp of selectedEmployees) {
      query.append("maNhanVien", emp.value);
    }
    if (selectedDepartment) query.set("maPhongBan", selectedDepartment);

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
  }, [fromDate, toDate, selectedEmployees, selectedDepartment]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chấm công nhân viên"
        description="Xem chấm công tất cả nhân viên"
      />

      <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <EmployeeFilter
          selectedEmployees={selectedEmployees}
          onSelectedEmployeesChange={setSelectedEmployees}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
        />
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
          <p className="text-sm text-gray-500">
            Tổng: <strong>{data.length}</strong> bản ghi
          </p>
          <AdminAttendanceTable data={data} fromDate={fromDate} toDate={toDate} />
        </>
      ) : null}
    </div>
  );
}
