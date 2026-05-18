"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { RecentPurchase } from "@/types";
import { cn } from "@/lib/utils";
import { useNewPurchases } from "@/hooks/use-realtime";

interface TickerBannerProps {
  initialPurchases?: RecentPurchase[];
  className?: string;
  autoRefreshInterval?: number;
}

export function TickerBanner({
  initialPurchases = [],
  className,
  autoRefreshInterval = 30000,
}: TickerBannerProps) {
  const [purchases, setPurchases] = useState<RecentPurchase[]>(initialPurchases);
  const [lastFetched, setLastFetched] = useState<Date>(new Date());
  const { latestPurchase, isConnected } = useNewPurchases();

  // Add new purchase from WebSocket to the list
  useEffect(() => {
    if (latestPurchase) {
      setPurchases((prev) => {
        const newPurchase: RecentPurchase = {
          discordUsername: latestPurchase.discordUsername,
          productName: latestPurchase.productName,
          quantity: 1,
        };
        return [newPurchase, ...prev.slice(0, 29)];
      });
    }
  }, [latestPurchase]);

  // Fallback auto-refresh
  useEffect(() => {
    const fetchRecentPurchases = async () => {
      try {
        const response = await fetch(
          `/api/shop/recent-purchases?limit=30&t=${Date.now()}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.purchases) {
            setPurchases(data.purchases);
            setLastFetched(new Date());
          }
        }
      } catch (error) {
        console.error("Failed to fetch recent purchases:", error);
      }
    };

    const interval = setInterval(fetchRecentPurchases, autoRefreshInterval);
    fetchRecentPurchases();

    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const displayText = useMemo(() => {
    if (purchases.length === 0) return "";

    return purchases
      .map((p) => {
        const qty = p.quantity > 1 ? `${p.quantity}x ` : "";
        return `${p.discordUsername} just got ${qty}${p.productName}`;
      })
      .join("   •   ");
  }, [purchases]);

  if (!displayText) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 py-2",
        className
      )}
    >
      <div className="ticker-track animate-ticker whitespace-nowrap px-4">
        <span className="mx-4 text-sm">{displayText}</span>
        <span className="mx-4 text-sm">{displayText}</span>
      </div>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      {isConnected && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" title="Live updates active" />
        </div>
      )}
    </div>
  );
}
