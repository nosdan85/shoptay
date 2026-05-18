"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FaPaypal, FaCcSquare } from "react-icons/fa";
import { SiLitecoin } from "react-icons/si";

interface PaymentMethodsProps {
  onSelectMethod: (method: "paypal_ff" | "cashapp" | "ltc") => void;
  isLoading?: boolean;
  className?: string;
}

export function PaymentMethods({
  onSelectMethod,
  isLoading,
  className,
}: PaymentMethodsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {/* PayPal F&F */}
      <Button
        variant="outline"
        onClick={() => onSelectMethod("paypal_ff")}
        disabled={isLoading}
        className="flex h-auto flex-col gap-3 py-6"
      >
        <FaPaypal className="h-10 w-10 text-[#0070ba]" />
        <span className="text-sm font-medium">PayPal</span>
        <span className="text-xs text-muted-foreground">Friends & Family</span>
      </Button>

      {/* Cash App */}
      <Button
        variant="outline"
        onClick={() => onSelectMethod("cashapp")}
        disabled={isLoading}
        className="flex h-auto flex-col gap-3 py-6"
      >
        <FaCcSquare className="h-10 w-10 text-[#00d632]" />
        <span className="text-sm font-medium">Cash App</span>
        <span className="text-xs text-muted-foreground">+10% conversion</span>
      </Button>

      {/* Litecoin */}
      <Button
        variant="outline"
        onClick={() => onSelectMethod("ltc")}
        disabled={isLoading}
        className="flex h-auto flex-col gap-3 py-6"
      >
        <SiLitecoin className="h-10 w-10 text-[#bfbbbb]" />
        <span className="text-sm font-medium">Litecoin</span>
        <span className="text-xs text-muted-foreground">Crypto</span>
      </Button>
    </div>
  );
}
