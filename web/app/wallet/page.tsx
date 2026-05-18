"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, LogIn, PlusCircle, History } from "lucide-react";

const paymentMethods = ["PayPal F&F", "Cash App", "Litecoin"];

export default function WalletPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [method, setMethod] = useState(paymentMethods[0]);
  const [amount, setAmount] = useState("");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">NosMarket</Link>
          <div className="flex items-center gap-6">
            <Link href="/shop" className="text-slate-300 hover:text-white transition">Shop</Link>
            <Link href="/wallet" className="text-white font-medium">Wallet</Link>
            <Link href="/proofs" className="text-slate-300 hover:text-white transition">Proofs</Link>
            <Link href="/admin" className="text-slate-300 hover:text-white transition">Admin</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-slate-400 mt-2">Manage account funds for faster checkout.</p>
          </div>
          <button
            onClick={() => setIsLoggedIn((prev) => !prev)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            Demo: {isLoggedIn ? "Log Out" : "Log In"}
          </button>
        </div>

        {!isLoggedIn ? (
          <div className="max-w-xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Connect Discord to access your wallet</h2>
            <p className="text-slate-400 mb-6">
              Sign in with Discord to view balances, top up funds, and track your wallet activity.
            </p>
            <button className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#5865F2] hover:opacity-90 text-white font-medium transition">
              Continue with Discord
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-semibold">Current Balance</h2>
              </div>
              <p className="text-5xl font-bold text-white">$0.00</p>
              <p className="text-slate-400 mt-2">Available instantly for any order.</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">Top Up Wallet</h2>
              </div>
              <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {paymentMethods.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition"
                >
                  Submit
                </button>
              </form>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <History className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold">Transaction History</h2>
              </div>
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
                <p className="text-slate-300">No wallet activity yet.</p>
                <p className="text-slate-500 mt-1">Completed top-ups and refunds will appear here.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
