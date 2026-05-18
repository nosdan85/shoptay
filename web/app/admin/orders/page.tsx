"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, CheckCircle2, Clock3, RefreshCcw, Search, ShieldAlert, XCircle } from "lucide-react";

type Order = {
  _id: string;
  orderId?: string;
  discordUsername?: string;
  discordId?: string;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  items?: Array<{ name?: string; quantity?: number }>;
  txnId?: string;
};

const statusTone = (status?: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-500/15 text-green-300 border-green-500/30";
    case "Cancelled":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "Waiting Payment":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  }
};

export default function AdminOrdersPage() {
  const { user, token, isLoading, getOAuthUrl } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mutatingId, setMutatingId] = useState("");

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load orders");
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.isOwner) {
      void loadOrders();
    } else {
      setLoading(false);
    }
  }, [token, user?.isOwner]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const statusOk = status === "All" || (order.status || "Pending") === status;
      if (!statusOk) return false;
      if (!needle) return true;
      return [
        order.orderId,
        order.discordUsername,
        order.discordId,
        order.txnId,
        ...(order.items || []).map((item) => item.name || ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [orders, query, status]);

  const updateStatus = async (id: string, nextStatus: string) => {
    if (!token) return;
    setMutatingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/order/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update order");
      setOrders((prev) => prev.map((order) => (order._id === id ? data.order : order)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setMutatingId("");
    }
  };

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-24">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-400" />
            <h1 className="text-2xl font-semibold">Admin login required</h1>
            <a href={getOAuthUrl()} className="mt-6 inline-flex rounded-lg bg-[#5865F2] px-5 py-3 font-medium">
              Login with Discord
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (user && !user.isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-24">
          <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-400" />
            <h1 className="text-2xl font-semibold">Access denied</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Orders</h1>
            <p className="mt-1 text-sm text-slate-400">Real orders. No mock stats.</p>
          </div>
          <button
            onClick={() => void loadOrders()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order / user / item / txn"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none"
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Waiting Payment">Waiting Payment</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="grid grid-cols-[1.1fr_1fr_140px_140px_180px] gap-4 border-b border-slate-800 px-5 py-4 text-xs uppercase tracking-wide text-slate-500">
            <div>Order</div>
            <div>Customer</div>
            <div>Total</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {loading ? (
            <div className="px-5 py-10 text-sm text-slate-400">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-400">No orders found.</div>
          ) : (
            filtered.map((order) => (
              <div key={order._id} className="grid grid-cols-[1.1fr_1fr_140px_140px_180px] gap-4 border-b border-slate-800 px-5 py-4 last:border-b-0">
                <div>
                  <div className="font-medium text-white">{order.orderId || order._id}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {(order.items || []).map((item) => `${item.quantity || 1}x ${item.name || "Item"}`).join(", ") || "No items"}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white">{order.discordUsername || "Unknown user"}</div>
                  <div className="text-xs text-slate-500">{order.discordId || "-"}</div>
                </div>
                <div className="text-sm font-medium text-emerald-300">
                  ${Number(order.totalAmount || 0).toFixed(2)}
                </div>
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusTone(order.status)}`}>
                    {order.status || "Pending"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={mutatingId === order._id}
                    onClick={() => void updateStatus(order._id, "Completed")}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-500/15 px-2.5 py-1.5 text-xs text-green-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    disabled={mutatingId === order._id}
                    onClick={() => void updateStatus(order._id, "Waiting Payment")}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs text-amber-300"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    Hold
                  </button>
                  <button
                    disabled={mutatingId === order._id}
                    onClick={() => void updateStatus(order._id, "Cancelled")}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs text-red-300"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
