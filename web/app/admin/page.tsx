"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { BarChart3, Package, CircleDollarSign, Ticket, Loader2, AlertCircle } from "lucide-react";

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
  const { user, isLoading, getOAuthUrl } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (!isLoading) setIsChecking(false);
  }, [isLoading]);

  // Not logged in ? prompt Discord login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center py-24 px-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center animate-fade-in-up">
            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">Admin Access Required</h1>
            <p className="text-slate-400 mb-6">You must login with Discord to access the admin panel. Only accounts with the Owner role can manage this store.</p>
            <a
              href={getOAuthUrl()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
              Login with Discord
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but not owner
  if (!user.isOwner) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center py-24 px-4">
          <div className="max-w-md w-full bg-slate-800 border border-red-500/30 rounded-2xl p-8 text-center animate-fade-in-up">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
            <p className="text-slate-400 mb-2">Logged in as <strong className="text-white">{user.discordUsername}</strong></p>
            <p className="text-slate-400">Your Discord account does not have the Owner role required to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  // Owner ? show dashboard
  const filteredOrders = statusFilter === "All" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400 mt-2">Welcome back, <span className="text-orange-400 font-medium">{user.discordUsername}</span></p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all duration-200 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
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
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Orders</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Review">Review</option>
              </select>
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
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-700/80 hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{order.id}</td>
                      <td className="px-6 py-4 text-slate-300">{order.customer}</td>
                      <td className="px-6 py-4 text-slate-300">{order.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          order.status === "Completed" ? "bg-green-500/15 text-green-400 border-green-500/20"
                            : order.status === "Pending" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                            : "bg-blue-500/15 text-blue-400 border-blue-500/20"
                        }`}>
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
      </main>
    </div>
  );
}
