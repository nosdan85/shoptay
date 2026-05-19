"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { Copy, CreditCard, QrCode, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface OrderItem { name: string; quantity: number; price: number; }

interface OrderData {
  orderId?: string;
  totalAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  items?: OrderItem[];
  status?: string;
  isPaid?: boolean;
  memoExpected?: string;
  deliveryCustomerStartText?: string;
  deliveryCustomerEndText?: string;
  customerTimezone?: string;
  error?: string;
}

type Method = "PayPal F&F" | "Cash App" | "Litecoin";

const METHODS: Method[] = ["PayPal F&F", "Cash App", "Litecoin"];

function PayContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const paid = params.get("paid") === "1";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<Method>("PayPal F&F");
  const [copied, setCopied] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<any>(null);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const fetchOrder = async () => {
      try {
        const res = await fetch("/api/shop/order-payment-info?orderId=" + encodeURIComponent(orderId), { cache: "no-store" });
        const data = await res.json();
        if (res.ok) setOrder(data); else setOrder({ error: data?.error || "Not found" });
      } catch { setOrder({ error: "Load failed" }); }
      finally { setLoading(false); }
    };
    fetchOrder();
  }, [orderId]);

  const handleMethod = async (m: Method) => {
    setMethod(m);
    if (!orderId) return;
    const apiMethod = m === "PayPal F&F" ? "paypal_ff" : m === "Cash App" ? "cashapp" : "ltc";
    try {
      const res = await fetch("/api/shop/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, method: apiMethod })
      });
      const data = await res.json();
      if (res.ok) setInstructions(data);
    } catch { /* silent */ }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1800);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  if (!orderId) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Order ID</h1>
        <a href="/shop" className="text-blue-400 hover:underline">Go to Shop</a>
      </div>
    </div>
  );

  if (order?.error) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-slate-400 mb-4">{order.error}</p>
        <a href="/shop" className="text-blue-400 hover:underline">Go to Shop</a>
      </div>
    </div>
  );

  if (paid || order?.isPaid) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Payment Complete!</h1>
        <p className="text-slate-300 mb-2">Order {orderId}</p>
        <p className="text-slate-400 mb-6">Thank you for your purchase.</p>
        <a href="/shop" className="inline-block bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium transition-colors">Continue Shopping</a>
      </div>
    </div>
  );

  const total = order?.totalAmount ?? 0;
  const subtotal = order?.subtotalAmount ?? total;
  const discount = order?.discountAmount ?? 0;
  const items = order?.items ?? [];
  const amount = "$" + total.toFixed(2);
  const paypalEmail = instructions?.email ?? "payments@nosmarket.gg";
  const ltcAddress = instructions?.payAddress ?? "";
  const ltcQr = instructions?.qrImageUrl ?? "";
  const memo = instructions?.memoExpected ?? order?.memoExpected ?? orderId ?? "";

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            <p className="text-slate-400 mt-2">Order: <span className="text-white font-mono">{orderId}</span></p>
          </div>

          <div className="flex flex-wrap gap-3">
            {METHODS.map((m) => (
              <button key={m} onClick={() => handleMethod(m)}
                className={"px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-105 " + (method === m ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700")}>
                {m}
              </button>
            ))}
          </div>

          {method === "PayPal F&F" && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold">PayPal Friends &amp; Family</h2>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Amount to Pay</p>
                <p className="text-4xl font-bold">{amount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">PayPal Email</p>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 break-all font-mono text-sm">{paypalEmail}</div>
                  <button onClick={() => copy(paypalEmail)} className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all shrink-0">
                    {copied === paypalEmail ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300 space-y-1">
                <p className="font-medium text-white">Important:</p>
                <p>1. Send as <strong>Friends &amp; Family</strong> only</p>
                <p>2. Include Order ID in note: <code className="bg-slate-700 px-2 py-0.5 rounded">{memo}</code></p>
                <p>3. Send exact amount: <strong>{amount}</strong></p>
              </div>
            </div>
          )}

          {method === "Litecoin" && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold">Litecoin</h2>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Amount to Pay</p>
                <p className="text-4xl font-bold">{amount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">LTC Address</p>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 break-all font-mono text-xs">{ltcAddress || "Loading..."}</div>
                  <button onClick={() => ltcAddress && copy(ltcAddress)} disabled={!ltcAddress} className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white transition-all shrink-0">
                    {copied === ltcAddress ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {ltcQr && <img src={ltcQr} alt="LTC QR" className="w-48 h-48 rounded-lg border border-slate-700" />}
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
                <p>Send only <strong>Litecoin (LTC)</strong> to the address above. Wait for network confirmations.</p>
              </div>
            </div>
          )}

          {method === "Cash App" && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold">Cash App</h2>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Amount to Pay</p>
                <p className="text-4xl font-bold">{amount}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300 space-y-1">
                <p className="font-medium text-white">Instructions:</p>
                <p>1. Send to: <strong>$NosMarketStore</strong></p>
                <p>2. Include Order ID: <code className="bg-slate-700 px-2 py-0.5 rounded">{memo}</code></p>
                <p>3. Exact amount: <strong>{amount}</strong></p>
                <p>4. Message order ID after payment</p>
              </div>
            </div>
          )}
        </section>

        <aside className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit sticky top-24">
          <h2 className="text-xl font-semibold mb-5">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-400">{item.quantity}x {item.name}</span>
                <span className="text-slate-200">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-slate-200">${subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">Discount</span><span className="text-green-400">-${discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-lg font-semibold pt-2"><span>Total</span><span className="text-green-400">{amount}</span></div>
            </div>
          </div>
          {order?.deliveryCustomerStartText && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Delivery Time</h3>
              <p className="text-sm text-slate-200">{order.deliveryCustomerStartText} - {order.deliveryCustomerEndText}</p>
              {order.customerTimezone && <p className="text-xs text-slate-500 mt-1">{order.customerTimezone}</p>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function PayPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <PayContent />
      </Suspense>
    </div>
  );
}
