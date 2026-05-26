import nodemailer from "nodemailer";

interface OutlookOAuthConfig {
  fromEmail: string;
  fromName: string;
  accessToken: string;
}

export async function sendOutlookEmail(
  config: OutlookOAuthConfig,
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        type: "OAuth2",
        user: config.fromEmail,
        accessToken: config.accessToken,
      },
      tls: { ciphers: "SSLv3", rejectUnauthorized: false },
    });

    await transport.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromEmail}>`
        : config.fromEmail,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
