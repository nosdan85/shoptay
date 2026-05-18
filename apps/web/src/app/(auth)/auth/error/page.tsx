"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const getErrorMessage = () => {
    if (error === "access_denied") {
      return "Authorization was denied";
    }
    if (error === "invalid_request") {
      return "Invalid authorization request";
    }
    if (error === "unauthorized_client") {
      return "Unauthorized client";
    }
    if (error === "unsupported_response_type") {
      return "Unsupported response type";
    }
    if (error === "invalid_scope") {
      return "Invalid scope";
    }
    return "Authentication failed";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">{getErrorMessage()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {errorDescription ||
              "There was a problem completing your authentication. Please try again."}
          </p>

          {error && (
            <div className="rounded bg-muted p-2 text-xs">
              <p className="font-semibold text-muted-foreground">Error Code</p>
              <p className="font-mono">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => (window.location.href = "/login")}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
