"use client";

import { useState, useEffect, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { AppUser, UserRole } from "@/types";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: AppUser | null;
}

export default function UserFormModal({
  open,
  onClose,
  onSuccess,
  editingUser,
}: UserFormModalProps) {
  const [maNhanVien, setMaNhanVien] = useState("");
  const [tenNhanVien, setTenNhanVien] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const isEditing = !!editingUser;

  useEffect(() => {
    if (editingUser) {
      setMaNhanVien(editingUser.maNhanVien ?? "");
      setTenNhanVien(editingUser.tenNhanVien);
      setEmail(editingUser.email);
      setRole(editingUser.role);
      setPassword("");
    } else {
      setMaNhanVien("");
      setTenNhanVien("");
      setEmail("");
      setPassword("");
      setRole("employee");
    }
    setError("");
  }, [editingUser, open]);

  async function lookupEmployee() {
    if (!maNhanVien.trim()) return;
    setLookingUp(true);

    try {
      const res = await fetch(
        `/api/employees?maNhanVien=${encodeURIComponent(maNhanVien.trim())}`,
      );
      const json = await res.json();

      if (res.ok && json.data) {
        setTenNhanVien(json.data.tenNhanVien);
        setError("");
      } else {
        setError("Mã nhân viên không tồn tại trong hệ thống chấm công");
      }
    } catch {
      setError("Không thể tra cứu nhân viên");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";

      const method = isEditing ? "PUT" : "POST";

      const body = isEditing
        ? { tenNhanVien, email, role, ...(password ? { password } : {}) }
        : { maNhanVien, tenNhanVien, email, password, role };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      title={isEditing ? "Sửa tài khoản" : "Tạo tài khoản mới"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isEditing && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Mã nhân viên"
                placeholder="VD: NV001"
                value={maNhanVien}
                onChange={(e) => setMaNhanVien(e.target.value)}
                required
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={lookupEmployee}
              loading={lookingUp}
            >
              Tra cứu
            </Button>
          </div>
        )}

        <Input
          label="Tên nhân viên"
          placeholder="Nguyễn Văn A"
          value={tenNhanVien}
          onChange={(e) => setTenNhanVien(e.target.value)}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="example@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label={isEditing ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!isEditing}
          minLength={6}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Vai trò
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="employee">Nhân viên</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? "Cập nhật" : "Tạo tài khoản"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
