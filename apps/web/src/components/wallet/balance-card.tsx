"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BanknotesIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  balanceCents: number;
  pendingAmountCents?: number;
  hasPendingDeposit?: boolean;
  className?: string;
}

export function BalanceCard({
  balanceCents,
  pendingAmountCents = 0,
  hasPendingDeposit = false,
  className,
}: BalanceCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Available Balance
        </CardTitle>
        <BanknotesIcon className="h-5 w-5 text-success" />
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-3xl font-bold font-gothic">
          {formatCurrency(balanceCents)}
        </div>
        {hasPendingDeposit && pendingAmountCents > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="text-yellow-500">+{formatCurrency(pendingAmountCents)}</span> pending
          </p>
        )}
      </CardContent>
    </Card>
  );
}
