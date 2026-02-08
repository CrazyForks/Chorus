// src/app/api/auth/sync-token/route.ts
// Receives a refreshed OIDC access token from the client and updates the HTTP-only cookie.
// Called after oidc-client-ts performs a silent token renewal on the frontend.

import { NextRequest, NextResponse } from "next/server";
import { errors } from "@/lib/api-response";
import { verifyOidcAccessToken } from "@/lib/oidc-auth";

// POST /api/auth/sync-token
// Body: { accessToken: string }
// Verifies the token, then updates the oidc_access_token cookie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken } = body;

    if (!accessToken || typeof accessToken !== "string") {
      return errors.badRequest("Missing required field: accessToken");
    }

    // Verify the token is legitimate before storing it in a cookie
    const authContext = await verifyOidcAccessToken(accessToken);
    if (!authContext) {
      return errors.unauthorized("Invalid or expired access token");
    }

    const response = NextResponse.json({ success: true });

    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // Update the HTTP-only cookie with the new token
    response.cookies.set("oidc_access_token", accessToken, {
      ...cookieBase,
      maxAge: 3600, // 1 hour
    });

    // Update refresh token if provided (e.g. after token rotation)
    if (refreshToken && typeof refreshToken === "string") {
      response.cookies.set("oidc_refresh_token", refreshToken, {
        ...cookieBase,
        maxAge: 30 * 24 * 3600, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("Sync token error:", error);
    return errors.internal("Failed to sync token");
  }
}
