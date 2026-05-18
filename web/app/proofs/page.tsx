"use client";

import Navbar from "../components/Navbar";
import { ShieldCheck, ImageIcon, ExternalLink, Loader2 } from "lucide-react";

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
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            Verified Deliveries
          </div>
          <h1 className="text-4xl font-bold mb-3">Proof of Delivery</h1>
          <p className="text-slate-400 max-w-3xl text-base">
            Every completed order is logged and verified by our team. Browse recent customer delivery confirmations below.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <a
              href="https://discord.gg/vouch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Discord Vouch Channel
            </a>
          </div>
        </div>

        {/* Proof Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {proofs.map((proof, i) => (
            <div
              key={proof.id}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                <ImageIcon className="w-14 h-14 text-slate-500" />
                {proof.items.length > 1 && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded-md text-xs text-white">
                    {proof.items.length} photos
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{proof.username}</p>
                    <p className="text-sm text-slate-400">Order total {proof.total}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/20 animate-bounce-in">
                    Verified
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Items delivered</p>
                  <div className="flex flex-wrap gap-2">
                    {proof.items.map((item) => (
                      <span key={item} className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 text-sm border border-slate-700 hover:border-blue-500/30 transition-colors">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500">Delivered {proof.date}</p>
                  <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                    <Loader2 className="w-3 h-3" />
                    Confirmed
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer disclaimer */}
        <div className="mt-12 text-center text-slate-500 text-sm animate-fade-in">
          <p>This website only provides a marketplace for digital item transactions. All deliveries are processed by our staff team via Discord.</p>
        </div>
      </main>
    </div>
  );
}
