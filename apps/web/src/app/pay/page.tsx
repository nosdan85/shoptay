"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch, apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PaymentMethods } from "@/components/payment/payment-methods";
import { PayPalGuide } from "@/components/payment/paypal-guide";
import { CashAppGuide } from "@/components/payment/cashapp-guide";
import { LTCGuide } from "@/components/payment/ltc-guide";
import { DeliverySlotPicker } from "@/components/payment/delivery-slot-picker";
import { RobloxLinker } from "@/components/payment/roblox-linker";
import { formatCurrency } from "@/lib/format";
import { getDiscordInviteUrl } from "@/lib/auth";
import {
  ClipboardDocumentListIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  TicketIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface OrderPaymentInfo {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  robloxUsername?: string;
  robloxUserId?: string;
  deliverySlot?: {
    startAt: Date;
    endAt: Date;
    ownerTimezone: string;
    customerTimezone?: string;
    customerStartAt?: Date;
    customerEndAt?: Date;
  };
  channelId?: string;
  channelName?: string;
  ticketStatus: string;
  createdAt: Date;
  expiresAt: Date;
}

type PaymentState = "loading" | "error" | "unpaid" | "paid";

export default function PayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const orderId = searchParams.get("orderId");
  const paidFromUrl = searchParams.get("paid") === "1";

  const [state, setState] = useState<PaymentState>("loading");
  const [orderInfo, setOrderInfo] = useState<OrderPaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  // Payment method state
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paypalData, setPaypalData] = useState<{
    destination: string;
    memoExpected: string;
    channelId?: string;
  } | null>(null);
  const [cashAppData, setCashAppData] = useState<{ handle: string } | null>(null);
  const [ltcData, setLtcData] = useState<{
    payAddress: string;
    payAmount: number;
    qrImageUrl?: string;
  } | null>(null);

  // Delivery state
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Loading states
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketRetryInSeconds, setTicketRetryInSeconds] = useState(0);
  const [paypalTicketRetryInSeconds, setPaypalTicketRetryInSeconds] = useState(0);
  const [ltcTicketRetryInSeconds, setLtcTicketRetryInSeconds] = useState(0);

  // Confirmation state
  const [confirmationDiscountCode, setConfirmationDiscountCode] = useState<string | null>(null);

  const fetchOrderInfo = useCallback(async () => {
    if (!orderId) {
      setState("error");
      setError("Invalid payment link. No order ID provided.");
      return;
    }

    try {
      const response = await apiFetch<OrderPaymentInfo>(
        `${API_ROUTES.ORDER_PAYMENT_INFO.replace("orderId=X", "")}/${orderId}/payment-info`
      );

      setOrderInfo(response);
      const isPaid = response.paymentStatus === "COMPLETED" || response.status === "PAID" || paidFromUrl;
      setPaid(isPaid);
      setState(isPaid ? "paid" : "unpaid");

      if (response.deliverySlot) {
        setSelectedSlotId(orderId);
      }
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      setState("error");
      if (error.status === 401) {
        setError("Session expired. Please login with Discord again.");
      } else if (error.status === 403) {
        setError("You do not have access to this order.");
      } else if (error.status === 404) {
        setError("Order not found.");
      } else {
        setError(error.message || "Failed to load order.");
      }
    }
  }, [orderId, paidFromUrl]);

  useEffect(() => {
    fetchOrderInfo();
  }, [fetchOrderInfo]);

  // Retry countdowns
  useEffect(() => {
    if (ticketRetryInSeconds > 0) {
      const timer = setTimeout(() => setTicketRetryInSeconds((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [ticketRetryInSeconds]);

  useEffect(() => {
    if (paypalTicketRetryInSeconds > 0) {
      const timer = setTimeout(() => setPaypalTicketRetryInSeconds((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [paypalTicketRetryInSeconds]);

  useEffect(() => {
    if (ltcTicketRetryInSeconds > 0) {
      const timer = setTimeout(() => setLtcTicketRetryInSeconds((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [ltcTicketRetryInSeconds]);

  const handleSelectPaymentMethod = async (method: "paypal_ff" | "cashapp" | "ltc") => {
    if (!orderId || isCreatingPayment) return;

    setIsCreatingPayment(true);
    setSelectedMethod(method);

    try {
      if (method === "paypal_ff") {
        const response = await apiPost<{
          destination: string;
          memoExpected: string;
        }>(API_ROUTES.CREATE_PAYMENT, { orderId, method: "paypal_ff" });
        setPaypalData(response);
      } else if (method === "cashapp") {
        setCashAppData({ handle: "$yoko276" });
      } else if (method === "ltc") {
        const response = await apiPost<{
          payAddress: string;
          payAmount: number;
          qrImageUrl?: string;
        }>(API_ROUTES.CREATE_PAYMENT, { orderId, method: "ltc" });
        setLtcData(response);
      }
    } catch (err) {
      console.error("Failed to create payment:", err);
      alert("Failed to create payment. Please try again.");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCreateTicket = async (type: "paypal" | "cashapp" | "ltc") => {
    if (!orderId || isCreatingTicket) return;

    setIsCreatingTicket(true);

    try {
      let endpoint = API_ROUTES.CREATE_TICKET;
      if (type === "paypal") endpoint = API_ROUTES.CREATE_TICKET_PAYPAL_FF;
      else if (type === "ltc") endpoint = API_ROUTES.CREATE_TICKET_LTC;

      const response = await apiPost<{ channelId: string }>(endpoint, { orderId });

      const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
      const channelUrl = `https://discord.com/channels/${guildId}/${response.channelId}`;

      const isMobile = /mobile|android|iphone/i.test(navigator.userAgent);
      if (isMobile) {
        window.open(`discord://-/channels/${guildId}/${response.channelId}`, "_blank");
      }
      window.open(channelUrl, "_blank");

      await fetchOrderInfo();
    } catch (err: unknown) {
      const error = err as { message?: string; data?: { retryAfterSeconds?: number } };
      let retrySeconds = 0;

      if (error.data?.retryAfterSeconds) {
        retrySeconds = error.data.retryAfterSeconds;
      } else if (error.message?.includes("TICKET_CREATION_IN_PROGRESS")) {
        retrySeconds = 10;
      }

      if (type === "paypal") setPaypalTicketRetryInSeconds(retrySeconds);
      else if (type === "ltc") setLtcTicketRetryInSeconds(retrySeconds);
      else setTicketRetryInSeconds(retrySeconds);

      alert(`Failed to create ticket: ${error.message}`);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSelectSlot = async (slotId: string, customerTimezone: string) => {
    if (!orderId) return;

    try {
      await apiPost(API_ROUTES.DELIVERY_SLOT(orderId), {
        slotId,
        customerTimezone,
      });
      setSelectedSlotId(slotId);
      await fetchOrderInfo();
    } catch (err) {
      console.error("Failed to select slot:", err);
      alert("Failed to select delivery slot.");
      throw err;
    }
  };

  const handleLinkRoblox = async (username: string, userId: string, displayName: string) => {
    if (!orderId) return;

    try {
      await apiPost(API_ROUTES.LINK_ROBLOX(orderId), {
        username,
        userId,
        displayName,
      });
      await fetchOrderInfo();
    } catch (err) {
      console.error("Failed to link Roblox:", err);
      alert("Failed to link Roblox account.");
      throw err;
    }
  };

  const handleConfirmDelivery = async () => {
    if (!orderId || !confirm("Only press confirm if you are sure you received your items.")) return;

    try {
      const response = await apiPost<{ discountCoupon: string }>(
        API_ROUTES.CONFIRM_DELIVERY(orderId)
      );
      setConfirmationDiscountCode(response.discountCoupon);
      await fetchOrderInfo();
    } catch (err) {
      console.error("Failed to confirm delivery:", err);
      alert("Failed to confirm delivery.");
    }
  };

  const openDiscordChannel = (channelId: string) => {
    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
    const isMobile = /mobile|android|iphone/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.open(`discord://-/channels/${guildId}/${channelId}`, "_blank");
    }
    window.open(`https://discord.com/channels/${guildId}/${channelId}`, "_blank");
  };

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" className="mx-auto mb-4" />
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !orderInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button asChild className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDiscordLinked = !!user?.discordId;
  const hasSlotSelected = !!orderInfo.deliverySlot || !!selectedSlotId;
  const hasRobloxLinked = !!orderInfo.robloxUsername && !!orderInfo.robloxUserId;
  const hasTicketCreated = !!orderInfo.channelId;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <Badge variant="outline" className="mb-2">
            Order {orderInfo.orderNumber}
          </Badge>
          <h1 className="font-gothic text-3xl font-bold">Complete Your Order</h1>
          <p className="mt-2 text-muted-foreground">
            Total:{" "}
            <span className="text-accent text-2xl font-bold">
              {formatCurrency(orderInfo.total)}
            </span>
          </p>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderInfo.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-mono">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(orderInfo.subtotal)}</span>
              </div>
              {orderInfo.discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(orderInfo.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-accent">{formatCurrency(orderInfo.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unpaid State - Payment Methods */}
        {!paid && state === "unpaid" && (
          <div className="space-y-6">
            <h2 className="font-gothic text-xl font-semibold">Select Payment Method</h2>

            {!selectedMethod ? (
              <PaymentMethods
                onSelectMethod={handleSelectPaymentMethod}
                isLoading={isCreatingPayment}
              />
            ) : selectedMethod === "paypal_ff" && paypalData ? (
              <PayPalGuide
                amount={orderInfo.total}
                email={paypalData.destination}
                memoExpected={paypalData.memoExpected}
                channelId={paypalData.channelId}
                onCreateTicket={() => handleCreateTicket("paypal")}
                isCreatingTicket={isCreatingTicket}
                retryInSeconds={paypalTicketRetryInSeconds}
              />
            ) : selectedMethod === "cashapp" && cashAppData ? (
              <CashAppGuide
                amount={orderInfo.total}
                handle={cashAppData.handle}
                onCreateTicket={() => handleCreateTicket("cashapp")}
                isCreatingTicket={isCreatingTicket}
                retryInSeconds={ticketRetryInSeconds}
              />
            ) : selectedMethod === "ltc" && ltcData ? (
              <LTCGuide
                amount={orderInfo.total}
                payAddress={ltcData.payAddress}
                qrImageUrl={ltcData.qrImageUrl}
                onCreateTicket={() => handleCreateTicket("ltc")}
                isCreatingTicket={isCreatingTicket}
                retryInSeconds={ltcTicketRetryInSeconds}
              />
            ) : null}

            {selectedMethod && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedMethod(null);
                  setPaypalData(null);
                  setCashAppData(null);
                  setLtcData(null);
                }}
              >
                Choose Different Method
              </Button>
            )}
          </div>
        )}

        {/* Paid State - Delivery Flow */}
        {paid && (
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                  <ClipboardDocumentListIcon className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm">Checkout</p>
                <CheckCircle2 className="mt-1 h-5 w-5 text-success" />
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <BanknotesIcon className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm">Pay</p>
                <CheckCircle2 className="mt-1 h-5 w-5 text-success" />
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <CurrencyDollarIcon className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm">Link</p>
                {isDiscordLinked ? (
                  <CheckCircle2 className="mt-1 h-5 w-5 text-success" />
                ) : (
                  <span className="mt-1 text-xs text-muted-foreground">Pending</span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <TicketIcon className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm">Ticket</p>
                {hasTicketCreated ? (
                  <CheckCircle2 className="mt-1 h-5 w-5 text-success" />
                ) : (
                  <span className="mt-1 text-xs text-muted-foreground">Pending</span>
                )}
              </div>
            </div>

            {/* Step 1: Discord Login */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Link Discord Account</CardTitle>
              </CardHeader>
              <CardContent>
                {isDiscordLinked ? (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Linked: {user?.discordUsername}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You need to link your Discord account to continue with delivery.
                    </p>
                    <Button
                      variant="default"
                      className="bg-[#5865F2] hover:bg-[#4752C4]"
                      onClick={() => {
                        const inviteUrl = getDiscordInviteUrl();
                        window.open(inviteUrl, "_blank");
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Link Discord Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Delivery Slot */}
            {isDiscordLinked && (
              <DeliverySlotPicker
                orderId={orderId!}
                selectedSlotId={selectedSlotId || orderInfo.deliverySlot?.startAt ? orderId! : undefined}
                onSlotSelect={handleSelectSlot}
                disabled={false}
              />
            )}

            {/* Step 3: Roblox */}
            {hasSlotSelected && (
              <RobloxLinker
                orderId={orderId!}
                linkedUsername={orderInfo.robloxUsername}
                linkedUserId={orderInfo.robloxUserId}
                onLink={handleLinkRoblox}
                disabled={false}
              />
            )}

            {/* Step 4: Ticket */}
            {hasRobloxLinked && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 4: Create Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasTicketCreated ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Ticket Created</span>
                      </div>
                      <Button
                        onClick={() => openDiscordChannel(orderInfo.channelId!)}
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Discord Ticket
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCreateTicket("cashapp")}
                      disabled={isCreatingTicket || !!ticketRetryInSeconds}
                      className="w-full"
                      size="lg"
                    >
                      {isCreatingTicket
                        ? "Creating..."
                        : ticketRetryInSeconds
                        ? `Retry in ${ticketRetryInSeconds}s`
                        : "Create Ticket"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Confirmation Block */}
            {orderInfo.status === "DELIVERED" && !confirmationDiscountCode && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">Confirm Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                    Only press confirm if you are sure you received your items.
                  </div>
                  <Button
                    onClick={handleConfirmDelivery}
                    variant="destructive"
                    className="w-full"
                  >
                    Confirm Delivery Complete
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Confirmation Success */}
            {confirmationDiscountCode && (
              <Card className="border-success">
                <CardContent className="py-6">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-success" />
                    <p className="text-lg font-medium text-success">Delivery Confirmed!</p>
                    <p className="mt-2 text-muted-foreground">
                      Your 5% next-order coupon code:
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold text-accent">
                      {confirmationDiscountCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
