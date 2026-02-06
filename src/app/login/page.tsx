"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserManager, storeOidcConfig, type OidcConfig } from "@/lib/oidc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || "An error occurred");
        return;
      }

      const result = data.data;

      if (result.type === "super_admin") {
        router.push(`/login/admin?email=${encodeURIComponent(email)}`);
      } else if (result.type === "oidc" && result.company) {
        // Store OIDC config for callback use
        const oidcConfig: OidcConfig = {
          issuer: result.company.oidcIssuer,
          clientId: result.company.oidcClientId,
          companyUuid: result.company.uuid,
          companyName: result.company.name,
        };
        storeOidcConfig(oidcConfig);

        // Create UserManager and initiate login
        const userManager = createUserManager(oidcConfig);

        // Redirect to OIDC provider
        await userManager.signinRedirect({
          extraQueryParams: {
            login_hint: email,
          },
        });
      } else {
        setError(result.message || "No organization found for this email");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px]">
        <CardContent className="p-10">
          {/* Logo Section */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <Music className="h-12 w-12 text-foreground" />
            <h1 className="text-[28px] font-semibold text-foreground">Chorus</h1>
            <p className="text-sm text-muted-foreground">
              AI-Human Collaboration Platform
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Checking..." : "Continue"}
            </Button>
          </form>

          {/* Help Text */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Enter your email to sign in or create an account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
