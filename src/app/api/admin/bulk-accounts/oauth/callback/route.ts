import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildOAuthCookies } from "@/lib/helpers/oauth-cookie";

const REDIRECT_URI_PATH = "/api/admin/bulk-accounts/oauth/callback";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (error) {
    console.error("[OAuth callback] Error:", errorDescription ?? error);
    return redirectTo(baseUrl, errorDescription ?? error);
  }

  if (!code || !state) {
    return redirectTo(baseUrl, "Thiếu tham số OAuth");
  }

  const store = await cookies();
  const savedState = store.get("oauth_state")?.value;
  store.delete("oauth_state");

  console.log("[OAuth callback] state match:", state === savedState, "saved:", !!savedState);
  if (state !== savedState) {
    return redirectTo(baseUrl, "OAuth state không hợp lệ");
  }

  const clientId = process.env.AZURE_AD_CLIENT_ID!;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}${REDIRECT_URI_PATH}`;

  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "openid email profile offline_access https://outlook.office365.com/SMTP.Send",
      }),
    },
  );

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error("[OAuth callback] Token exchange failed:", errBody);
    return redirectTo(baseUrl, "Không thể lấy token từ Microsoft");
  }

  const tokenData = (await tokenRes.json()) as TokenResponse;

  let email = "";
  let name = "";
  if (tokenData.id_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(tokenData.id_token.split(".")[1], "base64").toString(),
      );
      email = payload.preferred_username ?? payload.email ?? "";
      name = payload.name ?? "";
    } catch {
      // fallback: no user info
    }
  }

  const { chunks, options } = buildOAuthCookies({
    accessToken: tokenData.access_token,
    email,
    name,
    expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
  });

  console.log("[OAuth callback] SUCCESS - email:", email, "chunks:", chunks.length);
  const response = NextResponse.redirect(new URL("/admin/users", baseUrl));
  for (const chunk of chunks) {
    response.cookies.set(chunk.name, chunk.value, options);
  }
  return response;
}

function redirectTo(baseUrl: string, error: string): NextResponse {
  const url = new URL("/admin/users", baseUrl);
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}
