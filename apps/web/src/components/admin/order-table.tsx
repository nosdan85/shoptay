"use client";

import { useState } from "react";
import { Order } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  onMarkPaid?: (orderId: string, txnId?: string) => Promise<void>;
  onCancel?: (orderId: string, reason?: string) => Promise<void>;
  className?: string;
}

export function OrderTable({ orders, isLoading, onMarkPaid, onCancel, className }: OrderTableProps) {
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [txnId, setTxnId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadge = (status: Order["paymentStatus"]) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "pending":
      case "awaiting":
        return <Badge variant="warning">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status || "Unknown"}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: Order["status"]) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "PENDING":
      case "AWAITING_PAYMENT":
        return <Badge variant="secondary">Pending</Badge>;
      case "PROCESSING":
        return <Badge variant="default">Processing</Badge>;
      case "READY_FOR_DELIVERY":
        return <Badge variant="default">Ready</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "REFUNDED":
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge>{status || "Unknown"}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return "-";
    switch (method.toUpperCase()) {
      case "PAYPAL":
      case "PAYPAL_FF":
        return "PayPal F&F";
      case "CASHAPP":
        return "Cash App";
      case "LITECOIN":
        return "Litecoin";
      case "WALLET":
        return "Wallet";
      case "SQUARE":
        return "Square";
      default:
        return method;
    }
  };

  const openMarkPaidDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setTxnId("");
    setMarkPaidDialogOpen(true);
  };

  const openCancelDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleMarkPaid = async () => {
    if (!selectedOrderId || !onMarkPaid) return;
    setIsProcessing(true);
    try {
      await onMarkPaid(selectedOrderId, txnId || undefined);
      setMarkPaidDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrderId || !onCancel) return;
    setIsProcessing(true);
    try {
      await onCancel(selectedOrderId, cancelReason || undefined);
      setCancelDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={cn("rounded-lg border p-12 text-center", className)}>
        <p className="text-muted-foreground">No orders found.</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("rounded-lg border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Time</TableHead>
              {(onMarkPaid || onCancel) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id || order.id}>
                <TableCell>
                  <span className="font-mono text-xs text-accent">
                    {(order.orderId || order.id || "").slice(0, 8)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.discordUsername || order.discordId || "-"}
                  </div>
                  {order.customerEmail && (
                    <div className="text-xs text-muted-foreground">
                      {order.customerEmail}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell className="text-sm">
                  <div>{getPaymentMethodLabel(order.paymentMethod)}</div>
                  {order.memoExpected && (
                    <div className="text-xs text-muted-foreground">
                      {order.memoExpected}
                    </div>
                  )}
                  <div className="mt-1">{getStatusBadge(order.paymentStatus)}</div>
                </TableCell>
                <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </TableCell>
                {(onMarkPaid || onCancel) && (
                  <TableCell>
                    <div className="flex gap-2">
                      {onMarkPaid && order.paymentStatus?.toLowerCase() !== "completed" && order.paymentStatus?.toLowerCase() !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMarkPaidDialog(order.id || order._id || "")}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      {onCancel && order.status?.toUpperCase() !== "COMPLETED" && order.status?.toUpperCase() !== "CANCELLED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCancelDialog(order.id || order._id || "")}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="txnId">Transaction ID (optional)</Label>
              <Input
                id="txnId"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="Enter PayPal transaction ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason (optional)</Label>
              <Input
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isProcessing}>
              {isProcessing ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
