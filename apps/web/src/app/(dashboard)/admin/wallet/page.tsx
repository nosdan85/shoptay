"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { WalletTransaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PendingTopup {
  _id: string;
  referenceCode: string;
  amountCents: number;
  method: string;
  discordId?: string;
  discordUsername?: string;
  paymentAddress?: string;
  memoExpected?: string;
  status: string;
  createdAt: string;
}

export default function WalletAdminPage() {
  const router = useRouter();
  const { isOwner, isLoading: authLoading } = useAuth();
  const [pendingTopups, setPendingTopups] = useState<PendingTopup[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push("/");
    }
  }, [authLoading, isOwner, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiGet<{
          pendingTopups: PendingTopup[];
          transactions: WalletTransaction[];
        }>(API_ROUTES.ADMIN_WALLET);

        setPendingTopups(response.pendingTopups || []);
        setTransactions(response.transactions || []);
      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOwner) {
      fetchData();
    }
  }, [isOwner]);

  if (authLoading || !isOwner) {
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="mb-2 font-gothic text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage wallets and topups</p>
      </div>

      {/* Pending Topups */}
      <div>
        <h2 className="mb-4 font-gothic text-xl font-semibold">
          Pending Provider Confirmations
        </h2>
        {pendingTopups.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No pending topups
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTopups.map((topup) => (
                <TableRow key={topup._id}>
                  <TableCell>
                    <Badge
                      variant={
                        topup.status === "pending"
                          ? "warning"
                          : topup.status === "completed"
                          ? "success"
                          : "destructive"
                      }
                    >
                      {topup.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{topup.referenceCode}</TableCell>
                  <TableCell className="font-mono text-success">
                    +{formatCurrency(topup.amountCents)}
                  </TableCell>
                  <TableCell>{topup.discordUsername || topup.discordId || "-"}</TableCell>
                  <TableCell>{topup.method}</TableCell>
                  <TableCell className="text-xs">
                    {topup.paymentAddress && (
                      <div>Address: {topup.paymentAddress.slice(0, 10)}...</div>
                    )}
                    {topup.memoExpected && <div>Note: {topup.memoExpected}</div>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(topup.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          No action buttons — waiting for PayPal, Square, or NOWPayments confirmation
        </p>
      </div>

      {/* All Transactions */}
      <div>
        <h2 className="mb-4 font-gothic text-xl font-semibold">
          Wallet Transactions
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx._id}>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(tx.createdAt)}
                </TableCell>
                <TableCell>{tx.discordUsername || "-"}</TableCell>
                <TableCell>
                  {tx.type} {tx.method && `- ${tx.method}`}
                </TableCell>
                <TableCell
                  className={`font-mono ${
                    tx.direction === "credit" ? "text-success" : "text-destructive"
                  }`}
                >
                  {tx.direction === "credit" ? "+" : "-"}
                  {formatCurrency(tx.amountCents)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tx.status === "completed"
                        ? "success"
                        : tx.status === "pending"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {tx.referenceCode || tx.orderId?.slice(0, 8) || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
