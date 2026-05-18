"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TopupFormProps {
  onSubmit: (method: "paypal_ff" | "cashapp" | "ltc", amount: number) => Promise<void>;
  isLoading: boolean;
  className?: string;
}

export function TopupForm({ onSubmit, isLoading, className }: TopupFormProps) {
  const [method, setMethod] = useState<"paypal_ff" | "cashapp" | "ltc">("paypal_ff");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      alert("Please enter a valid amount (minimum $1)");
      return;
    }
    await onSubmit(method, Math.round(amountNum * 100));
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Top Up Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method Selection */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={method === "paypal_ff" ? "default" : "outline"}
                onClick={() => setMethod("paypal_ff")}
                className="text-xs"
              >
                PayPal F&F
              </Button>
              <Button
                type="button"
                variant={method === "cashapp" ? "default" : "outline"}
                onClick={() => setMethod("cashapp")}
                className="text-xs"
              >
                Cash App
              </Button>
              <Button
                type="button"
                variant={method === "ltc" ? "default" : "outline"}
                onClick={() => setMethod("ltc")}
                className="text-xs"
              >
                Litecoin
              </Button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum amount: $1.00
              {method === "cashapp" && " (Cash App charges 10% conversion fee)"}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !amount}>
            {isLoading ? "Creating..." : "Continue to Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
