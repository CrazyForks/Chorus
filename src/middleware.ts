// src/middleware.ts
// Edge Middleware for server-side OIDC token refresh
// Automatically refreshes expired access tokens using refresh_token before requests reach Server Components

import { NextRequest, NextResponse } from "next/server";

// In-memory cache for OIDC discovery documents (per edge instance)
const discoveryCache = new Map<string, { tokenEndpoint: string; expiresAt: number }>();

// Decode JWT payload without verification (Edge Runtime compatible, no Buffer)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → Base64 → decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Get token endpoint from OIDC discovery, with 10-minute cache
async function getTokenEndpoint(issuer: string): Promise<string | null> {
  const cached = discoveryCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tokenEndpoint;
  }

  try {
    const wellKnownUrl = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
    const response = await fetch(wellKnownUrl);
    if (!response.ok) return null;

    const doc = await response.json();
    const tokenEndpoint = doc.token_endpoint;
    if (!tokenEndpoint) return null;

    // Cache for 10 minutes
    discoveryCache.set(issuer, {
      tokenEndpoint,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return tokenEndpoint;
  } catch {
    return null;
  }
}

// Cookie options shared across all auth cookies
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

// Clear all auth cookies and redirect to login
function clearAuthAndRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  const expireOpts = cookieOptions(0);
  response.cookies.set("oidc_access_token", "", expireOpts);
  response.cookies.set("oidc_refresh_token", "", expireOpts);
  response.cookies.set("oidc_client_id", "", expireOpts);
  response.cookies.set("oidc_issuer", "", expireOpts);

  return response;
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("oidc_access_token")?.value;

  // No access token at all — check if we have refresh materials
  if (!accessToken) {
    const refreshToken = request.cookies.get("oidc_refresh_token")?.value;
    if (!refreshToken) {
      // No tokens at all — let the request through (page-level auth will handle redirect)
      return NextResponse.next();
    }
    // Fall through to refresh logic below
  }

  // If we have an access token, check expiry
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload && typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      // If more than 30 seconds until expiry, let it through
      if (payload.exp - now > 30) {
        return NextResponse.next();
      }
    }
  }

  // Token is expired or about to expire — attempt refresh
  const refreshToken = request.cookies.get("oidc_refresh_token")?.value;
  const clientId = request.cookies.get("oidc_client_id")?.value;
  const issuer = request.cookies.get("oidc_issuer")?.value;

  if (!refreshToken || !clientId || !issuer) {
    // Missing refresh materials — cannot refresh, clear and redirect
    return clearAuthAndRedirect(request);
  }

  // Get the token endpoint
  const tokenEndpoint = await getTokenEndpoint(issuer);
  if (!tokenEndpoint) {
    console.error("[middleware] Failed to discover token endpoint for issuer:", issuer);
    return clearAuthAndRedirect(request);
  }

  // Call the token endpoint
  try {
    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("[middleware] Token refresh failed:", tokenResponse.status);
      return clearAuthAndRedirect(request);
    }

    const tokenData = await tokenResponse.json();
    const newAccessToken = tokenData.access_token;

    if (!newAccessToken) {
      console.error("[middleware] No access_token in refresh response");
      return clearAuthAndRedirect(request);
    }

    // Determine maxAge from expires_in or default to 3600
    const expiresIn = typeof tokenData.expires_in === "number" ? tokenData.expires_in : 3600;

    // Write the new access token to the request cookie so downstream Server Components can read it
    request.cookies.set("oidc_access_token", newAccessToken);

    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Write the new access token to the response cookie for the browser
    response.cookies.set("oidc_access_token", newAccessToken, cookieOptions(expiresIn));

    // If the provider returned a new refresh token (token rotation), update it
    if (tokenData.refresh_token) {
      request.cookies.set("oidc_refresh_token", tokenData.refresh_token);
      response.cookies.set("oidc_refresh_token", tokenData.refresh_token, cookieOptions(30 * 24 * 3600));
    }

    return response;
  } catch (error) {
    console.error("[middleware] Token refresh error:", error);
    return clearAuthAndRedirect(request);
  }
}

export const config = {
  matcher: [
    // Match all paths except static assets, login, auth API, and special paths
    "/((?!_next|login|api/auth|skill|favicon\\.ico|.*\\.).*)",
  ],
};
