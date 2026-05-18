"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type AuthStatus =
  | "loading"
  | "authenticating"
  | "success"
  | "error";

interface AuthError {
  message: string;
  code: string;
  status?: number;
  retryAfterMs?: number;
}

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginDiscord, initialize, token } = useAuthStore();

  const [status, setStatus] = useState<AuthStatus>("loading");
  const [statusMessage, setStatusMessage] = useState("Checking authentication...");
  const [debugInfo, setDebugInfo] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [needsFreshOauth, setNeedsFreshOauth] = useState(false);
  const [retryInSeconds, setRetryInSeconds] = useState(0);
  const [nonce, setNonce] = useState(0);

  // Exponential backoff configuration
  const BASE_RETRY_DELAY_MS = 2000;
  const MAX_RETRY_DELAY_MS = 15000;
  const MAX_RETRIES = 2;

  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const getOAuthUrl = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = typeof window !== "undefined"
      ? `${window.location.origin}/auth/discord/callback`
      : process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;
    const state = generateState();
    const scopes = encodeURIComponent("identify guilds.join");

    sessionStorage.setItem("oauth_state", state);

    return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || "")}&response_type=code&scope=${scopes}&state=${state}&prompt=consent`;
  }, []);

  const handleRetry = useCallback(() => {
    if (retryInSeconds > 0) return;

    setStatus("loading");
    setDebugInfo("");
    setCanRetry(false);
    setNeedsFreshOauth(false);
    setRetryInSeconds(0);
    setNonce((n) => n + 1);
  }, [retryInSeconds]);

  const handleGoToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const authenticate = useCallback(async () => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle OAuth error from Discord
    if (error) {
      setStatus("error");

      if (error === "access_denied") {
        setStatusMessage("Authorization was denied.");
        setDebugInfo("You cancelled the Discord authorization.");
      } else if (error === "invalid_request") {
        setStatusMessage("Invalid authorization request.");
        setDebugInfo(errorDescription || error);
      } else {
        setStatusMessage("Discord authorization was not completed.");
        setDebugInfo(errorDescription || error);
      }

      setCanRetry(true);
      setNeedsFreshOauth(true);
      return;
    }

    // Verify state parameter (CSRF protection)
    const storedState = sessionStorage.getItem("oauth_state");
    if (state && storedState && state !== storedState) {
      setStatus("error");
      setStatusMessage("Invalid state parameter. Please try again.");
      setDebugInfo("CSRF validation failed. Please retry the login process.");
      setCanRetry(true);
      setNeedsFreshOauth(true);
      return;
    }

    if (!code) {
      setStatus("error");
      setStatusMessage("No authorization code received.");
      setDebugInfo("Missing 'code' parameter in OAuth callback.");
      setCanRetry(true);
      setNeedsFreshOauth(true);
      return;
    }

    // Begin authentication
    setStatus("authenticating");
    setStatusMessage("Authenticating with Discord...");

    const redirectUri = typeof window !== "undefined"
      ? `${window.location.origin}/auth/discord/callback`
      : process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;

    let attempt = 0;
    let delay = BASE_RETRY_DELAY_MS;

    while (attempt <= MAX_RETRIES) {
      try {
        const response = await api.post<{
          user: any;
          token: string;
          refreshToken?: string;
          expiresIn: number;
          isOwner: boolean;
        }>(
          API_ROUTES.DISCORD_AUTH,
          { code, redirect_uri: redirectUri },
          { timeout: 15000 }
        );

        // Success
        loginDiscord(response.user, response.token, response.refreshToken);
        setStatus("success");
        setStatusMessage("Authentication successful! Redirecting...");

        // Clear OAuth state
        sessionStorage.removeItem("oauth_state");

        // Redirect after brief delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
        return;

      } catch (err: unknown) {
        const error = err as AuthError & { status?: number; data?: { retryAfterMs?: number; retryAfterSeconds?: number; error?: string } };

        attempt++;
        const isRetryable =
          error.code === "ECONNABORTED" ||
          error.status === 503 ||
          error.status === 502 ||
          error.status === 504;

        // Check for permanent failure conditions
        const isPermanentFailure =
          error.status === 400 ||
          error.code === "invalid_client" ||
          error.data?.error === "invalid_client" ||
          error.code === "invalid_grant";

        if (isPermanentFailure) {
          setStatus("error");
          setNeedsFreshOauth(true);

          if (error.code === "invalid_client" || error.data?.error === "invalid_client") {
            setStatusMessage("Discord app credentials are invalid.");
            setDebugInfo("Please contact the administrator to fix the Discord OAuth configuration.");
          } else {
            setStatusMessage("Authorization expired or invalid.");
            setDebugInfo("Please login again to get a new authorization code.");
          }
          setCanRetry(true);
          return;
        }

        // Check if this is a rate limit error
        if (error.status === 429) {
          const retryAfterMs = error.data?.retryAfterMs ||
            (error.data?.retryAfterSeconds || 60) * 1000 ||
            error.retryAfterMs;

          setStatusMessage("Too many requests. Please wait...");
          setRetryInSeconds(Math.ceil(retryAfterMs / 1000));

          // Start countdown
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = setInterval(() => {
            setRetryInSeconds((prev) => {
              if (prev <= 1) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          // Wait for retry-after period then retry
          retryTimerRef.current = setTimeout(() => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setRetryInSeconds(0);
          }, retryAfterMs);

          return;
        }

        // Retryable error - exponential backoff
        if (isRetryable && attempt <= MAX_RETRIES) {
          setStatusMessage(`Retrying... (attempt ${attempt}/${MAX_RETRIES + 1})`);

          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
          continue;
        }

        // Max retries exceeded or non-retryable error
        setStatus("error");

        if (error.code === "ECONNABORTED") {
          setStatusMessage("Authentication request timed out.");
          setDebugInfo("The server took too long to respond. Please try again.");
        } else if (error.status === 503) {
          setStatusMessage("Authentication service is temporarily unavailable.");
          setDebugInfo("The server is experiencing issues. Please try again later.");
        } else {
          setStatusMessage(error.message || "Authentication failed.");
          setDebugInfo(
            `Error: ${error.message || "Unknown error"}\n` +
            `Status: ${error.status || "N/A"}\n` +
            `Code: ${error.code || "N/A"}`
          );
        }

        setCanRetry(true);
        setNeedsFreshOauth(true);
        return;
      }
    }
  }, [searchParams, loginDiscord, router]);

  useEffect(() => {
    // Initialize auth store
    initialize();

    // Run authentication
    authenticate();
  }, [initialize, nonce, authenticate]);

  // Redirect for fresh OAuth
  const handleFreshOAuth = () => {
    if (typeof window !== "undefined") {
      window.location.href = getOAuthUrl();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          {status === "loading" || status === "authenticating" ? (
            <>
              <Spinner size="xl" className="mx-auto mb-4" />
              <p className="text-lg font-medium">{statusMessage}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {status === "authenticating"
                  ? "This may take a few seconds..."
                  : "Please wait..."}
              </p>
            </>
          ) : status === "success" ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <svg
                  className="h-8 w-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-green-500">{statusMessage}</p>
            </>
          ) : (
            <>
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-red-500">{statusMessage}</p>

              {debugInfo && (
                <div className="mt-4 rounded bg-muted p-3 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Debug Info
                  </p>
                  <pre className="max-h-32 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap">
                    {debugInfo}
                  </pre>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                {canRetry && (
                  <Button
                    onClick={retryInSeconds > 0 ? undefined : handleRetry}
                    disabled={retryInSeconds > 0}
                  >
                    {retryInSeconds > 0
                      ? `Retry in ${retryInSeconds}s`
                      : "Retry"}
                  </Button>
                )}

                {needsFreshOauth && (
                  <Button variant="outline" onClick={handleFreshOAuth}>
                    Login with Discord Again
                  </Button>
                )}

                <Button variant="ghost" onClick={handleGoHome}>
                  Go to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Generate random state for OAuth
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
