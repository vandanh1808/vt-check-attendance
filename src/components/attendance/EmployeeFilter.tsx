"use client";

import { useState, useEffect, useCallback } from "react";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/Autocomplete";
import type { Department, NhanVien } from "@/types";

interface EmployeeFilterProps {
  selectedEmployees: AutocompleteOption[];
  onSelectedEmployeesChange: (options: AutocompleteOption[]) => void;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
}

export default function EmployeeFilter({
  selectedEmployees,
  onSelectedEmployeesChange,
  selectedDepartment,
  onDepartmentChange,
}: EmployeeFilterProps) {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/api/departments");
        const json = await res.json();
        if (res.ok) setDepartments(json.data);
      } catch {
        /* departments are optional */
      }
    }
    loadDepartments();
  }, []);

  const searchEmployees = useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      const res = await fetch(
        `/api/employees?search=${encodeURIComponent(query)}`,
      );
      const json = await res.json();
      if (!res.ok) return [];

      return (json.data as NhanVien[]).map((nv) => ({
        value: nv.maNhanVien,
        label: `${nv.maNhanVien} - ${nv.tenNhanVien}`,
        description: nv.tenPhongBan ?? undefined,
      }));
    },
    [],
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Autocomplete
        label="Tìm nhân viên"
        placeholder="Nhập tên hoặc mã NV..."
        selected={selectedEmployees}
        onSelectedChange={onSelectedEmployeesChange}
        onSearch={searchEmployees}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Phòng ban
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => (
            <option key={d.maPhongBan} value={d.maPhongBan}>
              {d.tenPhongBan}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export type { AutocompleteOption };
