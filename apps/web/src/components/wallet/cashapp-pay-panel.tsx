"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<Payments>;
    };
  }
}

interface Payments {
  cashAppPay: (options: CashAppPayOptions) => CashAppPay;
}

interface CashAppPayOptions {
  redirectURL: string;
  referenceId: string;
}

interface CashAppPay {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
}

interface TokenResult {
  token: string;
}

interface CashAppPayPanelProps {
  topupId: string;
  referenceId: string;
  amount: number;
  onComplete: (sourceId: string) => Promise<void>;
  className?: string;
}

export function CashAppPayPanel({
  topupId,
  referenceId,
  amount,
  onComplete,
  className,
}: CashAppPayPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadSquare = async () => {
      const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
      const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || "sandbox";

      if (!appId || !locationId) {
        setError("Square configuration missing");
        setIsLoading(false);
        return;
      }

      // Load Square SDK if not already loaded
      if (!window.Square) {
        const script = document.createElement("script");
        script.src = "https://web.squarecdn.com/v1/square.js";
        script.async = true;
        script.onload = async () => {
          await initializePayments(appId, locationId);
        };
        script.onerror = () => {
          setError("Failed to load Square SDK");
          setIsLoading(false);
        };
        document.body.appendChild(script);
      } else {
        await initializePayments(appId, locationId);
      }
    };

    const initializePayments = async (appId: string, locationId: string) => {
      try {
        const payments = await window.Square!.payments(appId, locationId);
        const cashAppPay = await payments.cashAppPay({
          redirectURL: window.location.href,
          referenceId,
        });

        await cashAppPay.attach(`#cash-app-pay-${topupId}`);

        // Listen for tokenization
        const button = containerRef.current?.querySelector(
          `[data-cash-app-pay-button]`
        );
        if (button) {
          button.addEventListener("click", async () => {
            try {
              setIsProcessing(true);
              const result = await cashAppPay.tokenize();
              if (result.token) {
                await onComplete(result.token);
              }
            } catch (err) {
              setError("Payment failed. Please try again.");
            } finally {
              setIsProcessing(false);
            }
          });
        }

        setIsLoading(false);
      } catch (err) {
        setError("Failed to initialize payment");
        setIsLoading(false);
      }
    };

    loadSquare();
  }, [topupId, referenceId, amount, onComplete]);

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Cash App Pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div
            ref={containerRef}
            id={`cash-app-pay-${topupId}`}
            className="min-h-[60px]"
          />
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing payment...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
