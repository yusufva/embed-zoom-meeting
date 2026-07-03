import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/meetings?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/meetings?error=No+authorization+code+provided", req.url)
      );
    }

    // Read credentials, with fallback from SDK variables
    const clientId = process.env.ZOOM_API_CLIENT_ID || process.env.ZOOM_SDK_KEY;
    const clientSecret = process.env.ZOOM_API_CLIENT_SECRET || process.env.ZOOM_SDK_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI as string //|| `${new URL(req.url).origin}/api/zoom/callback`;

    if (!clientId || !clientSecret) {
      console.error("Missing Zoom API Client ID or Secret in environment.");
      return NextResponse.redirect(
        new URL("/meetings?error=Server+configuration+error", req.url)
      );
    }

    // Exchange code for Access Token
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errDetails = await tokenResponse.text();
      console.error("Zoom OAuth token exchange failed:", errDetails);
      return NextResponse.redirect(
        new URL("/meetings?error=Token+exchange+failed", req.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 3600; // default to 1 hour

    // Store in cookie securely
    const cookieStore = await cookies();
    cookieStore.set("zoom_access_token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn,
      path: "/",
      sameSite: "none",
    });

    const state = searchParams.get("state") || "";
    const redirectPath = state === "create" ? "/meetings/create" : "/meetings";

    return NextResponse.redirect(new URL(`${redirectPath}?oauth=success&token=${accessToken}`, req.url));
  } catch (err: any) {
    console.error("Error in Zoom OAuth Callback:", err);
    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get("state") || "";
    const redirectPath = state === "create" ? "/meetings/create" : "/meetings";
    return NextResponse.redirect(
      new URL(`${redirectPath}?error=${encodeURIComponent(err.message || "Callback error")}`, req.url)
    );
  }
}
