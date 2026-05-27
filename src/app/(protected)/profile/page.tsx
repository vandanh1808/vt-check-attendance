"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Đổi mật khẩu thất bại");
        return;
      }

      setSuccess("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin tài khoản của bạn"
      />

      <div className="max-w-md space-y-5">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Thông tin tài khoản
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Họ tên</dt>
              <dd className="font-medium text-slate-900">
                {session?.user?.tenNhanVien}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">
                {session?.user?.email}
              </dd>
            </div>
            {session?.user?.maNhanVien && (
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Mã nhân viên</dt>
                <dd className="font-medium text-slate-900">
                  {session.user.maNhanVien}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Đổi mật khẩu
          </h3>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="mt-5">
            <Button type="submit" loading={loading}>
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
