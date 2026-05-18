import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, CartItem, Coupon, CartItemPricing } from "@/types";
import { calculateItemPricing, MAX_UI_QUANTITY } from "@/lib/utils";
import { apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  discount: number; // in cents
  subtotal: number; // in cents
  total: number; // in cents
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  recalculateTotals: () => void;
}

const calculateTotals = (
  items: CartItem[],
  coupon: Coupon | null
): { subtotal: number; discount: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.pricing.lineTotal, 0);
  let discount = 0;

  if (coupon && coupon.discountAmount > 0) {
    discount = coupon.discountAmount;
  }

  const total = Math.max(0, subtotal - discount);

  return { subtotal, discount, total };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      discount: 0,
      subtotal: 0,
      total: 0,
      isOpen: false,
      isLoading: false,

      addToCart: (product, quantity) => {
        const { items } = get();
        const normalizedQuantity = Math.min(Math.max(1, quantity), MAX_UI_QUANTITY);

        const existingIndex = items.findIndex(
          (item) => item.product._id === product._id
        );

        let newItems: CartItem[];

        if (existingIndex >= 0) {
          // Update existing item
          const existing = items[existingIndex];
          const newQuantity = Math.min(
            existing.quantity + normalizedQuantity,
            MAX_UI_QUANTITY
          );
          const pricing = calculateItemPricing(
            product.price,
            product.bulkPrice,
            newQuantity
          );

          newItems = [...items];
          newItems[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            pricing,
          };
        } else {
          // Add new item
          const pricing = calculateItemPricing(
            product.price,
            product.bulkPrice,
            normalizedQuantity
          );

          newItems = [
            ...items,
            {
              product,
              quantity: normalizedQuantity,
              pricing,
            },
          ];
        }

        const totals = calculateTotals(newItems, get().coupon);

        set({
          items: newItems,
          ...totals,
        });
      },

      removeFromCart: (productId) => {
        const newItems = get().items.filter(
          (item) => item.product._id !== productId
        );
        const totals = calculateTotals(newItems, get().coupon);
        set({ items: newItems, ...totals });
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        const normalizedQuantity = Math.min(Math.max(1, quantity), MAX_UI_QUANTITY);

        const newItems = items.map((item) => {
          if (item.product._id === productId) {
            const pricing = calculateItemPricing(
              item.product.price,
              item.product.bulkPrice,
              normalizedQuantity
            );
            return { ...item, quantity: normalizedQuantity, pricing };
          }
          return item;
        });

        const totals = calculateTotals(newItems, get().coupon);
        set({ items: newItems, ...totals });
      },

      applyCoupon: async (code) => {
        set({ isLoading: true });

        try {
          const response = await apiPost<{
            valid: boolean;
            discount: number;
            discountPercent: number;
            finalTotal: number;
            message?: string;
          }>(API_ROUTES.COUPON_PREVIEW, {
            couponCode: code,
            subtotal: get().subtotal,
          });

          if (response.valid) {
            const coupon: Coupon = {
              code: code.toUpperCase(),
              discountPercent: response.discountPercent,
              discountAmount: response.discount,
            };

            const totals = calculateTotals(get().items, coupon);
            set({ coupon, ...totals, isLoading: false });
            return {
              success: true,
              message: `Applied ${response.discountPercent}% discount`,
            };
          } else {
            return {
              success: false,
              message: response.message || "Invalid coupon code",
            };
          }
        } catch (error) {
          return {
            success: false,
            message: "Failed to apply coupon",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      removeCoupon: () => {
        const totals = calculateTotals(get().items, null);
        set({ coupon: null, ...totals });
      },

      clearCart: () => {
        set({
          items: [],
          coupon: null,
          discount: 0,
          subtotal: 0,
          total: 0,
        });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      recalculateTotals: () => {
        const { items, coupon } = get();
        const totals = calculateTotals(items, coupon);
        set(totals);
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
        discount: state.discount,
        subtotal: state.subtotal,
        total: state.total,
      }),
    }
  )
);

// Selectors
export const selectCartItems = (state: CartState) => state.items;
export const selectCartTotal = (state: CartState) => state.total;
export const selectCartItemCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectIsCartEmpty = (state: CartState) => state.items.length === 0;
