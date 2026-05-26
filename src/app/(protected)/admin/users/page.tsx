"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import UserTable from "@/components/admin/UserTable";
import UserFormModal from "@/components/admin/UserFormModal";
import BulkCreateModal from "@/components/admin/BulkCreateModal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import type { AppUser } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Lỗi khi tải danh sách");
        return;
      }

      setUsers(json.data);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    if (sessionStorage.getItem("bulk_modal_open")) {
      sessionStorage.removeItem("bulk_modal_open");
      setBulkModalOpen(true);
    }
  }, [fetchUsers]);

  function handleEdit(user: AppUser) {
    setEditingUser(user);
    setModalOpen(true);
  }

  async function handleDelete(user: AppUser) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${user.tenNhanVien}"?`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error ?? "Lỗi khi xóa");
        return;
      }

      fetchUsers();
    } catch {
      alert("Không thể kết nối server");
    }
  }

  function handleCreateNew() {
    setEditingUser(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tài khoản"
        description="Tạo và quản lý tài khoản đăng nhập cho nhân viên"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setBulkModalOpen(true)}>
              Tạo nhiều tài khoản
            </Button>
            <Button onClick={handleCreateNew}>+ Tạo tài khoản</Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner className="py-12" />
      ) : (
        <UserTable
          data={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchUsers}
        editingUser={editingUser}
      />

      <BulkCreateModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
