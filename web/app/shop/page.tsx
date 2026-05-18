"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Search, ShoppingCart, Package, X, Minus, Plus, Loader2, User, MapPin, CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  bulkPrice?: number;
  image?: string;
  desc?: string;
}

interface CartItem extends Product { quantity: number }

interface DeliverySlot {
  id: string;
  ownerTimezone: string;
  customerTimezone: string;
  startAt: string;
  endAt: string;
  ownerStartText: string;
  ownerEndText: string;
  customerStartText: string;
  customerEndText: string;
  note?: string;
}

interface RobloxResult {
  robloxUserId: string;
  robloxUsername: string;
  robloxDisplayName: string;
}

const CUSTOMER_TIMEZONES = [
  { value: "America/New_York", label: "US Eastern (New York)" },
  { value: "America/Chicago", label: "US Central (Chicago)" },
  { value: "America/Denver", label: "US Mountain (Denver)" },
  { value: "America/Los_Angeles", label: "US Pacific (Los Angeles)" },
  { value: "America/Sao_Paulo", label: "Brazil (Sao Paulo)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "France (Paris)" },
  { value: "Europe/Berlin", label: "Germany (Berlin)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Asia/Shanghai", label: "China (Shanghai)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
  { value: "Pacific/Auckland", label: "New Zealand (Auckland)" },
];

type Step = "shop" | "roblox" | "delivery" | "ticket";

export default function ShopPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<Step>("shop");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [robloxQuery, setRobloxQuery] = useState("");
  const [robloxSearching, setRobloxSearching] = useState(false);
  const [robloxResult, setRobloxResult] = useState<RobloxResult | null>(null);
  const [robloxLinked, setRobloxLinked] = useState(false);

  const [customerTimezone, setCustomerTimezone] = useState("America/New_York");
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  const [ticketResult, setTicketResult] = useState<{ channelId: string; alreadyExists?: boolean } | null>(null);

  useEffect(() => { void loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/shop/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  );

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const addToCart = (p: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === p._id);
      if (existing) return prev.map((i) => i._id === p._id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { ...p, quantity: qty }];
    });
  };
  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i._id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };
  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i._id !== id));

  const doCheckout = async () => {
    if (!user || !token) { setError("Login with Discord first"); return; }
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cartItems: cart.map((i) => ({ product: i._id, name: i.name, quantity: i.quantity, price: i.price })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      setOrderId(data.orderId);
      setStep("roblox");
    } catch (err) { setError(err instanceof Error ? err.message : "Checkout failed"); }
    finally { setSubmitting(false); }
  };

  const searchRoblox = async () => {
    if (!robloxQuery.trim()) return;
    setRobloxSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/roblox/search?username=${encodeURIComponent(robloxQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Roblox user not found");
      setRobloxResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Roblox search failed"); }
    finally { setRobloxSearching(false); }
  };

  const linkRoblox = async () => {
    if (!robloxResult || !orderId || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}?action=link-roblox`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(robloxResult),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Link failed");
      setRobloxLinked(true);
      const slotRes = await fetch(`/api/shop/delivery-slots?timezone=${encodeURIComponent(customerTimezone)}`, { cache: "no-store" });
      const slotData = await slotRes.json();
      setDeliverySlots(Array.isArray(slotData?.slots) ? slotData.slots : []);
      setSlotsLoaded(true);
      setStep("delivery");
    } catch (err) { setError(err instanceof Error ? err.message : "Link failed"); }
    finally { setSubmitting(false); }
  };

  const confirmSlot = async () => {
    if (!selectedSlot || !orderId || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}?action=delivery-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotId: selectedSlot, customerTimezone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Slot selection failed");
      setStep("ticket");
    } catch (err) { setError(err instanceof Error ? err.message : "Slot selection failed"); }
    finally { setSubmitting(false); }
  };

  const createTicket = async () => {
    if (!orderId || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}?action=create-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Ticket creation failed");
      setTicketResult({ channelId: data.channelId, alreadyExists: data.alreadyExists });
    } catch (err) { setError(err instanceof Error ? err.message : "Ticket creation failed"); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Navbar />
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Floating cart button */}
      {step === "shop" && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-medium shadow-2xl"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && <span>Cart ({cartCount})</span>}
        </button>
      )}

      {/* Cart sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h2 className="text-lg font-semibold">Cart ({cartCount})</h2>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? <p className="text-center text-slate-400 py-12">Cart empty</p> : null}
              {cart.map((item) => (
                <div key={item._id} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-900">
                    {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-full w-full p-2 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => updateQty(item._id, -1)} className="rounded bg-slate-800 p-1"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, 1)} className="rounded bg-slate-800 p-1"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm font-medium text-emerald-300">${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeItem(item._id)} className="text-xs text-red-300">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 ? (
              <div className="border-t border-slate-800 p-4 space-y-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-emerald-300">${cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => { setSidebarOpen(false); void doCheckout(); }} disabled={submitting} className="w-full rounded-lg bg-blue-600 py-3 font-medium disabled:opacity-50">
                  {submitting ? "Processing..." : "Checkout"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error ? <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        {/* CHECKOUT FLOW */}
        {step !== "shop" && (
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="flex gap-2">
              {(["roblox", "delivery", "ticket"] as const).map((s) => (
                <div key={s} className={"h-2 flex-1 rounded-full " + (step === s ? "bg-blue-500" : (["roblox", "delivery", "ticket"].indexOf(step) > ["roblox", "delivery", "ticket"].indexOf(s) ? "bg-emerald-500" : "bg-slate-800"))} />
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <p className="text-sm text-slate-400">Order {orderId}</p>
                <div className="mt-2 space-y-1">
                  {cart.map((i) => (
                    <div key={i._id} className="flex justify-between text-sm">
                      <span>{i.quantity}x {i.name}</span>
                      <span className="text-slate-300">${(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold">
                    <span>Total</span>
                    <span className="text-emerald-300">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ROBLOX */}
              {step === "roblox" && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><User className="h-5 w-5" />Verify Roblox Account</h3>
                  <p className="text-sm text-slate-400">Search your Roblox username to link it with this order.</p>
                  <div className="flex gap-2">
                    <input value={robloxQuery} onChange={(e) => setRobloxQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void searchRoblox(); }} placeholder="Roblox username..." className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                    <button onClick={() => void searchRoblox()} disabled={robloxSearching} className="rounded-lg bg-blue-600 px-4 py-3 font-medium disabled:opacity-50">
                      {robloxSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                    </button>
                  </div>
                  {robloxResult && !robloxLinked && (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                      <p className="font-semibold">{robloxResult.robloxDisplayName}</p>
                      <p className="text-sm text-slate-400">@{robloxResult.robloxUsername}</p>
                      <button onClick={() => void linkRoblox()} disabled={submitting} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-50">
                        {submitting ? "Linking..." : "Confirm this is my account"}
                      </button>
                    </div>
                  )}
                  {robloxLinked && robloxResult && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                      <CheckCircle2 className="h-5 w-5" />
                      Linked: {robloxResult.robloxDisplayName}
                    </div>
                  )}
                </div>
              )}

              {/* DELIVERY */}
              {step === "delivery" && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" />Choose Delivery Time</h3>
                  <div>
                    <label className="text-sm text-slate-400">Your timezone</label>
                    <select value={customerTimezone} onChange={(e) => setCustomerTimezone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none">
                      {CUSTOMER_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Available slots (in your local time)</label>
                    {deliverySlots.length === 0 && slotsLoaded ? <p className="text-sm text-slate-400">No available slots right now.</p> : null}
                    {deliverySlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={"w-full rounded-xl border p-4 text-left transition-all " + (selectedSlot === slot.id ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700")}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-blue-300" />
                          <span className="text-sm font-medium">{slot.customerStartText} - {slot.customerEndText}</span>
                        </div>
                        {slot.note ? <p className="mt-1 text-xs text-slate-400">{slot.note}</p> : null}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => void confirmSlot()} disabled={!selectedSlot || submitting} className="w-full rounded-lg bg-blue-600 py-3 font-medium disabled:opacity-50">
                    {submitting ? "Saving..." : "Confirm delivery time"}
                  </button>
                </div>
              )}

              {/* TICKET */}
              {step === "ticket" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create Support Ticket</h3>
                  <p className="text-sm text-slate-400">A Discord ticket will be created with your order details, Roblox account, and delivery time. Payment instructions will be provided there.</p>
                  {!ticketResult ? (
                    <button onClick={() => void createTicket()} disabled={submitting} className="w-full rounded-lg bg-emerald-600 py-3 font-medium disabled:opacity-50">
                      {submitting ? "Creating ticket..." : "Create Discord Ticket"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                        <span className="text-sm">Ticket created!</span>
                      </div>
                      {ticketResult.channelId ? (
                        <a
                          href={"https://discord.com/channels/" + ticketResult.channelId}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-5 py-3 text-sm font-medium"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Ticket in Discord
                        </a>
                      ) : null}
                      <button
                        onClick={() => {
                          setStep("shop");
                          setCart([]);
                          setOrderId(null);
                          setRobloxResult(null);
                          setRobloxLinked(false);
                          setSelectedSlot(null);
                          setTicketResult(null);
                        }}
                        className="w-full rounded-lg bg-slate-800 py-3 text-sm"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SHOP BROWSING */}
        {step === "shop" && (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items..." className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product) => (
                <div key={product._id} className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-blue-500/40">
                  <div className="relative h-40 bg-slate-950">
                    {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-slate-700" /></div>}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="truncate text-sm font-medium">{product.name}</h3>
                    <p className="text-xs text-slate-500">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-emerald-300">${product.price.toFixed(2)}</span>
                      <button onClick={() => addToCart(product)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium">Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading ? (
              <div className="py-20 text-center text-slate-400">
                <Package className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p>No items found.</p>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
