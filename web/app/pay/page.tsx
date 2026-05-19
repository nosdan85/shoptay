"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Copy, CreditCard, Loader2, QrCode } from "lucide-react";
import Navbar from "../components/Navbar";
import { formatPrice, getTimezoneInfo } from "@/lib/timezones";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  orderId?: string;
  totalAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  items?: OrderItem[];
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  isPaid?: boolean;
  memoExpected?: string;
  paypalEmail?: string;
  cashAppTag?: string;
  ltcPayAddress?: string;
  ltcQrImageUrl?: string;
  deliveryCustomerStartText?: string;
  deliveryCustomerEndText?: string;
  customerTimezone?: string;
  error?: string;
}

interface PaymentInstructions {
  type?: PaymentMethodValue;
  email?: string;
  cashAppTag?: string;
  cashtag?: string;
  memoExpected?: string;
  paymentStatus?: string;
  payAddress?: string;
  payCurrency?: string;
  qrImageUrl?: string;
  error?: string;
}

type PaymentMethodValue = "paypal_ff" | "cashapp" | "ltc";

interface PaymentMethod {
  label: string;
  value: PaymentMethodValue;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { label: "PayPal F&F", value: "paypal_ff" },
  { label: "Cash App", value: "cashapp" },
  { label: "Litecoin", value: "ltc" }
];

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
    </div>
  );
}

function PayContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const isPaidRedirect = searchParams.get("paid") === "1";
  const errorParam = searchParams.get("error");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodValue>("paypal_ff");
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchOrder() {
      try {
        const res = await fetch("/api/shop/order-payment-info?orderId=" + encodeURIComponent(orderId || ""), { cache: "no-store" });
        const data = await res.json();

        if (!active) return;

        if (res.ok) {
          setOrder(data);
          if (data?.paymentMethod === "cashapp" || data?.paymentMethod === "ltc" || data?.paymentMethod === "paypal_ff") {
            setSelectedMethod(data.paymentMethod);
          }
        } else {
          setOrder({ error: data?.error || "Order not found" });
        }
      } catch {
        if (active) setOrder({ error: "Failed to load order" });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  async function selectPaymentMethod(method: PaymentMethodValue) {
    setSelectedMethod(method);
    setPaymentError(null);
    setInstructions(null);

    if (!orderId) return;

    setPaymentLoading(true);

    try {
      const res = await fetch("/api/shop/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, method })
      });
      const data = await res.json();

      if (res.ok) {
        setInstructions(data);
      } else {
        setPaymentError(data?.error || "Unable to create payment instructions.");
      }
    } catch {
      setPaymentError("Unable to create payment instructions.");
    } finally {
      setPaymentLoading(false);
    }
  }

  async function copyValue(value: string) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1800);
  }

  if (loading) return <LoadingScreen />;

  if (!orderId) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Order ID</h1>
          <p className="text-slate-400 mb-6">Open this page from checkout so your order can be loaded.</p>
          <a href="/shop" className="inline-block bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium transition-colors">Go to Shop</a>
        </div>
      </main>
    );
  }

  if (errorParam) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Error</h1>
          <p className="text-slate-400 mb-6">{errorParam}</p>
          <a href="/shop" className="inline-block bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-medium transition-colors">Back to Shop</a>
        </div>
      </main>
    );
  }

  if (order?.error) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Error</h1>
          <p className="text-slate-400 mb-6">{order.error}</p>
          <a href="/shop" className="inline-block bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-medium transition-colors">Back to Shop</a>
        </div>
      </main>
    );
  }

  if (isPaidRedirect || order?.isPaid) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Complete</h1>
          <p className="text-slate-300 mb-2">Order <span className="font-mono">{orderId}</span></p>
          <p className="text-slate-400 mb-6">Thank you for your purchase.</p>
          <a href="/shop" className="inline-block bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium transition-colors">Continue Shopping</a>
        </div>
      </main>
    );
  }

  const timezoneInfo = getTimezoneInfo(order?.customerTimezone || "America/Los_Angeles");
  const subtotal = order?.subtotalAmount ?? 0;
  const discount = order?.discountAmount ?? 0;
  const total = order?.totalAmount ?? Math.max(subtotal - discount, 0);
  const items = order?.items ?? [];
  const amount = formatPrice(total, timezoneInfo.currencyCode, timezoneInfo.currencySymbol);
  const memoExpected = instructions?.memoExpected || order?.memoExpected || orderId;
  const paypalEmail = instructions?.email || order?.paypalEmail || "payments@nosmarket.gg";
  const cashAppTag = instructions?.cashAppTag || instructions?.cashtag || order?.cashAppTag || "$NosMarketStore";
  const ltcAddress = instructions?.payAddress || order?.ltcPayAddress || "";
  const ltcQrImageUrl = instructions?.qrImageUrl || order?.ltcQrImageUrl || "";
  const currentMethodLabel = PAYMENT_METHODS.find((paymentMethod) => paymentMethod.value === selectedMethod)?.label || "Payment";

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            <p className="text-slate-400 mt-2">Order: <span className="text-white font-mono">{orderId}</span></p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold">Payment Method</h2>
                <p className="text-sm text-slate-400">Select a method to generate payment instructions.</p>
              </div>
              {paymentLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {PAYMENT_METHODS.map((paymentMethod) => (
                <button
                  key={paymentMethod.value}
                  onClick={() => selectPaymentMethod(paymentMethod.value)}
                  className={"px-4 py-2 rounded-lg border text-sm font-medium transition-all " + (selectedMethod === paymentMethod.value ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700")}
                >
                  {paymentMethod.label}
                </button>
              ))}
            </div>

            {paymentError && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
                {paymentError}
              </div>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              {selectedMethod === "ltc" ? <QrCode className="w-5 h-5 text-blue-400" /> : <CreditCard className="w-5 h-5 text-blue-400" />}
              <h2 className="text-lg font-semibold">{currentMethodLabel}</h2>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Amount to Pay</p>
              <p className="text-4xl font-bold">{amount}</p>
            </div>

            {selectedMethod === "paypal_ff" && (
              <div className="space-y-5">
                <CopyRow label="PayPal Email" value={paypalEmail} copied={copied} onCopy={copyValue} />
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300 space-y-1">
                  <p className="font-medium text-white">Instructions:</p>
                  <p>1. Send as <strong>Friends &amp; Family</strong> only.</p>
                  <p>2. Include Order ID in note: <code className="bg-slate-700 px-2 py-0.5 rounded">{memoExpected}</code></p>
                  <p>3. Send exact amount: <strong>{amount}</strong></p>
                </div>
              </div>
            )}

            {selectedMethod === "cashapp" && (
              <div className="space-y-5">
                <CopyRow label="Cash App" value={cashAppTag} copied={copied} onCopy={copyValue} />
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300 space-y-1">
                  <p className="font-medium text-white">Instructions:</p>
                  <p>1. Send payment to <strong>{cashAppTag}</strong>.</p>
                  <p>2. Include Order ID: <code className="bg-slate-700 px-2 py-0.5 rounded">{memoExpected}</code></p>
                  <p>3. Send exact amount: <strong>{amount}</strong></p>
                </div>
              </div>
            )}

            {selectedMethod === "ltc" && (
              <div className="space-y-5">
                <CopyRow label="Litecoin Address" value={ltcAddress} placeholder="Select Litecoin to load address" copied={copied} onCopy={copyValue} />
                {ltcQrImageUrl && (
                  <img src={ltcQrImageUrl} alt="Litecoin payment QR code" className="w-48 h-48 rounded-lg border border-slate-700 bg-white p-2" />
                )}
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300 space-y-1">
                  <p className="font-medium text-white">Instructions:</p>
                  <p>1. Send only <strong>Litecoin (LTC)</strong> to the address above.</p>
                  <p>2. Include Order ID where your wallet allows: <code className="bg-slate-700 px-2 py-0.5 rounded">{memoExpected}</code></p>
                  <p>3. Wait for network confirmations after sending.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit sticky top-24">
          <h2 className="text-xl font-semibold mb-5">Order Summary</h2>

          <div className="space-y-3">
            {items.length === 0 && <p className="text-sm text-slate-400">No order items found.</p>}

            {items.map((item, index) => (
              <div key={item.name + String(index)} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">{item.quantity}x {item.name}</span>
                <span className="text-slate-200 shrink-0">{formatPrice(item.price * item.quantity, timezoneInfo.currencyCode, timezoneInfo.currencySymbol)}</span>
              </div>
            ))}

            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-200">{formatPrice(subtotal, timezoneInfo.currencyCode, timezoneInfo.currencySymbol)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-green-400">-{formatPrice(discount, timezoneInfo.currencyCode, timezoneInfo.currencySymbol)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-semibold pt-2">
                <span>Total</span>
                <span className="text-green-400">{amount}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-slate-200">{order?.paymentStatus || order?.status || "Pending"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Currency</span>
              <span className="text-slate-200">{timezoneInfo.currencyCode}</span>
            </div>
          </div>

          {order?.deliveryCustomerStartText && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Delivery Time</h3>
              <p className="text-sm text-slate-200">{order.deliveryCustomerStartText} - {order.deliveryCustomerEndText}</p>
              <p className="text-xs text-slate-500 mt-1">{timezoneInfo.label}</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

interface CopyRowProps {
  label: string;
  value: string;
  placeholder?: string;
  copied: string | null;
  onCopy: (value: string) => void;
}

function CopyRow({ label, value, placeholder, copied, onCopy }: CopyRowProps) {
  const shownValue = value || placeholder || "Unavailable";

  return (
    <div>
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 break-all font-mono text-sm">
          {shownValue}
        </div>
        <button
          onClick={() => onCopy(value)}
          disabled={!value}
          className={"px-4 py-3 rounded-lg text-white transition-all shrink-0 " + (value ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-800 opacity-40 cursor-not-allowed")}
        >
          {copied === value ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <Suspense fallback={<LoadingScreen />}>
        <PayContent />
      </Suspense>
    </div>
  );
}
