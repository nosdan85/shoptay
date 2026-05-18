"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOAuthUrl, setDiscordLinkMethod } from "@/lib/auth";

interface DiscordLoginProps {
  onSuccess?: () => void;
  className?: string;
  variant?: "web" | "app" | "both";
  showLabels?: boolean;
}

export function DiscordLogin({
  onSuccess,
  className,
  variant = "both",
  showLabels = true,
}: DiscordLoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (method: "web" | "app") => {
    setIsLoading(true);
    setDiscordLinkMethod(method);
    const url = getOAuthUrl();

    try {
      if (method === "app") {
        const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
          (typeof window !== "undefined" ? `${window.location.origin}/auth/discord/callback` : "");

        const appUrl = `discord://-/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+guilds.join`;
        const opened = window.open(appUrl, "_blank");

        if (!opened) {
          // Fallback to web if app URL fails
          window.location.href = url;
        }
      } else {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      // Fallback to web on error
      window.location.href = url;
    }
  };

  // Detect if mobile
  const isMobile = typeof window !== "undefined" &&
    /mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent);

  if (variant === "web") {
    return (
      <div className={cn("space-y-4", className)}>
        <Button
          onClick={() => handleLogin("web")}
          className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
          size="lg"
          disabled={isLoading}
        >
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          {isLoading ? "Redirecting..." : "Login with Discord"}
        </Button>

        {showLabels && (
          <p className="text-center text-xs text-muted-foreground">
            You will be redirected to Discord to authorize.
          </p>
        )}
      </div>
    );
  }

  if (variant === "app") {
    return (
      <div className={cn("space-y-4", className)}>
        <Button
          onClick={() => handleLogin("app")}
          className="w-full bg-elevated text-foreground hover:bg-elevated/80"
          size="lg"
          disabled={isLoading}
        >
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          {isLoading ? "Opening..." : "Open Discord App"}
        </Button>

        {showLabels && (
          <p className="text-center text-xs text-muted-foreground">
            Opens Discord app if installed, otherwise redirects to web.
          </p>
        )}
      </div>
    );
  }

  // Both variants (default)
  return (
    <div className={cn("space-y-4", className)}>
      {/* Web login button - primary */}
      <Button
        onClick={() => handleLogin("web")}
        className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
        size="lg"
        disabled={isLoading}
      >
        <svg
          className="mr-2 h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
        {isLoading ? "Redirecting..." : "Login with Discord"}
      </Button>

      {/* App login button - secondary (desktop only) */}
      {!isMobile && (
        <Button
          onClick={() => handleLogin("app")}
          variant="outline"
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Open Discord App
        </Button>
      )}

      {showLabels && (
        <p className="text-center text-xs text-muted-foreground">
          {isMobile
            ? "You will be redirected to Discord to authorize."
            : "Choose web browser or Discord app to login."}
        </p>
      )}
    </div>
  );
}
