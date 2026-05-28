export function buildAccountEmailHtml(
  tenNhanVien: string,
  email: string,
  password: string,
): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const loginUrl = `${appUrl.replace(/\/+$/, "")}/login`;

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
    <h2 style="color:#1d4ed8;margin-top:0">Thông tin tài khoản chấm công</h2>
    <p>Xin chào <strong>${escapeHtml(tenNhanVien)}</strong>,</p>
    <p>Tài khoản đăng nhập hệ thống kiểm tra chấm công của bạn đã được tạo:</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr>
        <td style="padding:8px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:bold">Tên đăng nhập</td>
        <td style="padding:8px;border:1px solid #e2e8f0">${escapeHtml(email)}</td>
      </tr>
      <tr>
        <td style="padding:8px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:bold">Mật khẩu</td>
        <td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace">${escapeHtml(password)}</td>
      </tr>
    </table>
    <div style="text-align:center;margin:24px 0">
      <a href="${loginUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:bold;font-size:15px">Đăng nhập ngay</a>
    </div>
    <p style="color:#dc2626;font-size:13px">
      Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên.
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px">
      Hoặc truy cập: <a href="${loginUrl}" style="color:#6b7280">${loginUrl}</a>
    </p>
    <p style="color:#9ca3af;font-size:12px">Email này được gửi tự động. Vui lòng không trả lời.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
