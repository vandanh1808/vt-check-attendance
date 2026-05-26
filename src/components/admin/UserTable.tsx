"use client";

import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/helpers/date";
import type { AppUser } from "@/types";

interface UserTableProps {
  data: AppUser[];
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}

function UserCard({ user, onEdit, onDelete }: { user: AppUser; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{user.tenNhanVien}</p>
          <p className="text-sm text-gray-500">{user.maNhanVien ?? "--"}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <Badge variant={user.role === "admin" ? "info" : "neutral"}>
          {user.role === "admin" ? "Admin" : "Nhân viên"}
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-gray-400">{formatDate(user.createdAt)}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit}>Sửa</Button>
          <Button size="sm" variant="danger" onClick={onDelete}>Xóa</Button>
        </div>
      </div>
    </div>
  );
}

export default function UserTable({ data, onEdit, onDelete }: UserTableProps) {
  const columns: Column<AppUser>[] = [
    {
      key: "maNhanVien",
      header: "Mã NV",
      render: (row) => (
        <span className="font-medium">{row.maNhanVien ?? "--"}</span>
      ),
    },
    {
      key: "tenNhanVien",
      header: "Tên nhân viên",
      render: (row) => row.tenNhanVien,
    },
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <span className="text-gray-500">{row.email}</span>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (row) => (
        <Badge variant={row.role === "admin" ? "info" : "neutral"}>
          {row.role === "admin" ? "Admin" : "Nhân viên"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (row) => (
        <span className="text-gray-500">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(row)}>
            Sửa
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(row)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 px-4 py-8 text-center text-gray-400">
        Chưa có tài khoản nào
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {data.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={() => onEdit(user)}
            onDelete={() => onDelete(user)}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row) => row.id}
        />
      </div>
    </>
  );
}
