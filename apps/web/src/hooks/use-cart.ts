"use client";

import { useCallback } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { Product } from "@/types";

export function useCart() {
  const {
    items,
    coupon,
    discount,
    subtotal,
    total,
    isOpen,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  } = useCartStore();

  const { addToast } = useUIStore();

  const addToCartWithToast = useCallback(
    (product: Product, quantity: number) => {
      addToCart(product, quantity);
      addToast({
        message: `${product.name} added to cart`,
        type: "success",
        duration: 3000,
      });
    },
    [addToCart, addToast]
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    coupon,
    discount,
    subtotal,
    total,
    isOpen,
    isLoading,
    itemCount,
    addToCart: addToCartWithToast,
    addToCartRaw: addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  };
}
