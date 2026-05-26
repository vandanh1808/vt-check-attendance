"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onApply: () => void;
  loading?: boolean;
}

export default function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApply,
  loading,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Từ ngày"
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
        />
        <Input
          label="Đến ngày"
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
        />
      </div>
      <Button onClick={onApply} loading={loading}>
        Xem
      </Button>
    </div>
  );
}
