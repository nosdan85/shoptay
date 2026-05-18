"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  Search, ShoppingCart, Package, X, Minus, Plus, Loader2, User, MapPin,
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Gamepad2, ArrowLeft
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function imgUrl(src: string | undefined | null): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

function maskName(name: string): string {
  if (!name || name.length <= 2) return "***";
  return name[0] + "*".repeat(Math.min(name.length - 1, 4));
}

const CUSTOMER_TZS = [
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Chicago", label: "US Central" },
  { value: "America/Denver", label: "US Mountain" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Europe/London", label: "UK" },
  { value: "Europe/Paris", label: "France" },
  { value: "Europe/Berlin", label: "Germany" },
  { value: "Asia/Ho_Chi_Minh", label: "Vietnam" },
  { value: "Asia/Tokyo", label: "Japan" },
  { value: "Asia/Shanghai", label: "China" },
  { value: "Australia/Sydney", label: "Australia" },
];

interface Product { _id: string; name: string; category: string; price: number; bulkPrice?: number; image?: string; desc?: string; gameId?: string }
interface CartItem extends Product { quantity: number }
interface Game { _id: string; name: string; slug: string; image?: string }
interface Slot { id: string; ownerStartText: string; ownerEndText: string; customerStartText: string; customerEndText: string; startAt: string; endAt: string; note?: string }
interface Purchase { username: string; productName: string; quantity?: number; price?: number }

type Step = "shop" | "roblox" | "delivery" | "ticket";

function DogLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/95">
      <div className="relative h-12 w-48 overflow-hidden rounded-full bg-slate-800">
        <div className="absolute inset-y-0 left-0 bg-blue-500 animate-[load_2s_ease-in-out_infinite] rounded-full" style={{ width: "0%", animationName: "dogbar" }} />
      </div>
      <style>{`@keyframes dogbar { 0%{width:0%} 50%{width:70%} 100%{width:100%} }`}</style>
      <div className="mt-4 text-3xl">
        <svg viewBox="0 0 64 64" width="48" height="48">
          <circle cx="32" cy="20" r="14" fill="#D2691E"/>
          <circle cx="26" cy="16" r="3" fill="#333"/>
          <circle cx="38" cy="16" r="3" fill="#333"/>
          <ellipse cx="32" cy="24" rx="4" ry="3" fill="#333"/>
          <ellipse cx="20" cy="28" rx="5" ry="6" fill="#D2691E" transform="rotate(-20 20 28)"/>
          <ellipse cx="44" cy="28" rx="5" ry="6" fill="#D2691E" transform="rotate(20 44 28)"/>
          <rect x="22" y="34" width="20" height="18" rx="6" fill="#D2691E"/>
          <rect x="18" y="48" width="6" height="12" rx="3" fill="#D2691E"/>
          <rect x="40" y="48" width="6" height="12" rx="3" fill="#D2691E"/>
          <path d="M28 52 Q32 58 36 52" stroke="#333" strokeWidth="2" fill="none"/>
        </svg>
      </div>
      <p className="mt-3 text-sm text-slate-400">Loading...</p>
    </div>
  );
}

export default function ShopPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [banners, setBanners] = useState<string[]>([]);
  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<Step>("shop");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [robloxUsernameInput, setRobloxUsernameInput] = useState("");
  const [customerTz, setCustomerTz] = useState("America/New_York");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<{ channelId: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState<string | number>(1);
  const [modalOpen, setModalOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nosmarket_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Save cart to localStorage when changed
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("nosmarket_cart", JSON.stringify(newCart));
    } catch (_) {}
  };

  useEffect(() => { void load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, gRes, cRes, rRes] = await Promise.all([
        fetch("/api/shop/products", { cache: "no-store" }),
        fetch("/api/shop/games", { cache: "no-store" }),
        fetch("/api/shop/config", { cache: "no-store" }),
        fetch("/api/shop/recent-purchases", { cache: "no-store" }),
      ]);
      const pData = await pRes.json();
      const gData = await gRes.json();
      const cData = await cRes.json();
      const rData = await rRes.json();
      setProducts(Array.isArray(pData) ? pData : []);
      setGames(Array.isArray(gData) ? gData : []);
      setBanners(Array.isArray(cData.banners) ? cData.banners : []);
      setBestSellerIds(Array.isArray(cData.bestSellerIds) ? cData.bestSellerIds : []);
      setRecentPurchases(Array.isArray(rData) ? rData : []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = products;
    if (selectedGame) list = list.filter((p) => p.gameId === selectedGame);
    if (searchQuery) list = list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [products, selectedGame, searchQuery]);

  const bestSellers = useMemo(() => {
    if (bestSellerIds.length === 0) return [];
    const bs: Product[] = [];
    for (const id of bestSellerIds) {
      const p = products.find((x) => x._id === id);
      if (p) bs.push(p);
    }
    return bs;
  }, [products, bestSellerIds]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const openProductModal = (p: Product) => {
    setSelectedProduct(p);
    setModalQty(1);
    setModalOpen(true);
  };

  const addToCartFromModal = () => {
    if (!selectedProduct) return;
    const finalQty = Math.max(1, typeof modalQty === "number" ? modalQty : parseInt(modalQty) || 1);
    const updatedCart = [...cart];
    const exIndex = updatedCart.findIndex((i) => i._id === selectedProduct._id);
    if (exIndex > -1) {
      updatedCart[exIndex].quantity += finalQty;
    } else {
      updatedCart.push({ ...selectedProduct, quantity: finalQty });
    }
    saveCart(updatedCart);
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const updateQty = (id: string, d: number) => {
    const updated = cart.map((i) => (i._id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
    saveCart(updated);
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((i) => i._id !== id);
    saveCart(updated);
  };

  const clearCartState = () => {
    setCart([]);
    try {
      localStorage.removeItem("nosmarket_cart");
    } catch (_) {}
  };

  const doCheckout = async () => {
    if (!user || !token) { setError("Login first"); return; }
    if (cart.length === 0) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartItems: cart.map((i) => ({ product: i._id, name: i.name, quantity: i.quantity, price: i.price })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      setOrderId(data.orderId);
      setStep("roblox");
    } catch (e) { setError(e instanceof Error ? e.message : "Checkout failed"); }
    finally { setSubmitting(false); }
  };

  const linkRobloxUsername = async () => {
    if (!robloxUsernameInput.trim() || !orderId || !token) return;
    setSubmitting(true); setError(null);
    try {
      const payload = { robloxUsername: robloxUsernameInput.trim(), robloxUserId: "", robloxDisplayName: robloxUsernameInput.trim() };
      const res = await fetch(`/api/shop/orders/${orderId}?action=link-roblox`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Link failed");

      const sRes = await fetch(`/api/shop/delivery-slots?timezone=${encodeURIComponent(customerTz)}`, { cache: "no-store" });
      const sData = await sRes.json();
      setSlots(Array.isArray(sData?.slots) ? sData.slots : []);
      setStep("delivery");
    } catch (e) { setError(e instanceof Error ? e.message : "Link failed"); }
    finally { setSubmitting(false); }
  };

  const confirmSlot = async () => {
    if (!pickedSlot || !orderId || !token) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}?action=delivery-slot`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotId: pickedSlot, customerTimezone: customerTz }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setStep("ticket");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const createTicket = async () => {
    if (!orderId || !token) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}?action=create-ticket`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setTicketResult({ channelId: data.channelId });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-950"><Navbar /><DogLoader /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {step === "shop" && cartCount > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-medium shadow-2xl transition-transform hover:scale-105 active:scale-95">
          <ShoppingCart className="h-5 w-5" /> Cart ({cartCount})
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h2 className="text-lg font-semibold">Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item._id} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-900">
                    {item.image ? <img src={imgUrl(item.image)} alt="" className="h-full w-full object-cover" /> : <Package className="h-full w-full p-3 text-slate-600" />}
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
            {cart.length > 0 && (
              <div className="border-t border-slate-800 p-4 space-y-3">
                <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="text-emerald-300">${cartTotal.toFixed(2)}</span></div>
                <button onClick={() => { setCartOpen(false); void doCheckout(); }} disabled={submitting} className="w-full rounded-lg bg-blue-600 py-3 font-medium transition-all hover:bg-blue-500 disabled:opacity-50">{submitting ? "Processing..." : "Checkout"}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button onClick={() => setModalOpen(false)} className="absolute right-4 top-4 rounded-lg bg-slate-800 p-2 hover:bg-slate-700"><X className="h-5 w-5" /></button>
            <div className="flex gap-4 mb-4">
              <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-950">
                {selectedProduct.image ? <img src={imgUrl(selectedProduct.image)} alt="" className="h-full w-full object-cover" /> : <Package className="h-full w-full p-6 text-slate-700" />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                <p className="text-sm text-slate-400">{selectedProduct.category}</p>
                <p className="mt-2 text-2xl font-bold text-emerald-300">${selectedProduct.price.toFixed(2)}</p>
                {selectedProduct.bulkPrice && (
                  <p className="text-xs text-amber-400">Bulk price: ${selectedProduct.bulkPrice.toFixed(2)} (when applicable)</p>
                )}
              </div>
            </div>
            {selectedProduct.desc && (
              <div className="mb-4 rounded-lg bg-slate-950 p-3">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedProduct.desc}</p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setModalQty(Math.max(1, (typeof modalQty === "number" ? modalQty : parseInt(modalQty) || 1) - 1))} className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700"><Minus className="h-4 w-4" /></button>
                <input
                  type="text"
                  value={modalQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setModalQty("");
                    } else {
                      const parsed = parseInt(val);
                      if (!isNaN(parsed)) {
                        setModalQty(Math.max(1, parsed));
                      }
                    }
                  }}
                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-lg font-semibold outline-none focus:border-blue-500"
                />
                <button onClick={() => setModalQty((typeof modalQty === "number" ? modalQty : parseInt(modalQty) || 1) + 1)} className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <button onClick={addToCartFromModal} className="w-full rounded-lg bg-blue-600 py-3 font-medium hover:bg-blue-500 transition-colors">Add to Cart</button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {step !== "shop" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <button onClick={() => setStep("shop")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Shop
            </button>
            <div className="flex gap-2">{(["roblox", "delivery", "ticket"] as const).map((s) => (
              <div key={s} className={"h-2 flex-1 rounded-full transition-colors " + (step === s ? "bg-blue-500" : (["roblox", "delivery", "ticket"].indexOf(step) > ["roblox", "delivery", "ticket"].indexOf(s) ? "bg-emerald-500" : "bg-slate-800"))} />
            ))}</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <p className="text-sm text-slate-400">Order {orderId}</p>
                <div className="mt-2 space-y-1">{cart.map((i) => (
                  <div key={i._id} className="flex justify-between text-sm"><span>{i.quantity}x {i.name}</span><span className="text-slate-300">${(i.price * i.quantity).toFixed(2)}</span></div>
                ))}<div className="flex justify-between border-t border-slate-800 pt-2 font-semibold"><span>Total</span><span className="text-emerald-300">${cartTotal.toFixed(2)}</span></div></div>
              </div>
              {step === "roblox" && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><User className="h-5 w-5" />Enter Roblox Username</h3>
                  <div className="flex flex-col gap-3">
                    <input
                      value={robloxUsernameInput}
                      onChange={(e) => setRobloxUsernameInput(e.target.value)}
                      placeholder="Enter Roblox username..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => void linkRobloxUsername()}
                      disabled={submitting || !robloxUsernameInput.trim()}
                      className="w-full rounded-lg bg-blue-600 py-3 font-medium transition-all hover:bg-blue-500 disabled:opacity-50"
                    >
                      {submitting ? "Linking..." : "Confirm & Proceed"}
                    </button>
                  </div>
                </div>
              )}
              {step === "delivery" && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" />Delivery Time</h3>
                  <select value={customerTz} onChange={(e) => setCustomerTz(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none">
                    {CUSTOMER_TZS.map((t) => <option key={t.value} value={t.value}>{t.label} ({t.value})</option>)}
                  </select>
                  <div className="space-y-2">{slots.length === 0 && <p className="text-sm text-slate-400">No available slots.</p>}
                    {slots.map((s) => (
                      <button key={s.id} onClick={() => setPickedSlot(s.id)} className={"w-full rounded-xl border p-4 text-left transition-all " + (pickedSlot === s.id ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700")}>
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-300" /><span className="text-sm font-medium">{s.customerStartText} - {s.customerEndText}</span></div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => void confirmSlot()} disabled={!pickedSlot || submitting} className="w-full rounded-lg bg-blue-600 py-3 font-medium disabled:opacity-50">{submitting ? "Saving..." : "Confirm time"}</button>
                </div>
              )}
              {step === "ticket" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create Discord Ticket</h3>
                  {!ticketResult ? (
                    <button onClick={() => void createTicket()} disabled={submitting} className="w-full rounded-lg bg-emerald-600 py-3 font-medium disabled:opacity-50">{submitting ? "Creating..." : "Create Ticket"}</button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><span className="text-sm">Ticket created!</span></div>
                      <button onClick={() => { setStep("shop"); clearCartState(); setOrderId(null); setRobloxUsernameInput(""); setPickedSlot(null); setTicketResult(null); }} className="w-full rounded-lg bg-slate-800 py-3 text-sm">Continue Shopping</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "shop" && (
          <div className="space-y-8">
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 py-2">
              <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap">
                {[...recentPurchases, ...recentPurchases].map((p, i) => (
                  <span key={i} className="mx-6 inline-flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-blue-400 font-medium">{maskName(p.username)}</span>
                    <span className="text-slate-500">purchased</span>
                    <span className="text-emerald-400">{p.productName}{p.quantity ? ` x${p.quantity}` : ""}</span>
                    {p.price && <span className="text-slate-400">@ ${p.price.toFixed(2)}</span>}
                  </span>
                ))}
              </div>
              <style>{`@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items..." className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 outline-none transition-colors focus:border-blue-500" />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedGame(null)} className={"rounded-lg px-4 py-2 text-sm font-medium transition-all " + (!selectedGame ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800")}>
                All Games
              </button>
              {games.map((g) => (
                <button key={g._id} onClick={() => setSelectedGame(g._id)} className={"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all " + (selectedGame === g._id ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800")}>
                  {g.image && <img src={imgUrl(g.image)} alt="" className="h-5 w-5 rounded object-cover" />}
                  {g.name}
                </button>
              ))}
            </div>

            {banners.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <img src={imgUrl(banners[0])} alt="" className="w-full object-cover" style={{ maxHeight: "400px" }} />
              </div>
            )}

            {bestSellers.length > 0 && !showAll && !selectedGame && !searchQuery && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-amber-400">🔥 Best Sellers</h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {bestSellers.map((p) => (
                    <div key={p._id} onClick={() => openProductModal(p)} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-blue-500/40 hover:-translate-y-1">
                      <div className="h-32 bg-slate-950">
                        {p.image ? <img src={imgUrl(p.image)} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-slate-700" /></div>}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-emerald-300">${p.price.toFixed(2)}</span>
                          <span className="text-xs text-blue-400">View</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{selectedGame ? games.find((g) => g._id === selectedGame)?.name || "Items" : "All Items"}</h2>
                {!showAll && filtered.length > 8 && !searchQuery && (
                  <button onClick={() => setShowAll(true)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm transition-colors hover:bg-slate-700">View Full</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {(showAll ? filtered : filtered.slice(0, 8)).map((p) => (
                  <div key={p._id} onClick={() => openProductModal(p)} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-200 hover:border-blue-500/40 hover:-translate-y-1">
                    <div className="h-40 bg-slate-950">
                      {p.image ? <img src={imgUrl(p.image)} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-slate-700" /></div>}
                    </div>
                    <div className="space-y-2 p-4">
                      <h3 className="truncate text-sm font-medium">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-emerald-300">${p.price.toFixed(2)}</span>
                        <span className="text-xs text-blue-400">View</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filtered.length === 0 && <div className="py-20 text-center text-slate-400"><Package className="mx-auto mb-4 h-16 w-16 opacity-30" /><p>No items found.</p></div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}