"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Check, X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  amountCents?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description: string | null;
  orderId: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

interface TransactionListProps {
  transactions: Transaction[];
  className?: string;
}

export function TransactionList({ transactions, className }: TransactionListProps) {
  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [transactions]
  );

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "completed":
        return <Check className="h-3 w-3 text-green-500" />;
      case "rejected":
      case "failed":
        return <X className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="warning" className="text-xs">
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="text-xs">
            Completed
          </Badge>
        );
      case "rejected":
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            {status}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTransactionType = (tx: Transaction) => {
    const type = tx.type?.toLowerCase();
    if (type === "topup" || type === "TOPUP") {
      const method = tx.metadata?.method as string | undefined;
      return `Deposit - ${formatMethod(method)}`;
    }
    if (type === "purchase" || type === "PURCHASE") {
      return "Purchase";
    }
    if (type === "refund" || type === "REFUND") {
      return "Refund";
    }
    if (type === "discount" || type === "DISCOUNT") {
      return "Adjustment";
    }
    return tx.type || "Transaction";
  };

  const formatMethod = (method?: string) => {
    if (!method) return "";
    switch (method.toUpperCase()) {
      case "PAYPAL":
        return "PayPal F&F";
      case "CASHAPP":
        return "Cash App";
      case "SQUARE":
        return "Square";
      case "LITECOIN":
        return "Litecoin";
      case "WALLET":
        return "Wallet";
      default:
        return method;
    }
  };

  const isCredit = (tx: Transaction) => {
    const amount = tx.amountCents ?? Math.round(tx.amount * 100);
    return amount >= 0;
  };

  if (transactions.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No wallet activity yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      isCredit(tx)
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    )}
                  >
                    {isCredit(tx) ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{getTransactionType(tx)}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.orderId && (
                        <span className="font-mono">Order: {tx.orderId.slice(0, 8)}...</span>
                      )}
                      {tx.description && (
                        <span className="ml-1">{tx.description}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-mono font-semibold",
                      isCredit(tx) ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {isCredit(tx) ? "+" : "-"}
                    {formatCurrency(Math.abs(tx.amountCents ?? Math.round(tx.amount * 100)))}
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    {getStatusIcon(tx.metadata?.status as string | undefined)}
                    {getStatusBadge(tx.metadata?.status as string | undefined)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
