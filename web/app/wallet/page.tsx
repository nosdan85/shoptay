"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Banknote, Clock, Copy, Loader2, RefreshCw } from "lucide-react";

type WalletTx = {
  _id?: string;
  referenceCode?: string;
  amount?: number;
  amountCents?: number;
  status?: string;
  method?: string;
  createdAt?: string;
};

type WalletData = {
  balance?: number;
  balanceCents?: number;
  transactions?: WalletTx[];
};

const methods = [
  { id: "paypal_ff", label: "PayPal F&F" },
  { id: "cashapp", label: "Cash App" },
  { id: "ltc", label: "Litecoin" },
];

export default function WalletPage() {
  const { user, token, getOAuthUrl } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("10");
  const [method, setMethod] = useState("paypal_ff");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const transactions = useMemo(
    () => (Array.isArray(wallet?.transactions) ? wallet.transactions : []),
    [wallet]
  );

  const loadWallet = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load wallet.");
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [token]);

  const createTopup = async () => {
    if (!token) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create top-up.");
      setCreated(data);
      await loadWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create top-up.");
    } finally {
      setCreating(false);
    }
  };

  const copyText = async (key: string, value: unknown) => {
    await navigator.clipboard.writeText(String(value || ""));
    setCopied(key);
    setTimeout(() => setCopied(""), 1400);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <main className="mx-auto flex max-w-md items-center justify-center px-4 py-24">
          <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
            <Banknote className="mx-auto mb-4 h-10 w-10 text-green-400" />
            <h1 className="mb-2 text-2xl font-bold">Wallet Login Required</h1>
            <p className="mb-6 text-sm text-slate-400">
              Login Discord to view balance and create wallet top-ups.
            </p>
            <a href={getOAuthUrl()} className="inline-flex rounded-lg bg-[#5865F2] px-5 py-3 font-medium text-white hover:bg-[#4752C4]">
              Login with Discord
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Wallet</h1>
              <p className="mt-1 text-slate-400">Balance and top-up history.</p>
            </div>
            <button onClick={loadWallet} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Current Balance</p>
            <p className="mt-2 text-5xl font-bold text-green-400">
              ${Number(wallet?.balance ?? (wallet?.balanceCents || 0) / 100).toFixed(2)}
            </p>
          </div>

          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          <div className="rounded-xl border border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 px-5 py-4">
              <h2 className="text-lg font-semibold">Transactions</h2>
            </div>
            <div className="divide-y divide-slate-700">
              {loading ? (
                <div className="flex items-center gap-2 p-5 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading wallet...</div>
              ) : transactions.length ? transactions.map((tx) => (
                <div key={tx._id || tx.referenceCode} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">{tx.referenceCode || tx._id}</p>
                    <p className="mt-1 text-sm text-slate-400">{tx.method || "topup"} • {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(tx.amount ?? (tx.amountCents || 0) / 100).toFixed(2)}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-300">
                      <Clock className="h-3 w-3" /> {tx.status || "pending"}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-5 text-slate-400">No wallet transactions yet.</div>
              )}
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Create Top-Up</h2>
          <label className="mb-2 block text-sm text-slate-400">Amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500" />
          <label className="mb-2 block text-sm text-slate-400">Method</label>
          <div className="mb-5 grid gap-2">
            {methods.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-lg border px-3 py-2 text-left text-sm ${method === m.id ? "border-blue-500 bg-blue-500/15 text-blue-300" : "border-slate-700 bg-slate-900 text-slate-300"}`}>
                {m.label}
              </button>
            ))}
          </div>
          <button onClick={createTopup} disabled={creating} className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60">
            {creating ? "Creating..." : "Start Top-Up"}
          </button>

          {created && (
            <div className="mt-5 space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm">
              {Object.entries(created).filter(([, v]) => typeof v === "string" || typeof v === "number").slice(0, 5).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">{k}</span>
                  <button onClick={() => copyText(k, v)} className="inline-flex items-center gap-1 text-blue-300">
                    <Copy className="h-3 w-3" /> {copied === k ? "Copied" : String(v)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
