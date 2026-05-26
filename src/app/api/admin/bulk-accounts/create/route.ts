import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { createUser, findRegisteredCodes } from "@/lib/queries/users";
import { sendOutlookEmail } from "@/lib/email/outlook-client";
import { buildAccountEmailHtml } from "@/lib/email/account-email-template";
import { generatePassword } from "@/lib/helpers/password";
import { getOAuthToken } from "@/lib/helpers/oauth-cookie";

interface BulkCreateRow {
  maNhanVien: string;
  tenNhanVien: string;
  email: string;
}

const DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== ROLES.ADMIN) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const oauthToken = await getOAuthToken();
  if (!oauthToken) {
    return new Response(
      JSON.stringify({ error: "Chưa đăng nhập Outlook" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = (await request.json()) as { rows: BulkCreateRow[] };
  const rows = body.rows ?? [];

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: "Không có dữ liệu" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const codes = rows.map((r) => r.maNhanVien);
  const alreadyRegistered = new Set(await findRegisteredCodes(codes));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let created = 0;
      let emailFailed = 0;
      let skipped = 0;

      for (const row of rows) {
        if (alreadyRegistered.has(row.maNhanVien)) {
          skipped++;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                maNhanVien: row.maNhanVien,
                success: false,
                stage: "skipped",
                error: "Đã có tài khoản",
              })}\n\n`,
            ),
          );
          await sleep(DELAY_MS);
          continue;
        }

        const password = generatePassword();

        try {
          await createUser({
            maNhanVien: row.maNhanVien,
            tenNhanVien: row.tenNhanVien,
            email: row.email,
            password,
            role: "employee",
          });
          created++;
        } catch (err) {
          skipped++;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                maNhanVien: row.maNhanVien,
                success: false,
                stage: "skipped",
                error:
                  err instanceof Error ? err.message : "Lỗi tạo tài khoản",
              })}\n\n`,
            ),
          );
          await sleep(DELAY_MS);
          continue;
        }

        const emailResult = await sendOutlookEmail(
          {
            fromEmail: oauthToken.email,
            fromName: oauthToken.name || "VT Check Attendance",
            accessToken: oauthToken.accessToken,
          },
          row.email,
          "Thông tin tài khoản chấm công",
          buildAccountEmailHtml(row.tenNhanVien, row.email, password),
        );

        if (emailResult.success) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                maNhanVien: row.maNhanVien,
                success: true,
                stage: "email_sent",
              })}\n\n`,
            ),
          );
        } else {
          emailFailed++;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                maNhanVien: row.maNhanVien,
                success: true,
                stage: "email_failed",
                error: emailResult.error,
              })}\n\n`,
            ),
          );
        }

        await sleep(DELAY_MS);
      }

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            done: true,
            total: rows.length,
            created,
            emailFailed,
            skipped,
          })}\n\n`,
        ),
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
