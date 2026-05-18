"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { apiGet, apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Order, CheckoutResponse, OrderPaymentInfo } from "@/types";
import { useRouter } from "next/navigation";

export function useOrders() {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(
    async (items: Array<{ productId: string; quantity: number }>) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiPost<CheckoutResponse>(API_ROUTES.CHECKOUT, {
          items,
        });

        // Navigate to payment page
        router.push(`/pay?orderId=${response.orderId}`);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create order. Please try again.";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const getOrderPaymentInfo = useCallback(
    async (orderId: string): Promise<OrderPaymentInfo | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiGet<{
          order: Order;
          isPaid: boolean;
          channelId?: string;
          ticketStatus?: string;
        }>(`${API_ROUTES.ORDER_PAYMENT_INFO}?orderId=${orderId}`);

        return {
          order: response.order,
          isPaid: response.isPaid,
          channelId: response.channelId,
          ticketStatus: response.ticketStatus as OrderPaymentInfo["ticketStatus"],
        };
      } catch (err) {
        setError("Failed to load order");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const selectDeliverySlot = useCallback(
    async (orderId: string, slotId: string, customerTimezone: string) => {
      try {
        await apiPost(API_ROUTES.DELIVERY_SLOT(orderId), {
          slotId,
          customerTimezone,
        });
      } catch (err) {
        setError("Failed to select delivery slot");
        throw err;
      }
    },
    []
  );

  const linkRoblox = useCallback(
    async (
      orderId: string,
      robloxUsername: string,
      robloxUserId: string,
      robloxDisplayName: string
    ) => {
      try {
        await apiPost(API_ROUTES.LINK_ROBLOX(orderId), {
          robloxUsername,
          robloxUserId,
          robloxDisplayName,
        });
      } catch (err) {
        setError("Failed to link Roblox account");
        throw err;
      }
    },
    []
  );

  const confirmDelivery = useCallback(async (orderId: string) => {
    try {
      const response = await apiPost<{ couponCode: string }>(
        API_ROUTES.CONFIRM_DELIVERY(orderId)
      );
      return response;
    } catch (err) {
      setError("Failed to confirm delivery");
      throw err;
    }
  }, []);

  const createTicket = useCallback(async (orderId: string) => {
    setIsLoading(true);
    try {
      const response = await apiPost<{ channelId: string }>(
        API_ROUTES.CREATE_TICKET,
        { orderId }
      );
      return response;
    } catch (err) {
      setError("Failed to create ticket");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    checkout,
    getOrderPaymentInfo,
    selectDeliverySlot,
    linkRoblox,
    confirmDelivery,
    createTicket,
  };
}
