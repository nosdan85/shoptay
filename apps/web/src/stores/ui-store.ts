import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;

  // Modals
  isProductModalOpen: boolean;
  selectedProductId: string | null;
  openProductModal: (productId: string) => void;
  closeProductModal: () => void;

  // Toast queue
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Proof notice
  proofNoticeSeen: boolean;
  dismissProofNotice: () => void;

  // Admin sidebar
  isAdminSidebarCollapsed: boolean;
  toggleAdminSidebar: () => void;
  setAdminSidebarCollapsed: (collapsed: boolean) => void;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: "dark",
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== "undefined") {
          const root = document.documentElement;
          root.classList.remove("light", "dark");
          if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
              .matches
              ? "dark"
              : "light";
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      },

      // Mobile menu
      isMobileMenuOpen: false,
      openMobileMenu: () => set({ isMobileMenuOpen: true }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

      // Product modal
      isProductModalOpen: false,
      selectedProductId: null,
      openProductModal: (productId) =>
        set({ isProductModalOpen: true, selectedProductId: productId }),
      closeProductModal: () =>
        set({ isProductModalOpen: false, selectedProductId: null }),

      // Toasts
      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // Auto remove after duration
        const duration = toast.duration ?? 3000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Proof notice
      proofNoticeSeen: false,
      dismissProofNotice: () => {
        set({ proofNoticeSeen: true });
        if (typeof window !== "undefined") {
          localStorage.setItem("orderProofNoticeSeenV1", "true");
        }
      },

      // Admin sidebar
      isAdminSidebarCollapsed: false,
      toggleAdminSidebar: () =>
        set((state) => ({ isAdminSidebarCollapsed: !state.isAdminSidebarCollapsed })),
      setAdminSidebarCollapsed: (collapsed) =>
        set({ isAdminSidebarCollapsed: collapsed }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        theme: state.theme,
        proofNoticeSeen: state.proofNoticeSeen,
        isAdminSidebarCollapsed: state.isAdminSidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          // Check localStorage for proof notice
          const proofSeen = localStorage.getItem("orderProofNoticeSeenV1");
          if (proofSeen === "true") {
            state.proofNoticeSeen = true;
          }

          // Apply theme
          const root = document.documentElement;
          root.classList.remove("light", "dark");
          if (state.theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
              .matches
              ? "dark"
              : "light";
            root.classList.add(systemTheme);
          } else {
            root.classList.add(state.theme);
          }
        }
      },
    }
  )
);

// Helper hooks
export const useToast = () => {
  const { addToast, removeToast } = useUIStore();

  return {
    success: (message: string, duration?: number) =>
      addToast({ message, type: "success", duration }),
    error: (message: string, duration?: number) =>
      addToast({ message, type: "error", duration }),
    info: (message: string, duration?: number) =>
      addToast({ message, type: "info", duration }),
    warning: (message: string, duration?: number) =>
      addToast({ message, type: "warning", duration }),
    dismiss: removeToast,
  };
};
