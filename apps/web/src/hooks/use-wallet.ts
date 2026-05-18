"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";
import { apiGet, apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Wallet, WalletTransaction } from "@/types";

export function useWallet() {
  const { isAuthenticated, token } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiGet<Wallet>(API_ROUTES.WALLET);
      setWallet(response);
    } catch (err) {
      setError("Failed to load wallet");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [isAuthenticated, fetchWallet]);

  // Auto-refresh if there's a pending topup
  useEffect(() => {
    if (!isAuthenticated || !wallet) return;

    const hasPendingTopup = wallet.transactions.some(
      (t) => t.type === "topup" && t.status === "pending"
    );

    if (hasPendingTopup) {
      const interval = setInterval(() => {
        fetchWallet();
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, wallet, fetchWallet]);

  const createTopup = async (
    method: "paypal_ff" | "cashapp" | "ltc",
    amount: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiPost<{
        topup: { id: string; referenceCode: string };
        instructions: {
          paypal_ff?: { destination: string; memoExpected: string };
          cashapp?: {
            square: { applicationId: string; locationId: string; environment: string };
            referenceId: string;
          };
          ltc?: {
            payAddress: string;
            payAmount: number;
            payCurrency: string;
            qrImageUrl?: string;
          };
        };
      }>(API_ROUTES.WALLET_TOPUP, { method, amount });

      // Refresh wallet to see pending topup
      await fetchWallet();

      return response;
    } catch (err) {
      setError("Failed to create topup");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeSquareTopup = async (topupId: string, sourceId: string) => {
    try {
      await apiPost(`${API_ROUTES.WALLET_TOPUP_SQUARE_COMPLETE(topupId)}`, {
        sourceId,
      });
      await fetchWallet();
    } catch (err) {
      console.error("Failed to complete square topup:", err);
      throw err;
    }
  };

  return {
    wallet,
    isLoading,
    error,
    balance: wallet?.balanceCents ?? 0,
    transactions: wallet?.transactions ?? [],
    fetchWallet,
    createTopup,
    completeSquareTopup,
  };
}
