"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, BarChart3, Package, CircleDollarSign, Ticket } from "lucide-react";

const orders = [
  { id: "ORD-1042", customer: "VoidRunner", amount: "$42.50", status: "Completed", date: "May 16, 2026" },
  { id: "ORD-1041", customer: "AetherMage", amount: "$18.99", status: "Completed", date: "May 14, 2026" },
  { id: "ORD-1040", customer: "NightForge", amount: "$65.00", status: "Pending", date: "May 13, 2026" },
  { id: "ORD-1039", customer: "LunaHex", amount: "$25.00", status: "Completed", date: "May 12, 2026" },
  { id: "ORD-1038", customer: "ArcBloom", amount: "$54.99", status: "Review", date: "May 9, 2026" },
];

const stats = [
  { label: "Total Orders", value: "248", icon: BarChart3, color: "text-blue-400" },
  { label: "Revenue", value: "$8,420", icon: CircleDollarSign, color: "text-green-400" },
  { label: "Active Products", value: "86", icon: Package, color: "text-purple-400" },
  { label: "Pending Tickets", value: "12", icon: Ticket, color: "text-orange-400" },
];

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggedIn(true);
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
            <Link href="/admin" className="text-white font-medium">Admin</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-7 h-7 text-orange-400" />
              <h1 className="text-2xl font-bold">Admin Login</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nosmarket.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-400 rounded-lg font-medium transition"
              >
                Login
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400 mt-2">Store operations, order tracking, and inventory health.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/60 text-slate-400 text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-slate-700/80">
                        <td className="px-6 py-4 text-white font-medium">{order.id}</td>
                        <td className="px-6 py-4 text-slate-300">{order.customer}</td>
                        <td className="px-6 py-4 text-slate-300">{order.amount}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              order.status === "Completed"
                                ? "bg-green-500/15 text-green-400 border-green-500/20"
                                : order.status === "Pending"
                                  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                                  : "bg-blue-500/15 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
