"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import type { Holiday } from "@/types";

const VN_HOLIDAYS_TEMPLATE: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "Tết Dương lịch" },
  { month: 4, day: 30, name: "Ngày Giải phóng miền Nam" },
  { month: 5, day: 1, name: "Ngày Quốc tế Lao động" },
  { month: 9, day: 2, name: "Quốc khánh" },
  { month: 9, day: 3, name: "Quốc khánh (ngày nghỉ thêm)" },
];

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/holidays?year=${year}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Lỗi khi tải danh sách");
        return;
      }
      setHolidays(json.data);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  async function handleDelete(h: Holiday) {
    const confirmed = window.confirm(`Xóa ngày lễ "${h.name}" (${formatDisplayDate(h.date)})?`);
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/holidays/${h.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Lỗi khi xóa");
        return;
      }
      fetchHolidays();
    } catch {
      alert("Không thể kết nối server");
    }
  }

  function handleEdit(h: Holiday) {
    setEditingHoliday(h);
    setModalOpen(true);
  }

  function handleCreate() {
    setEditingHoliday(null);
    setModalOpen(true);
  }

  async function handleAddFixedHolidays() {
    const existing = new Set(holidays.map((h) => h.date));
    const toAdd = VN_HOLIDAYS_TEMPLATE
      .map((t) => ({
        date: `${year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`,
        name: t.name,
      }))
      .filter((h) => !existing.has(h.date));

    if (toAdd.length === 0) {
      alert("Tất cả ngày lễ cố định đã có trong danh sách");
      return;
    }

    try {
      let failCount = 0;
      for (const h of toAdd) {
        const res = await fetch("/api/admin/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(h),
        });
        if (!res.ok) failCount++;
      }
      if (failCount > 0) {
        setError(`Không thể thêm ${failCount} ngày lễ`);
      }
      fetchHolidays();
    } catch {
      alert("Không thể kết nối server");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý ngày lễ"
        description="Cấu hình ngày lễ để tính chuyên cần chính xác"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleAddFixedHolidays}>
              + Thêm ngày lễ cố định {year}
            </Button>
            <Button onClick={handleCreate}>+ Thêm ngày lễ</Button>
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Năm:</label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
            aria-label="Năm trước"
          >
            &larr;
          </button>
          <span className="min-w-16 text-center text-sm font-semibold text-slate-900">
            {year}
          </span>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
            aria-label="Năm sau"
          >
            &rarr;
          </button>
        </div>
        <span className="text-sm text-slate-400">
          {holidays.length} ngày lễ
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner className="py-12" />
      ) : holidays.length === 0 ? (
        <div className="rounded-xl border border-slate-200 px-4 py-12 text-center text-slate-400">
          Chưa có ngày lễ nào cho năm {year}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ngày
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thứ
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tên ngày lễ
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.map((h) => {
                const [y, m, d] = h.date.split("-").map(Number);
                const dayOfWeek = new Date(y, m - 1, d).getDay();
                const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <tr key={h.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatDisplayDate(h.date)}
                    </td>
                    <td className="px-4 py-3">
                      {isWeekend ? (
                        <Badge variant="warning">{dayNames[dayOfWeek]}</Badge>
                      ) : (
                        <span className="text-slate-500">{dayNames[dayOfWeek]}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{h.name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(h)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <HolidayFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchHolidays}
        editingHoliday={editingHoliday}
        defaultYear={year}
      />
    </div>
  );
}

function formatDisplayDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function HolidayFormModal({
  open,
  onClose,
  onSuccess,
  editingHoliday,
  defaultYear,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingHoliday: Holiday | null;
  defaultYear: number;
}) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editingHoliday;

  useEffect(() => {
    if (editingHoliday) {
      setDate(editingHoliday.date);
      setName(editingHoliday.name);
    } else {
      setDate(`${defaultYear}-01-01`);
      setName("");
    }
    setError("");
  }, [editingHoliday, open, defaultYear]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/holidays/${editingHoliday.id}`
        : "/api/admin/holidays";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, name: name.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Lỗi khi lưu");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Sửa ngày lễ" : "Thêm ngày lễ"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Ngày"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          label="Tên ngày lễ"
          placeholder="VD: Tết Nguyên đán"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? "Cập nhật" : "Thêm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
