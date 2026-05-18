"use client";

import { useState, useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: ToastType }>
  >([]);

  const addToast = useCallback(({ message, type, duration = 3000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
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
}
