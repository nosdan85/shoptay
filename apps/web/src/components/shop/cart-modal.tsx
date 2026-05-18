"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardDocumentListIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  TicketIcon,
  X,
  Info,
  ExternalLink,
} from "lucide-react";
import { cn, getProductImageUrl } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { getOAuthUrl, setDiscordLinkMethod } from "@/lib/auth";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    items,
    coupon,
    discount,
    subtotal,
    total,
    isLoading,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponError("");
    setCouponSuccess("");

    const result = await applyCoupon(couponCode);

    if (result.success) {
      setCouponSuccess(result.message);
      setCouponCode("");
    } else {
      setCouponError(result.message);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || isProcessing || total <= 0) return;

    setIsProcessing(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));

      const response = await apiPost<{ orderId: string }>(API_ROUTES.CHECKOUT, {
        items: orderItems,
        couponCode: coupon?.code,
      });

      // Navigate to payment page
      router.push(`/pay?orderId=${response.orderId}`);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      if (err.code === "ECONNABORTED") {
        alert("Checkout timeout. Please try again.");
      } else if (err.code === "401") {
        alert("Session expired. Please login with Discord again.");
      } else if (err.message?.includes("USER_NOT_IN_GUILD")) {
        // Show join modal
        const inviteUrl = getOAuthUrl();
        setDiscordLinkMethod("web");
        if (confirm("You need to join our Discord server to checkout. Join now?")) {
          window.open(inviteUrl, "_blank");
        }
      } else {
        alert(`Checkout failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDiscordLink = (method: "web" | "app") => {
    setDiscordLinkMethod(method);
    const url = getOAuthUrl();
    if (method === "app") {
      const appUrl = `discord://-/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "")}&response_type=code&scope=identify+guilds.join`;
      const opened = window.open(appUrl, "_blank");
      if (!opened) {
        window.open(url, "_blank");
      }
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-gothic text-3xl">Bag</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-hidden pt-4">
          {/* Cart Items */}
          <ScrollArea className="flex-1 -mx-6 flex-1 px-6">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Your cart is empty</p>
                <Button variant="outline" onClick={onClose} className="mt-4">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product._id} className="flex gap-4">
                    {/* Image */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-secondary">
                      <Image
                        src={getProductImageUrl(item.product.image)}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-gothic text-sm line-clamp-1">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.pricing.lineTotal)} | qty {item.quantity}x{" "}
                            {item.product.name.split(" ")[0]}
                          </p>
                          {item.pricing.bulkApplied && (
                            <Badge variant="success" className="mt-1 text-xs">
                              Bulk Applied
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity - 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded border bg-secondary text-xs"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity + 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded border bg-secondary text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {items.length > 0 && (
            <>
              <Separator />

              {/* Discord Status */}
              <div className="space-y-2">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Linked: {user.discordUsername}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3 shrink-0 mt-0.5" />
                      <p>Discord login optional but recommended for faster checkout.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-[#5865F2] text-white hover:bg-[#4752C4]"
                        onClick={() => handleDiscordLink("web")}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Link via Discord
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-elevated"
                        onClick={() => handleDiscordLink("app")}
                      >
                        Open Discord App
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout Steps */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                  </div>
                  <span>Checkout</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <BanknotesIcon className="h-4 w-4" />
                  </div>
                  <span>Pay</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20 text-success">
                    <CurrencyDollarIcon className="h-4 w-4" />
                  </div>
                  <span>Link</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20 text-success">
                    <TicketIcon className="h-4 w-4" />
                  </div>
                  <span>Ticket</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isLoading}
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-destructive">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-xs text-success">
                    Applied {coupon?.discountPercent}% discount
                  </p>
                )}
                {coupon && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-success">
                      {coupon.code} applied
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2">
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-gothic">Subtotal</span>
                    <span className="font-gothic">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-gothic text-base font-semibold">
                    <span>Total</span>
                    <span className="text-accent">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={items.length === 0 || isProcessing || total <= 0}
                className="w-full py-4"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Checkout"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
