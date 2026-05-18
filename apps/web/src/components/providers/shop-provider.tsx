"use client";

import { useEffect, useState } from "react";
import { useShopStore } from "@/stores/shop-store";

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { fetchAll, recentPurchases } = useShopStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAll();
    }
  }, [mounted, fetchAll]);

  // Auto-refresh recent purchases
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      useShopStore.getState().fetchRecentPurchases(30);
    }, 60000);

    return () => clearInterval(interval);
  }, [mounted]);

  return <>{children}</>;
}
