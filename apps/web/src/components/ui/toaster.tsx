"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useUIStore } from "@/stores/ui-store";

export function Toaster() {
  const toasts = useUIStore((state) => state.toasts);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, message, type, ...props }) {
        return (
          <Toast key={id} variant={type} {...props}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <ToastTitle>
                  {type === "success" && "Success"}
                  {type === "error" && "Error"}
                  {type === "warning" && "Warning"}
                  {type === "info" && "Info"}
                </ToastTitle>
                <ToastDescription>{message}</ToastDescription>
              </div>
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
