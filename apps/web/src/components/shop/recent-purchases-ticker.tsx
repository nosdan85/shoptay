"use client";

import { useMemo } from "react";
import { RecentPurchase } from "@/types";
import { cn } from "@/lib/utils";

interface RecentPurchasesTickerProps {
  purchases: RecentPurchase[];
  className?: string;
}

export function RecentPurchasesTicker({
  purchases,
  className,
}: RecentPurchasesTickerProps) {
  const displayPurchases = useMemo(() => {
    if (purchases.length === 0) return [];
    // Duplicate for seamless loop
    return [...purchases, ...purchases];
  }, [purchases]);

  if (purchases.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-hidden border-b border-border bg-[rgba(17,24,39,0.95)] py-2",
        className
      )}
    >
      <div className="ticker-track flex animate-ticker whitespace-nowrap">
        {displayPurchases.map((purchase, index) => (
          <span key={`${purchase.discordUsername}-${index}`} className="mx-4">
            <span className="text-accent font-medium">{purchase.discordUsername}</span>
            <span className="mx-2 text-border">|</span>
            <span className="text-muted-foreground">
              {purchase.quantity > 1 ? `${purchase.quantity}x ` : ""}
              {purchase.productName}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
