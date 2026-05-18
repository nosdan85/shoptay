"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, CreditCard, QrCode } from "lucide-react";

const methods = {
  "PayPal F&F": {
    destination: "payments@nosmarket.gg",
    note: "Send as Friends & Family. Include your order ID in the note."
  },
  "Cash App": {
    destination: "$NosMarketStore",
    note: "Use the exact amount and message your order ID after payment."
  },
  Litecoin: {
    destination: "ltc1q9examplewalletaddressxyz0935",
    note: "Send only Litecoin to this address. Network confirmations required."
  }
} as const;

type Method = keyof typeof methods;

export default function PayPage() {
  const [selectedMethod, setSelectedMethod] = useState<Method>("PayPal F&F");
  const [copied, setCopied] = useState(false);

  const amount = "$24.99";
  const selectedDetails = useMemo(() => methods[selectedMethod], [selectedMethod]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(selectedDetails.destination);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">NosMarket</Link>
          <div className="flex items-center gap-6">
            <Link href="/shop" className="text-slate-300 hover:text-white transition">Shop</Link>
            <Link href="/wallet" className="text-slate-300 hover:text-white transition">Wallet</Link>
            <Link href="/proofs" className="text-slate-300 hover:text-white transition">Proofs</Link>
            <Link href="/admin" className="text-slate-300 hover:text-white transition">Admin</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Complete Payment</h1>
              <p className="text-slate-400 mt-2">Choose a payment rail and send the exact amount below.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {(Object.keys(methods) as Method[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    selectedMethod === method
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">{selectedMethod} Instructions</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-[1fr_220px] items-start">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Amount to Pay</p>
                    <p className="text-4xl font-bold text-white">{amount}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 mb-2">Destination</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 break-all">
                        {selectedDetails.destination}
                      </div>
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
                    {selectedDetails.note}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="aspect-square rounded-lg bg-slate-700 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <QrCode className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">QR Placeholder</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit sticky top-24">
            <h2 className="text-xl font-semibold mb-5">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Ancient Chest</span>
                <span className="text-slate-200">$15.99</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Power Seal</span>
                <span className="text-slate-200">$8.00</span>
              </div>
              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-200">$23.99</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Fee</span>
                  <span className="text-slate-200">$1.00</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold pt-2">
                  <span>Total</span>
                  <span>{amount}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
