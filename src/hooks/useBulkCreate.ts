"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  BulkAccountRow,
  BulkRowStatus,
  BulkCreateEvent,
  BulkCreateSummary,
} from "@/types";

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "email_sent"
  | "email_failed"
  | "skipped";

export interface ProcessingRow extends BulkAccountRow {
  processingStatus?: ProcessingStatus;
  processingError?: string;
}

type Step = "upload" | "preview" | "progress";

interface OAuthStatus {
  authenticated: boolean;
  email?: string;
  name?: string;
}

export function useBulkCreate(open: boolean) {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ProcessingRow[]>([]);
  const [oauth, setOAuth] = useState<OAuthStatus>({ authenticated: false });
  const [isValidating, setIsValidating] = useState(false);
  const [validateError, setValidateError] = useState("");
  const [summary, setSummary] = useState<BulkCreateSummary | null>(null);
  const [processed, setProcessed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const readyCount = rows.filter((r) => r.status === "ready").length;
  const total = rows.filter((r) => r.status === "ready").length;
  const isDone = !!summary;

  const checkOAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bulk-accounts/oauth/status");
      const json = await res.json();
      if (res.ok && json.data) {
        setOAuth(json.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) checkOAuthStatus();
  }, [open, checkOAuthStatus]);

  const startOAuthLogin = useCallback(() => {
    sessionStorage.setItem("bulk_modal_open", "true");
    window.location.href = "/api/admin/bulk-accounts/oauth/authorize";
  }, []);

  const logoutOAuth = useCallback(async () => {
    await fetch("/api/admin/bulk-accounts/oauth/status", { method: "DELETE" });
    setOAuth({ authenticated: false });
  }, []);

  const validate = useCallback(async (file: File) => {
    setIsValidating(true);
    setValidateError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/bulk-accounts/validate", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setValidateError(json.error ?? "Lỗi khi xử lý file");
        return;
      }

      setRows(json.data.rows as ProcessingRow[]);
      setStep("preview");
    } catch {
      setValidateError("Không thể kết nối server");
    } finally {
      setIsValidating(false);
    }
  }, []);

  const updateRowEmail = useCallback((id: string, email: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        let status: BulkRowStatus = row.status;
        if (row.status === "missing_email" && email.trim() !== "") {
          status = "ready";
        } else if (row.status === "ready" && email.trim() === "") {
          status = "missing_email";
        }

        return { ...row, email, status };
      }),
    );
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const startCreation = useCallback(async () => {
    const readyRows = rows.filter((r) => r.status === "ready");
    if (readyRows.length === 0) return;

    setStep("progress");
    setProcessed(0);
    setSummary(null);

    setRows((prev) =>
      prev
        .filter((r) => r.status === "ready")
        .map((r) => ({ ...r, processingStatus: "pending" as const })),
    );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/admin/bulk-accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: readyRows.map((r) => ({
            maNhanVien: r.maNhanVien,
            tenNhanVien: r.tenNhanVien,
            email: r.email,
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setSummary({
          done: true,
          total: readyRows.length,
          created: 0,
          emailFailed: 0,
          skipped: readyRows.length,
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;

          try {
            const event = JSON.parse(line) as
              | BulkCreateEvent
              | BulkCreateSummary;

            if ("done" in event && event.done) {
              setSummary(event);
            } else if ("maNhanVien" in event) {
              const ev = event as BulkCreateEvent;
              setProcessed((p) => p + 1);
              setRows((prev) =>
                prev.map((r) =>
                  r.maNhanVien === ev.maNhanVien
                    ? {
                        ...r,
                        processingStatus: ev.stage as ProcessingStatus,
                        processingError: ev.error,
                      }
                    : r,
                ),
              );
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSummary({
        done: true,
        total: readyRows.length,
        created: 0,
        emailFailed: 0,
        skipped: readyRows.length,
      });
    }
  }, [rows]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStep("upload");
    setRows([]);
    setIsValidating(false);
    setValidateError("");
    setSummary(null);
    setProcessed(0);
  }, []);

  return {
    step,
    rows,
    oauth,
    isValidating,
    validateError,
    summary,
    processed,
    total,
    readyCount,
    isDone,
    startOAuthLogin,
    logoutOAuth,
    validate,
    updateRowEmail,
    removeRow,
    startCreation,
    reset,
  };
}
