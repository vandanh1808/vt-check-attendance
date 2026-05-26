import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function GET() {
  const clientId = process.env.AZURE_AD_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Azure AD chưa được cấu hình" },
      { status: 500 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/admin/bulk-accounts/oauth/callback`;
  const scope = "openid email profile offline_access https://outlook.office365.com/SMTP.Send";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope,
    state,
    response_mode: "query",
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;

  return NextResponse.redirect(authUrl);
}
