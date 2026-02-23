// src/app/api/admin/login/route.ts
// Super Admin Password Login API

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, parseBody } from "@/lib/api-handler";
import { errors } from "@/lib/api-response";
import {
  isSuperAdminEmail,
  verifySuperAdminPassword,
  createAdminToken,
  setAdminCookie,
} from "@/lib/super-admin";

interface LoginRequest {
  email: string;
  password: string;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await parseBody<LoginRequest>(request);

  // Validate input
  if (!body.email || typeof body.email !== "string") {
    return errors.validationError({ email: "Email is required" });
  }
  if (!body.password || typeof body.password !== "string") {
    return errors.validationError({ password: "Password is required" });
  }

  const email = body.email.trim().toLowerCase();

  // Validate if this is a Super Admin email
  if (!isSuperAdminEmail(email)) {
    return errors.unauthorized("Invalid credentials");
  }

  // Validate password
  const isValid = await verifySuperAdminPassword(body.password);
  if (!isValid) {
    return errors.unauthorized("Invalid credentials");
  }

  // Create JWT Token
  const token = await createAdminToken();

  // Create response and set Cookie
  const response = NextResponse.json({
    success: true,
    data: {
      email,
      redirectTo: "/admin",
    },
  });

  setAdminCookie(response, token);

  return response;
});
