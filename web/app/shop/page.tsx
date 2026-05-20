"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { ALL_TIMEZONES, detectUserTimezone, filterTimezones, getTimezonesGroupedByCountry, type CountryGroup } from "@/lib/timezones";
import {
  Search,
  ShoppingCart,
  Package,
  X,
  Minus,
  Plus,
  User,
  MapPin,
  Loader2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
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


interface Product { _id: string; name: string; category: string; price: number; bulkPrice?: number; image?: string; desc?: string; gameId?: string }
interface CartItem extends Product { quantity: number }
interface Game { _id: string; name: string; slug: string; image?: string }
interface Slot { id: string; ownerStartText: string; ownerEndText: string; customerStartText: string; customerEndText: string; startAt: string; endAt: string; note?: string }
interface Purchase { username: string; productName: string; quantity?: number; price?: number }
interface TicketResult { channelId: string; guildId?: string; url?: string }

type Step = "shop" | "roblox" | "delivery" | "ticket";

const BEST_SELLERS_PER_PAGE = 4;

function LogoLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <style>{`
        @keyframes progress {
          0%, 100% { width: 8%; opacity: 0.55; }
          50% { width: 96%; opacity: 1; }
        }
        @keyframes logo-roll {
          0% { transform: translateX(-32px) rotate(0deg); }
          100% { transform: translateX(320px) rotate(360deg); }
        }
      `}</style>

      <div className="relative mb-4 w-80 max-w-[80vw]">
        <div className="h-3 overflow-hidden rounded-full border border-sky-500/30 bg-slate-900">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>

        <div className="pointer-events-none absolute left-0 top-1/2 h-9 w-9 -translate-y-1/2 animate-[logo-roll_1.8s_linear_infinite]">
          <img src="/site-logo.png" alt="Loading" className="h-full w-full object-contain" />
        </div>
      </div>

      <p className="text-sm font-medium text-sky-100">Loading shop...</p>
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
  const [cartClosing, setCartClosing] = useState(false);
  const [step, setStep] = useState<Step>("shop");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [robloxUsernameInput, setRobloxUsernameInput] = useState("");
  const [customerTz, setCustomerTz] = useState(detectUserTimezone());
  const [tzSearch, setTzSearch] = useState("");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<TicketResult | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState<string | number>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [robloxSearchResult, setRobloxSearchResult] = useState<null | { userId: string; username: string; displayName: string; avatar: string }>(null);
  const [bestSellerPage, setBestSellerPage] = useState(0);

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

  const timezoneOptions = useMemo(() => {
    const detected = customerTz && !ALL_TIMEZONES.some((tz) => tz.value === customerTz)
      ? [{ value: customerTz, label: "Detected timezone", country: "Your device", currency: "USD", currencySymbol: "$", currencyCode: "USD" }]
      : [];
    return [...detected, ...filterTimezones(tzSearch)];
  }, [customerTz, tzSearch]);

  const timezoneCountryGroups = useMemo<CountryGroup[]>(() => {
    const optionsByValue = new Set(timezoneOptions.map((tz) => tz.value));
    const groups = getTimezonesGroupedByCountry()
      .map((group) => ({ ...group, zones: group.zones.filter((zone) => optionsByValue.has(zone.value)) }))
      .filter((group) => group.zones.length > 0);
    const detected = timezoneOptions.find((tz) => tz.country === "Your device");
    return detected ? [{ country: detected.country, flag: "🌐", zones: [detected] }, ...groups] : groups;
  }, [timezoneOptions]);

  const selectedTimezoneLabel = useMemo(() => {
    const found = ALL_TIMEZONES.find((tz) => tz.value === customerTz);
    return found ? `${found.country} - ${found.label}` : `Detected - ${customerTz}`;
  }, [customerTz]);

  const selectTimezone = (tzValue: string) => {
    setCustomerTz(tzValue);
    setTzSearch("");
    setExpandedCountry(null);
    setPickedSlot(null);
    void fetch(`/api/shop/delivery-slots?timezone=${encodeURIComponent(tzValue)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSlots(Array.isArray(data?.slots) ? data.slots : []))
      .catch(() => {});
  };

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const openProductModal = (p: Product) => {
    setSelectedProduct(p);
    setModalQty(1);
    setModalClosing(false);
    setModalOpen(true);
  };

  const closeProductModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setSelectedProduct(null);
      setModalClosing(false);
    }, 250);
  };

  const closeCart = () => {
    setCartClosing(true);
    setTimeout(() => {
      setCartOpen(false);
      setCartClosing(false);
    }, 250);
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
    closeProductModal();
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
    setSubmitting(true); setCheckoutLoading(true); setError(null);
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
    finally { setSubmitting(false); setCheckoutLoading(false); }
  };

  const lookupRobloxUsername = async () => {
    if (!robloxUsernameInput.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/shop/roblox/search?username=${encodeURIComponent(robloxUsernameInput.trim())}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Roblox lookup failed");
      setRobloxSearchResult({
        userId: String(data.robloxUserId || ""),
        username: String(data.robloxUsername || ""),
        displayName: String(data.robloxDisplayName || ""),
        avatar: String(data.robloxAvatar || ""),
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Roblox lookup failed"); setRobloxSearchResult(null); }
    finally { setSubmitting(false); }
  };

  const linkRobloxUsername = async () => {
    if (!robloxSearchResult || !orderId || !token) return;
    setSubmitting(true); setError(null);
    try {
      const payload = {
        robloxUsername: robloxSearchResult.username,
        robloxUserId: robloxSearchResult.userId,
        robloxDisplayName: robloxSearchResult.displayName,
      };
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
      const ticketUrl = data?.guildId && data?.channelId
        ? `https://discord.com/channels/${data.guildId}/${data.channelId}`
        : data?.panelUrl || "";
      setTicketResult({ channelId: data.channelId, guildId: data.guildId, url: ticketUrl });
      clearCartState();
      if (ticketUrl) window.location.href = ticketUrl;
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-950"><Navbar /><LogoLoader /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {checkoutLoading && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 px-6 py-5 shadow-2xl animate-bounce-in">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm font-medium text-white">Processing checkout...</p>
          </div>
        </div>
      )}

      {step === "shop" && cartCount > 0 && (
        <button onClick={() => { setCartClosing(false); setCartOpen(true); }} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-medium shadow-2xl transition-transform hover:scale-105 active:scale-95">
          <ShoppingCart className="h-5 w-5" /> Cart ({cartCount})
        </button>
      )}

      {(cartOpen || cartClosing) && (
        <div className={"fixed inset-0 z-50 bg-black/60 backdrop-blur-sm " + (cartClosing ? "animate-fade-out" : "animate-fade-in")} onClick={closeCart}>
          <div className={"absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col " + (cartClosing ? "animate-cart-slide-out" : "animate-cart-slide-in")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h2 className="text-lg font-semibold">Cart ({cartCount})</h2>
              <button onClick={closeCart}><X className="h-5 w-5" /></button>
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
                <button onClick={() => { closeCart(); void doCheckout(); }} disabled={submitting} className="w-full rounded-lg bg-blue-600 py-3 font-medium transition-all hover:bg-blue-500 disabled:opacity-50">{submitting ? "Processing..." : "Checkout"}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {(modalOpen || modalClosing) && selectedProduct && (
        <div className={"fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 " + (modalClosing ? "animate-fade-out" : "animate-fade-in")}>
          <div className={"relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl " + (modalClosing ? "animate-fade-out" : "animate-modal-zoom-in")}>
            <button onClick={closeProductModal} className="absolute right-4 top-4 rounded-lg bg-slate-800 p-2 hover:bg-slate-700"><X className="h-5 w-5" /></button>
            <div className="flex gap-4 mb-4">
              <div className="w-32 aspect-square flex-shrink-0 overflow-hidden rounded-xl bg-slate-950">
                {selectedProduct.image ? <img src={imgUrl(selectedProduct.image)} alt="" className="h-full w-full object-contain" /> : <Package className="h-full w-full p-6 text-slate-700" />}
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

      <main className="mx-auto max-w-7xl px-4 py-6 animate-page-enter">
        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {step !== "shop" && (
          <div className="mx-auto max-w-2xl space-y-6 animate-page-enter">
            <button onClick={() => setStep("shop")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Shop
            </button>
            <div className="flex gap-2">{(["roblox", "delivery", "ticket"] as const).map((s) => (
              <div key={s} className={"h-2 flex-1 rounded-full transition-colors " + (step === s ? "bg-blue-500" : (["roblox", "delivery", "ticket"].indexOf(step) > ["roblox", "delivery", "ticket"].indexOf(s) ? "bg-emerald-500" : "bg-slate-800"))} />
            ))}</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 animate-section-enter">
              <div className="border-b border-slate-800 pb-3">
                <p className="text-sm text-slate-400">Order {orderId}</p>
                <div className="mt-2 space-y-1">{cart.map((i) => (
                  <div key={i._id} className="flex justify-between text-sm"><span>{i.quantity}x {i.name}</span><span className="text-slate-300">${(i.price * i.quantity).toFixed(2)}</span></div>
                ))}<div className="flex justify-between border-t border-slate-800 pt-2 font-semibold"><span>Total</span><span className="text-emerald-300">${cartTotal.toFixed(2)}</span></div></div>
              </div>
              {step === "roblox" && (
                <div className="space-y-4">
                  {!robloxSearchResult ? (
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
                          onClick={() => void lookupRobloxUsername()}
                          disabled={submitting || !robloxUsernameInput.trim() || robloxUsernameInput.length < 3}
                          className="w-full rounded-lg bg-blue-600 py-3 font-medium transition-all hover:bg-blue-500 disabled:opacity-50"
                        >
                          {submitting ? "Searching..." : "Lookup Account"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">Enter at least 3 characters to search</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold"><User className="h-5 w-5" />Verify Roblox Account</h3>
                      <p className="text-sm text-slate-400">Is this your Roblox account?</p>
                      <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-slate-800">
                          {robloxSearchResult.avatar ? (
                            <img src={robloxSearchResult.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-full w-full p-3 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-400">Display Name</p>
                          <p className="text-lg font-semibold text-white">{robloxSearchResult.displayName}</p>
                          <p className="text-sm text-blue-400">@{robloxSearchResult.username}</p>
                          <a
                            href={`https://www.roblox.com/users/${robloxSearchResult.userId}/profile`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-slate-400 hover:text-white"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => { setRobloxSearchResult(null); setRobloxUsernameInput(""); }}
                          className="rounded-lg bg-slate-700 py-3 font-medium transition-colors hover:bg-slate-600"
                        >
                          Re-enter
                        </button>
                        <button
                          onClick={() => void linkRobloxUsername()}
                          disabled={submitting}
                          className="rounded-lg bg-emerald-600 py-3 font-medium transition-colors hover:bg-emerald-500 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {step === "delivery" && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" />Delivery Time</h3>
                  <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Your timezone</p>
                        <p className="text-sm font-medium text-slate-200">{selectedTimezoneLabel}</p>
                        <p className="text-xs text-slate-500">{customerTz}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const detected = detectUserTimezone();
                          selectTimezone(detected);
                        }}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                      >
                        Auto detect
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        value={tzSearch}
                        onChange={(e) => setTzSearch(e.target.value)}
                        placeholder="Search country or timezone..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 py-3 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {timezoneCountryGroups.map((group) => {
                        const isExpanded = expandedCountry === group.country;
                        const hasMultiple = group.zones.length > 1;
                        const isAnySelected = group.zones.some((zone) => zone.value === customerTz);

                        return (
                          <div key={group.country} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (hasMultiple) {
                                  setExpandedCountry(isExpanded ? null : group.country);
                                  return;
                                }
                                selectTimezone(group.zones[0].value);
                              }}
                              className={"w-full rounded-lg border p-3 text-left transition-all " + (!hasMultiple && isAnySelected ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-900 hover:border-slate-700")}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-slate-100">{group.flag} {group.country}</span>
                                {hasMultiple ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-500"><span>{group.zones.length} zones</span><ChevronDown className={"h-3 w-3 transition-transform " + (isExpanded ? "rotate-180" : "")} /></span>
                                ) : (
                                  <span className="text-xs text-slate-500">{group.zones[0].value.split("/").pop()?.replaceAll("_", " ")}</span>
                                )}
                              </div>
                              {!hasMultiple && <p className="mt-1 text-xs text-slate-400">{group.zones[0].label}</p>}
                            </button>
                            {hasMultiple && isExpanded && (
                              <div className="ml-4 space-y-1 border-l-2 border-slate-700 pl-3">
                                {group.zones.map((tz) => (
                                  <button
                                    key={tz.value}
                                    type="button"
                                    onClick={() => selectTimezone(tz.value)}
                                    className={"w-full rounded-lg border p-2 text-left transition-all " + (customerTz === tz.value ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700")}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-sm text-slate-200">{tz.label}</span>
                                      <span className="text-xs text-slate-500">{tz.value.split("/").pop()?.replaceAll("_", " ")}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 py-2 animate-section-enter">
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

            <div className="relative animate-section-enter">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items..." className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 outline-none transition-colors focus:border-blue-500" />
            </div>

            <div className="flex flex-wrap gap-2 animate-section-enter">
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
              <div className="overflow-hidden rounded-2xl border border-slate-800 animate-section-enter">
                <img src={imgUrl(banners[0])} alt="" className="w-full object-cover" style={{ maxHeight: "400px" }} />
              </div>
            )}

            {bestSellers.length > 0 && !showAll && !selectedGame && !searchQuery && (
              <div className="animate-section-enter">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-amber-400">Best Sellers</h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBestSellerPage((page) => Math.max(0, page - 1))}
                      disabled={bestSellerPage === 0}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-200 hover:border-sky-500/40 hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBestSellerPage((page) => Math.min(Math.max(0, Math.ceil(bestSellers.length / BEST_SELLERS_PER_PAGE) - 1), page + 1))}
                      disabled={bestSellerPage >= Math.ceil(bestSellers.length / BEST_SELLERS_PER_PAGE) - 1}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-200 hover:border-sky-500/40 hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {bestSellers
                    .slice(bestSellerPage * BEST_SELLERS_PER_PAGE, (bestSellerPage + 1) * BEST_SELLERS_PER_PAGE)
                    .map((p, idx) => (
                      <div
                        key={p._id}
                        onClick={() => openProductModal(p)}
                        className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_20px_50px_rgba(14,165,233,0.14)] animate-card-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="aspect-square bg-slate-950 overflow-hidden">
                          {p.image ? (
                            <img src={imgUrl(p.image)} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-slate-700" /></div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-medium">{p.name}</p>
{p.desc && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.desc}</p>}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-emerald-300">${p.price.toFixed(2)}</span>
                            <span className="text-xs text-sky-400">View</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="animate-section-enter">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{selectedGame ? games.find((g) => g._id === selectedGame)?.name || "Items" : "All Items"}</h2>
                {!showAll && filtered.length > 8 && !searchQuery && (
                  <button onClick={() => setShowAll(true)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm transition-colors hover:bg-slate-700">View Full</button>
                )}
              </div>
                {showAll && (
                  <button onClick={() => setShowAll(false)} className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm transition-colors hover:bg-slate-600"><ArrowLeft className="h-4 w-4" /> Back</button>
                )}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {(showAll ? filtered : filtered.slice(0, 8)).map((p, idx) => (
                  <div key={p._id} onClick={() => openProductModal(p)} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-200 hover:border-blue-500/40 hover:-translate-y-1 animate-card-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="aspect-square bg-slate-950 overflow-hidden">
                      {p.image ? <img src={imgUrl(p.image)} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-slate-700" /></div>}
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





















