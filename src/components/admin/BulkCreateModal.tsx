"use client";

import { useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import {
  useBulkCreate,
  type ProcessingRow,
  type ProcessingStatus,
} from "@/hooks/useBulkCreate";
import type { BulkRowStatus } from "@/types";

interface BulkCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const statusLabels: Record<BulkRowStatus, string> = {
  ready: "Sẵn sàng",
  duplicate: "Đã có TK",
  not_found: "MNV không tồn tại",
  missing_email: "Thiếu email",
};

const statusVariants: Record<
  BulkRowStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  ready: "success",
  duplicate: "warning",
  not_found: "danger",
  missing_email: "danger",
};

const processingLabels: Record<ProcessingStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý...",
  email_sent: "Thành công",
  email_failed: "TK tạo OK, email lỗi",
  skipped: "Bỏ qua",
};

const processingVariants: Record<
  ProcessingStatus,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  pending: "neutral",
  processing: "info",
  email_sent: "success",
  email_failed: "warning",
  skipped: "danger",
};

const OutlookIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.587.234h-8.55v-8.15l1.6 1.138 1.575-1.037V8.387l-1.575.988L14.625 8.2V4.05h8.55c.234 0 .432.078.587.234A.778.778 0 0124 4.86v2.527zM14.625 2.55l-8.4 1.95v15l8.4 1.95V2.55zM9.727 14.637c-.478-.248-.828-.634-1.05-1.162-.15-.342-.225-.726-.225-1.15 0-.684.168-1.28.506-1.787.337-.507.788-.842 1.35-1.006.33-.1.65-.15.956-.15.462 0 .882.116 1.256.35.375.234.662.568.862 1.006.2.434.3.918.3 1.45 0 .7-.178 1.313-.534 1.837-.356.525-.822.875-1.396 1.05-.282.086-.578.13-.89.13-.47 0-.895-.19-1.275-.568h.14zm.78-1.137c.186.268.423.4.714.4.35 0 .632-.198.848-.593.214-.396.322-.924.322-1.584 0-.54-.098-.978-.295-1.312-.198-.335-.467-.502-.808-.502-.322 0-.586.16-.793.48-.207.32-.31.775-.31 1.366 0 .64.108 1.137.322 1.487v.258z" />
  </svg>
);

export default function BulkCreateModal({
  open,
  onClose,
  onSuccess,
}: BulkCreateModalProps) {
  const bulk = useBulkCreate(open);

  function handleClose() {
    if (bulk.isDone) onSuccess();
    bulk.reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tạo nhiều tài khoản"
      size="xl"
    >
      {bulk.step === "upload" && (
        <UploadStep
          oauthEmail={bulk.oauth.authenticated ? bulk.oauth.email : undefined}
          onLogin={bulk.startOAuthLogin}
          onLogout={bulk.logoutOAuth}
          isValidating={bulk.isValidating}
          error={bulk.validateError}
          onValidate={bulk.validate}
        />
      )}

      {bulk.step === "preview" && (
        <PreviewStep
          rows={bulk.rows}
          readyCount={bulk.readyCount}
          onUpdateEmail={bulk.updateRowEmail}
          onRemove={bulk.removeRow}
          onBack={bulk.reset}
          onSubmit={bulk.startCreation}
        />
      )}

      {bulk.step === "progress" && (
        <ProgressStep
          rows={bulk.rows}
          processed={bulk.processed}
          total={bulk.total}
          summary={bulk.summary}
          isDone={bulk.isDone}
          onClose={handleClose}
        />
      )}
    </Modal>
  );
}

function UploadStep({
  oauthEmail,
  onLogin,
  onLogout,
  isValidating,
  error,
  onValidate,
}: {
  oauthEmail?: string;
  onLogin: () => void;
  onLogout: () => void;
  isValidating: boolean;
  error: string;
  onValidate: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onValidate(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onValidate(file);
  }

  return (
    <div className="space-y-5">
      {/* Outlook OAuth */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Đăng nhập email để gửi mật khẩu
        </h3>

        {oauthEmail ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                {OutlookIcon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {oauthEmail}
                </p>
                <p className="text-xs text-green-600">Đã kết nối</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            {OutlookIcon}
            <span>Đăng nhập với Microsoft Outlook</span>
          </button>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* File Upload */}
      <div className={`space-y-3${!oauthEmail ? " pointer-events-none opacity-50" : ""}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            File danh sách nhân viên
          </h3>
          <a
            href="/api/admin/bulk-accounts/template"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Tải template
          </a>
        </div>

        {!oauthEmail && (
          <p className="text-sm text-gray-500">
            Vui lòng đăng nhập Outlook trước khi upload file.
          </p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50/50"
        >
          {isValidating ? (
            <Spinner />
          ) : (
            <>
              <svg
                className="mb-2 h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Kéo thả file hoặc nhấn để chọn
              </p>
              <p className="mt-1 text-xs text-gray-500">.xlsx, .xls, .csv</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

function PreviewStep({
  rows,
  readyCount,
  onUpdateEmail,
  onRemove,
  onBack,
  onSubmit,
}: {
  rows: ProcessingRow[];
  readyCount: number;
  onUpdateEmail: (id: string, email: string) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const errorCount = rows.filter(
    (r) => r.status === "not_found" || r.status === "missing_email",
  ).length;
  const duplicateCount = rows.filter((r) => r.status === "duplicate").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-gray-700">
          {rows.length} nhân viên
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-green-600">{readyCount} sẵn sàng</span>
        {errorCount > 0 && (
          <span className="text-red-600">{errorCount} lỗi</span>
        )}
        {duplicateCount > 0 && (
          <span className="text-yellow-600">
            {duplicateCount} đã có TK
          </span>
        )}
      </div>

      <div className="max-h-[50vh] overflow-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Mã NV</th>
              <th className="px-3 py-2 font-semibold">Tên nhân viên</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Trạng thái</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className={
                  row.status === "not_found" || row.status === "duplicate"
                    ? "bg-gray-50/50 opacity-60"
                    : ""
                }
              >
                <td className="px-3 py-2 font-medium">{row.maNhanVien}</td>
                <td className="px-3 py-2 text-gray-700">
                  {row.tenNhanVien || "--"}
                </td>
                <td className="px-3 py-2">
                  {row.status === "not_found" ||
                  row.status === "duplicate" ? (
                    <span className="text-gray-400">{row.email || "--"}</span>
                  ) : (
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) => onUpdateEmail(row.id, e.target.value)}
                      placeholder="Nhập email..."
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  <Badge variant={statusVariants[row.status]}>
                    {statusLabels[row.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Xóa"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          Quay lại
        </Button>
        <Button onClick={onSubmit} disabled={readyCount === 0}>
          Tạo {readyCount} tài khoản
        </Button>
      </div>
    </div>
  );
}

function ProgressStep({
  rows,
  processed,
  total,
  summary,
  isDone,
  onClose,
}: {
  rows: ProcessingRow[];
  processed: number;
  total: number;
  summary: { created: number; emailFailed: number; skipped: number } | null;
  isDone: boolean;
  onClose: () => void;
}) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {isDone ? "Hoàn tất" : "Đang xử lý..."}
          </span>
          <span className="font-medium text-gray-900">
            {processed}/{total}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {isDone && summary && (
        <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span className="text-green-700">
            {summary.created} tạo thành công
          </span>
          {summary.emailFailed > 0 && (
            <span className="text-yellow-700">
              {summary.emailFailed} email thất bại
            </span>
          )}
          {summary.skipped > 0 && (
            <span className="text-red-700">{summary.skipped} bỏ qua</span>
          )}
        </div>
      )}

      <div className="max-h-[45vh] overflow-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Mã NV</th>
              <th className="px-3 py-2 font-semibold">Tên nhân viên</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 font-medium">{row.maNhanVien}</td>
                <td className="px-3 py-2 text-gray-700">{row.tenNhanVien}</td>
                <td className="px-3 py-2 text-gray-500">{row.email}</td>
                <td className="px-3 py-2">
                  {row.processingStatus ? (
                    <div className="flex flex-col gap-0.5">
                      <Badge
                        variant={processingVariants[row.processingStatus]}
                      >
                        {processingLabels[row.processingStatus]}
                      </Badge>
                      {row.processingError && (
                        <span className="text-xs text-red-500">
                          {row.processingError}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Badge variant="neutral">Chờ xử lý</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onClose} disabled={!isDone}>
          Đóng
        </Button>
      </div>
    </div>
  );
}
