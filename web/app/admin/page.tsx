"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle, Loader2, Plus, Edit2, Trash2, RefreshCcw
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function imgUrl(src: string | undefined | null): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

function toVietnamDateTimeParts(iso: string): { date: string; time: string } {
  const shifted = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
  const normalized = shifted.toISOString();
  return {
    date: normalized.slice(0, 10),
    time: normalized.slice(11, 16),
  };
}

function toVietnamIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

interface Product { _id: string; name: string; price: number; bulkPrice?: number; image: string; desc?: string; category: string; gameId?: string }
interface Game { _id: string; name: string; slug: string; image?: string; active: boolean }
interface Slot { _id: string; ownerTimezone: string; startAt: string; endAt: string; active: boolean; note?: string }

export default function AdminPage() {
  const { user, token, isLoading, getOAuthUrl } = useAuth();
  const [tab, setTab] = useState<"products" | "slots" | "games" | "config">("products");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* --- products state --- */
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", bulkPrice: "", image: "", desc: "", category: "", gameId: "" });

  /* --- games state --- */
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [gameForm, setGameForm] = useState({ name: "", slug: "", image: "", active: true });

  /* --- slots state --- */
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [ranges, setRanges] = useState([{ startTime: "", endTime: "", note: "" }]);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [slotEditForm, setSlotEditForm] = useState({ date: "", startTime: "", endTime: "", note: "", active: true });
  const [slotFilter, setSlotFilter] = useState<string>("");

  /* --- banners & best sellers state --- */
  const [banners, setBanners] = useState<string[]>([]);
  const [bestSellers, setBestSellers] = useState<string[]>([]);
  const [newBannerUrl, setNewBannerUrl] = useState("");

  async function fetchAll() {
    void fetchProducts();
    void fetchGames();
    void fetchSlots();
    void fetchConfig();
  }

  const fetchProducts = async () => {
    if (!token) return;
    setProductsLoading(true);
    try {
      const res = await fetch("/api/shop/owner/products", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch { /* silent */ }
    setProductsLoading(false);
  };

  const fetchGames = async () => {
    if (!token) return;
    setGamesLoading(true);
    try {
      const res = await fetch("/api/shop/owner/games", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    setGamesLoading(false);
  };

  const fetchSlots = async () => {
    if (!token) return;
    setSlotsLoading(true);
    try {
      const res = await fetch("/api/shop/delivery-slots?manage=1", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await res.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch { /* silent */ }
    setSlotsLoading(false);
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/shop/config", { cache: "no-store" });
      const data = await res.json();
      setBanners(Array.isArray(data.banners) ? data.banners : []);
      setBestSellers(Array.isArray(data.bestSellerIds) ? data.bestSellerIds : []);
    } catch { /* silent */ }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLoading && user?.isOwner && token) {
      void fetchAll();
    }
  }, [isLoading, user, token]);

  /* --- CRUD PRODUCTS --- */
  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true); setError(null);
    try {
      const payload = {
        name: productForm.name,
        price: Number(productForm.price),
        bulkPrice: productForm.bulkPrice ? Number(productForm.bulkPrice) : null,
        image: productForm.image,
        desc: productForm.desc,
        category: productForm.category,
        gameId: productForm.gameId || null,
      };
      const url = editingProduct ? `/api/shop/owner/products/${editingProduct}` : "/api/shop/owner/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: "", price: "", bulkPrice: "", image: "", desc: "", category: "", gameId: "" });
      await fetchProducts();
    } catch (err) { setError("Save failed"); }
    setSubmitting(false);
  };

  const deleteProduct = async (id: string) => {
    if (!token || !confirm("Delete item?")) return;
    try {
      await fetch(`/api/shop/owner/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      await fetchProducts();
    } catch { /* silent */ }
  };

  /* --- CRUD GAMES --- */
  const submitGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true); setError(null);
    try {
      const url = editingGame ? `/api/shop/owner/games/${editingGame}` : "/api/shop/owner/games";
      const method = editingGame ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(gameForm),
      });
      if (!res.ok) throw new Error("Save game failed");
      setShowGameForm(false);
      setEditingGame(null);
      setGameForm({ name: "", slug: "", image: "", active: true });
      await fetchGames();
    } catch { setError("Save game failed"); }
    setSubmitting(false);
  };

  const deleteGame = async (id: string) => {
    if (!token || !confirm("Delete game?")) return;
    try {
      await fetch(`/api/shop/owner/games/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      await fetchGames();
    } catch { /* silent */ }
  };

  /* --- BULK SLOTS (Vietnamese timezone setup) --- */
  const createSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !slotDate) return;
    const cleanRanges = ranges.filter((r) => r.startTime && r.endTime);
    if (cleanRanges.length === 0) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/shop/delivery-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerTimezone: "Asia/Ho_Chi_Minh", date: slotDate, ranges: cleanRanges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create slots");
      if (!Array.isArray(data?.slots) || data.slots.length === 0) {
        throw new Error("No valid slots were created. Check start/end times.");
      }
      setRanges([{ startTime: "", endTime: "", note: "" }]);
      setSlotDate("");
      await fetchSlots();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create slots"); }
    setSubmitting(false);
  };

  const formatSlotRange = useMemo(
    () => (slot: Slot) => {
      try {
        const start = new Date(slot.startAt);
        const end = new Date(slot.endAt);
        const dateText = new Intl.DateTimeFormat("en-US", {
          timeZone: slot.ownerTimezone,
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(start);
        const startText = new Intl.DateTimeFormat("en-US", {
          timeZone: slot.ownerTimezone,
          hour: "numeric",
          minute: "2-digit",
        }).format(start);
        const endText = new Intl.DateTimeFormat("en-US", {
          timeZone: slot.ownerTimezone,
          hour: "numeric",
          minute: "2-digit",
        }).format(end);
        return `${dateText} • ${startText} - ${endText} (Vietnam)`;
      } catch {
        return `${slot.startAt} - ${slot.endAt}`;
      }
    },
    []
  );

  const filteredSlots = useMemo(() => {
    if (!slotFilter) return slots;
    return slots.filter((s) => {
      const slotDateValue = new Date(s.startAt).toISOString().slice(0, 7);
      return slotDateValue === slotFilter;
    });
  }, [slots, slotFilter]);

  const toggleSlot = async (id: string, active: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/shop/delivery-slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update slot");
      await fetchSlots();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update slot"); }
  };

  const deleteSlot = async (id: string) => {
    if (!token || !confirm("Delete slot?")) return;
    try {
      const res = await fetch(`/api/shop/delivery-slots/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete slot");
      await fetchSlots();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete slot"); }
  };

  const startEditSlot = (slot: Slot) => {
    const start = toVietnamDateTimeParts(slot.startAt);
    const end = toVietnamDateTimeParts(slot.endAt);
    setEditingSlot(slot._id);
    setSlotEditForm({
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      note: slot.note || "",
      active: slot.active,
    });
  };

  const saveSlotEdit = async () => {
    if (!token || !editingSlot || !slotEditForm.date || !slotEditForm.startTime || !slotEditForm.endTime) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/shop/delivery-slots/${editingSlot}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          startAt: toVietnamIso(slotEditForm.date, slotEditForm.startTime),
          endAt: toVietnamIso(slotEditForm.date, slotEditForm.endTime),
          note: slotEditForm.note,
          active: slotEditForm.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save slot");
      setEditingSlot(null);
      await fetchSlots();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save slot"); }
    setSubmitting(false);
  };

  /* --- BANNERS & BEST SELLERS CONFIG --- */
  const handleBannerSave = async () => {
    if (!newBannerUrl.trim() || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/owner/config/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bannerUrl: newBannerUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save banner failed");
      setNewBannerUrl("");
      await fetchConfig();
    } catch (err) { setError(err instanceof Error ? err.message : "Save banner failed"); }
    setSubmitting(false);
  };

  const deleteBanner = async (bannerUrl: string) => {
    if (!token || !confirm("Delete banner?")) return;
    try {
      await fetch("/api/shop/owner/config/banners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bannerUrl })
      });
      await fetchConfig();
    } catch { /* silent */ }
  };

  const toggleBestSeller = async (productId: string) => {
    if (!token) return;
    const isBs = bestSellers.includes(productId);
    const updated = isBs ? bestSellers.filter((id) => id !== productId) : [...bestSellers, productId];
    try {
      await fetch("/api/shop/owner/config/best-sellers", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bestSellerIds: updated }),
      });
      setBestSellers(updated);
    } catch { /* silent */ }
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#2F9BE6]" /></div>;

  if (!user?.isOwner) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-[18px] border border-red-500/20 bg-[#111111] p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#FF4D4F]" />
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="mt-2 text-[#B5B5B5]/80 text-sm">Owner account login required via Discord.</p>
          <a href={getOAuthUrl()} className="mt-4 inline-block bg-[#5865F2] px-6 py-2.5 rounded-[14px] text-sm font-medium">Login with Discord</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-12">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-[#B5B5B5]/80 text-sm">Vietnam Timezone Slots, Games, and Banners configured natively.</p>
          </div>
          <div className="flex gap-3">
            <a href="/shop" className="flex items-center gap-2 rounded-[14px] bg-[#111111] border border-[#1E1E1E] px-4 py-2 text-sm text-[#B5B5B5] hover:text-white hover:border-slate-600 transition-all">← Back to Shop</a>
            <button onClick={() => void fetchAll()} className="flex items-center gap-2 rounded-[14px] bg-[#111111] border border-[#1E1E1E] px-4 py-2 text-sm"><RefreshCcw className="h-4 w-4" /> Sync All</button>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-[#1E1E1E] pb-3">
          {(["products", "slots", "games", "config"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={"rounded-[14px] px-4 py-2 text-sm font-medium capitalize " + (tab === t ? "bg-[#2F9BE6] text-white" : "bg-[#111111] text-[#B5B5B5]/80 hover:text-[#B5B5B5]")}>
              {t}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-[16px] border border-red-500/20 bg-[#FF4D4F]/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {/* ─── TAB: PRODUCTS ─── */}
        {tab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border border-[#1E1E1E] bg-[#111111] p-4 rounded-[16px]">
              <div><h2 className="font-semibold text-lg">Product Items</h2><p className="text-xs text-[#B5B5B5]/80">Add, edit, or delete store items directly.</p></div>
              <button onClick={() => { setProductForm({ name: "", price: "", bulkPrice: "", image: "", desc: "", category: "", gameId: "" }); setEditingProduct(null); setShowProductForm(true); }} className="flex items-center gap-2 rounded-[14px] bg-[#2F9BE6] px-4 py-2 text-sm font-medium"><Plus className="h-4 w-4" /> Add Item</button>
            </div>

            {showProductForm && (
              <form onSubmit={submitProduct} className="rounded-[16px] border border-[#1E1E1E] bg-[#111111] p-5 space-y-4">
                <h3 className="font-medium">{editingProduct ? "Edit Item" : "Create Item"}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <input required value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} placeholder="Item name" className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                  <input required value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                  <input required type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                  <input type="number" step="0.01" value={productForm.bulkPrice} onChange={(e) => setProductForm((p) => ({ ...p, bulkPrice: e.target.value }))} placeholder="Bulk price (optional)" className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                  <select value={productForm.gameId} onChange={(e) => setProductForm((p) => ({ ...p, gameId: e.target.value }))} className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none">
                    <option value="">Select Game</option>
                    {games.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
                <textarea value={productForm.desc} onChange={(e) => setProductForm((p) => ({ ...p, desc: e.target.value }))} placeholder="Description details..." rows={3} className="w-full rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                <div className="space-y-2">
                  <label className="text-xs text-[#B5B5B5]/80">Product Image URL</label>
                  <input value={productForm.image} onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))} placeholder="Paste image URL" className="w-full rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-2 outline-none" />
                  {productForm.image && <img src={imgUrl(productForm.image)} alt="preview" className="mt-2 h-20 w-20 rounded border border-[#1E1E1E] object-cover" />}
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="rounded-[14px] bg-[#2F9BE6] px-5 py-2.5 text-sm font-medium disabled:opacity-50">Save Item</button>
                  <button type="button" onClick={() => setShowProductForm(false)} className="rounded-[14px] bg-slate-800 px-5 py-2.5 text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="grid gap-3">
              {productsLoading && <p className="text-[#B5B5B5]/60 text-sm">Loading items...</p>}
              {products.map((p) => (
                <div key={p._id} className="flex gap-4 items-center justify-between border border-[#1E1E1E] bg-[#111111] p-4 rounded-[16px]">
                  <div className="flex gap-3 items-center min-w-0">
                    <img src={imgUrl(p.image)} alt="" className="h-12 w-12 rounded-[14px] object-cover bg-[#050505]" />
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{p.name}</p>
                      <p className="text-xs text-[#B5B5B5]/80">{p.category} • ${p.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => void toggleBestSeller(p._id)} className={"rounded px-3 py-1.5 text-xs font-semibold " + (bestSellers.includes(p._id) ? "bg-[#2F9BE6] text-white" : "bg-slate-800 text-[#B5B5B5]/80")}>Best Seller</button>
                    <button onClick={() => {
                      setProductForm({ name: p.name, price: String(p.price), bulkPrice: p.bulkPrice ? String(p.bulkPrice) : "", image: p.image, desc: p.desc || "", category: p.category, gameId: p.gameId || "" });
                      setEditingProduct(p._id); setShowProductForm(true);
                    }} className="p-2 text-[#2F9BE6] bg-[#161616]/50 rounded-[14px]"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => void deleteProduct(p._id)} className="p-2 text-[#FF4D4F] bg-[#161616]/50 rounded-[14px]"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: SLOTS ─── */}
        {tab === "slots" && (
          <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            <div className="rounded-[16px] border border-[#1E1E1E] bg-[#111111] p-5 space-y-4 h-fit">
              <div><h2 className="font-semibold text-lg">Vietnam Time Slots</h2><p className="text-xs text-[#B5B5B5]/80">All slots are saved relative to your Vietnam time (`Asia/Ho_Chi_Minh`). Conversion for customers is automatic.</p></div>
              <form onSubmit={createSlots} className="space-y-4">
                <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="w-full rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                {ranges.map((row, idx) => (
                  <div key={idx} className="p-3 border border-[#1E1E1E] bg-[#050505] rounded-[14px] space-y-2">
                    <div className="flex gap-2">
                      <input type="time" required value={row.startTime} onChange={(e) => setRanges((p) => p.map((r, i) => (i === idx ? { ...r, startTime: e.target.value } : r)))} className="flex-1 rounded border border-[#1E1E1E] bg-[#111111] px-2 py-1 text-sm outline-none" />
                      <input type="time" required value={row.endTime} onChange={(e) => setRanges((p) => p.map((r, i) => (i === idx ? { ...r, endTime: e.target.value } : r)))} className="flex-1 rounded border border-[#1E1E1E] bg-[#111111] px-2 py-1 text-sm outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <input placeholder="Note (optional)" value={row.note} onChange={(e) => setRanges((p) => p.map((r, i) => (i === idx ? { ...r, note: e.target.value } : r)))} className="flex-1 rounded border border-[#1E1E1E] bg-[#111111] px-2 py-1 text-xs outline-none" />
                      {ranges.length > 1 && <button type="button" onClick={() => setRanges((p) => p.filter((_, i) => i !== idx))} className="text-[#FF4D4F] text-xs hover:underline">Delete</button>}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRanges((p) => [...p, { startTime: "", endTime: "", note: "" }])} className="rounded bg-slate-800 px-4 py-2 text-xs">Add Range</button>
                  <button type="submit" disabled={submitting} className="rounded bg-[#2F9BE6] px-4 py-2 text-xs font-semibold disabled:opacity-50">Create Slots</button>
                </div>
              </form>
            </div>
            <div className="rounded-[16px] border border-[#1E1E1E] bg-[#111111] p-5 space-y-3">
              <h2 className="font-semibold text-lg">Active Slots (Vietnam Time)</h2>
              <div className="mb-4 flex items-center gap-3">
                <label className="text-sm text-[#B5B5B5]/80" htmlFor="slot-filter">Filter by month:</label>
                <input
                  id="slot-filter"
                  type="month"
                  value={slotFilter}
                  onChange={(e) => setSlotFilter(e.target.value)}
                  className="rounded border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-sm outline-none"
                />
                {slotFilter && (
                  <button type="button" onClick={() => setSlotFilter("")} className="text-xs text-[#B5B5B5]/60 hover:text-white">
                    Clear filter
                  </button>
                )}
              </div>
              {slotsLoading && <p className="text-[#B5B5B5]/60 text-sm">Loading slots...</p>}
              {filteredSlots.map((s) => (
                <div key={s._id} className={"border border-[#1E1E1E] bg-[#050505] p-4 rounded-[14px] transition-all " + (s.active ? "" : "opacity-60")}>
                  {editingSlot === s._id ? (
                    <div className="space-y-3 animate-fade-in">
                      <div className="grid gap-2 md:grid-cols-3">
                        <input type="date" value={slotEditForm.date} onChange={(e) => setSlotEditForm((p) => ({ ...p, date: e.target.value }))} className="rounded border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-sm outline-none" />
                        <input type="time" value={slotEditForm.startTime} onChange={(e) => setSlotEditForm((p) => ({ ...p, startTime: e.target.value }))} className="rounded border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-sm outline-none" />
                        <input type="time" value={slotEditForm.endTime} onChange={(e) => setSlotEditForm((p) => ({ ...p, endTime: e.target.value }))} className="rounded border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-sm outline-none" />
                      </div>
                      <input placeholder="Note (optional)" value={slotEditForm.note} onChange={(e) => setSlotEditForm((p) => ({ ...p, note: e.target.value }))} className="w-full rounded border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-sm outline-none" />
                      <label className="flex items-center gap-2 text-sm text-[#B5B5B5]">
                        <input type="checkbox" checked={slotEditForm.active} onChange={(e) => setSlotEditForm((p) => ({ ...p, active: e.target.checked }))} />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void saveSlotEdit()} disabled={submitting} className="rounded bg-[#2F9BE6] px-4 py-2 text-xs font-semibold disabled:opacity-50">Save</button>
                        <button type="button" onClick={() => setEditingSlot(null)} className="rounded bg-slate-800 px-4 py-2 text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className={s.active ? "" : "line-through"}>
                        <p className="font-medium text-sm">{formatSlotRange(s)}</p>
                        {s.note && <p className="text-xs text-[#B5B5B5]/80 mt-1">{s.note}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditSlot(s)} className="p-2 text-[#2F9BE6] bg-[#111111] rounded" title="Edit"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => void toggleSlot(s._id, !s.active)} className={"p-2 rounded " + (s.active ? "text-[#2F9BE6] bg-[#111111]" : "text-[#3DDC84] bg-[#111111]")} title={s.active ? "Deactivate" : "Activate"}><RefreshCcw className="h-4 w-4" /></button>
                        <button onClick={() => void deleteSlot(s._id)} className="p-2 text-[#FF4D4F] bg-[#111111] rounded" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: GAMES ─── */}
        {tab === "games" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border border-[#1E1E1E] bg-[#111111] p-4 rounded-[16px]">
              <div><h2 className="font-semibold text-lg">Game Catalog</h2><p className="text-xs text-[#B5B5B5]/80">Configure separate games with unique tags.</p></div>
              <button onClick={() => { setEditingGame(null); setGameForm({ name: "", slug: "", image: "", active: true }); setShowGameForm(true); }} className="flex items-center gap-2 rounded-[14px] bg-[#2F9BE6] px-4 py-2 text-sm font-medium"><Plus className="h-4 w-4" /> Add Game</button>
            </div>

            {showGameForm && (
              <form onSubmit={submitGame} className="rounded-[16px] border border-[#1E1E1E] bg-[#111111] p-5 space-y-4">
                <h3 className="font-medium">{editingGame ? "Edit Game" : "New Game"}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <input required value={gameForm.name} onChange={(e) => setGameForm((p) => ({ ...p, name: e.target.value }))} placeholder="Game name" className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                  <input required value={gameForm.slug} onChange={(e) => setGameForm((p) => ({ ...p, slug: e.target.value }))} placeholder="Game slug" className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                  <input value={gameForm.image} onChange={(e) => setGameForm((p) => ({ ...p, image: e.target.value }))} placeholder="Image URL (optional)" className="rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="rounded-[14px] bg-[#2F9BE6] px-5 py-2.5 text-sm font-medium disabled:opacity-50">Save Game</button>
                  <button type="button" onClick={() => setShowGameForm(false)} className="rounded-[14px] bg-slate-800 px-5 py-2.5 text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="grid gap-3">
              {gamesLoading && <p className="text-[#B5B5B5]/60 text-sm">Loading games...</p>}
              {games.map((g) => (
                <div key={g._id} className="flex items-center justify-between border border-[#1E1E1E] bg-[#111111] p-4 rounded-[16px]">
                  <div className="flex items-center gap-3">
                    {g.image && <img src={imgUrl(g.image)} alt="" className="h-10 w-10 rounded object-cover" />}
                    <p className="font-medium text-sm">{g.name} <span className="text-xs text-[#B5B5B5]/60">({g.slug})</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setGameForm({ name: g.name, slug: g.slug, image: g.image || "", active: g.active }); setEditingGame(g._id); setShowGameForm(true); }} className="p-2 text-[#2F9BE6] bg-[#161616]/50 rounded-[14px]"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => void deleteGame(g._id)} className="p-2 text-[#FF4D4F] bg-[#161616]/50 rounded-[14px]"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: CONFIG (BANNERS) ─── */}
        {tab === "config" && (
          <div className="rounded-[16px] border border-[#1E1E1E] bg-[#111111] p-5 space-y-6">
            <div><h2 className="font-semibold text-lg">Shop Banner</h2><p className="text-xs text-[#B5B5B5]/80">Only one banner is active. Paste a Cloudinary image URL to replace the current banner.</p></div>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                placeholder="Paste banner image URL"
                className="min-w-[280px] flex-1 rounded border border-[#1E1E1E] bg-[#050505] p-2 text-sm outline-none"
              />
              <button onClick={() => void handleBannerSave()} disabled={submitting || !newBannerUrl.trim()} className="rounded bg-[#2F9BE6] px-4 py-2 text-sm font-semibold disabled:opacity-50">Save / Replace Banner</button>
            </div>
            {banners[0] ? (
              <div className="relative group overflow-hidden rounded-[14px] border border-[#1E1E1E]">
                <img src={imgUrl(banners[0])} alt="" className="w-full object-cover" style={{ maxHeight: "360px" }} />
                <button onClick={() => void deleteBanner(banners[0])} className="absolute top-2 right-2 bg-red-600 text-white rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#1E1E1E] bg-[#050505] p-8 text-center text-sm text-[#B5B5B5]/60">No banner uploaded.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}




