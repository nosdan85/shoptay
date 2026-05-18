"use client";

import Link from "next/link";
import { ShieldCheck, ImageIcon } from "lucide-react";

const proofs = [
  { id: 1, username: "@VoidRunner", total: "$42.50", items: ["Ancient Chest", "Power Seal"], date: "May 16, 2026" },
  { id: 2, username: "@AetherMage", total: "$18.99", items: ["Legendary Shard", "Reroll Ticket"], date: "May 14, 2026" },
  { id: 3, username: "@NightForge", total: "$65.00", items: ["Warrior Set", "Time Seal"], date: "May 13, 2026" },
  { id: 4, username: "@LunaHex", total: "$25.00", items: ["Mystic Relic"], date: "May 12, 2026" },
  { id: 5, username: "@SteelNova", total: "$39.49", items: ["Dragon Chest", "Fire Shard"], date: "May 10, 2026" },
  { id: 6, username: "@ArcBloom", total: "$54.99", items: ["Mage Set", "Combo Pack"], date: "May 9, 2026" },
];

export default function ProofsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">NosMarket</Link>
          <div className="flex items-center gap-6">
            <Link href="/shop" className="text-slate-300 hover:text-white transition">Shop</Link>
            <Link href="/wallet" className="text-slate-300 hover:text-white transition">Wallet</Link>
            <Link href="/proofs" className="text-white font-medium">Proofs</Link>
            <Link href="/admin" className="text-slate-300 hover:text-white transition">Admin</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold">Proof of Delivery</h1>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Verified order deliveries from recent customers. Each proof represents completed fulfillment with confirmed item handoff.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {proofs.map((proof) => (
            <div key={proof.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="h-48 bg-slate-700 flex items-center justify-center">
                <ImageIcon className="w-14 h-14 text-slate-400" />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{proof.username}</p>
                    <p className="text-sm text-slate-400">Order total {proof.total}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/20">
                    Verified
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Items</p>
                  <div className="flex flex-wrap gap-2">
                    {proof.items.map((item) => (
                      <span key={item} className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 text-sm border border-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-500">Delivered {proof.date}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
