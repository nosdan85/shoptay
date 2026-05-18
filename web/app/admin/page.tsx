"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle, Loader2, Plus, Edit2, Trash2, X, Upload, Image as ImageIcon,
  CalendarDays, Package, RefreshCcw, Gamepad2, Layers, Sliders
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function imgUrl(src: string | undefined | null): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

interface Product { _id: string; name: string; price: number; bulkPrice?: number; image: string; desc?: string; category: string; gameId?: string }
interface Game { _id: string; name: string; slug: string; image?: string; active: boolean }
interface Slot { id: string; ownerStartText: string; ownerEndText: string; customerStartText: string; customerEndText: string; customerTimezone: string; startAt: string; endAt: string; note?: string }

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
  const [uploading, setUploading] = useState(false);
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

  /* --- banners & best sellers state --- */
  const [banners, setBanners] = useState<string[]>([]);
  const [bestSellers, setBestSellers] = useState<string[]>([]);
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isLoading && user?.isOwner && token) {
      void fetchAll();
    }
  }, [isLoading, user, token]);

  const fetchAll = async () => {
    void fetchProducts();
    void fetchGames();
    void fetchSlots();
    void fetchConfig();
  };

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

  /* --- CRUD PRODUCTS --- */
  const handleProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/shop/owner/product-images/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProductForm((prev) => ({ ...prev, image: data.filename }));
    } catch (err) { setError("Upload failed"); }
    setUploading(false);
  };

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
      // Always use Vietnamese timezone "Asia/Ho_Chi_Minh" when owner configures slots
      const res = await fetch("/api/shop/delivery-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerTimezone: "Asia/Ho_Chi_Minh", date: slotDate, ranges: cleanRanges }),
      });
      if (!res.ok) throw new Error("Failed");
      setRanges([{ startTime: "", endTime: "", note: "" }]);
      await fetchSlots();
    } catch { setError("Failed to create slots"); }
    setSubmitting(false);
  };

  const deleteSlot = async (id: string) => {
    if (!token || !confirm("Delete slot?")) return;
    try {
      await fetch(`/api/shop/delivery-slots/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      await fetchSlots();
    } catch { /* silent */ }
  };

  /* --- BANNERS & BEST SELLERS CONFIG --- */
  const handleBannerUpload = async () => {
    if (!newBannerFile || !token) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("banner", newBannerFile);
      const res = await fetch("/api/shop/owner/config/banners/upload", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body
      });
      if (!res.ok) throw new Error("Upload banner failed");
      setNewBannerFile(null);
      await fetchConfig();
    } catch { setError("Banner upload failed"); }
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

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>;

  if (!user?.isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="mt-2 text-slate-400 text-sm">Owner account login required via Discord.</p>
          <a href={getOAuthUrl()} className="mt-4 inline-block bg-[#5865F2] px-6 py-2.5 rounded-lg text-sm font-medium">Login with Discord</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">Vietnam Timezone Slots, Games, and Banners configured natively.</p>
          </div>
          <button onClick={() => void fetchAll()} className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm"><RefreshCcw className="h-4 w-4" /> Sync All</button>
        </div>

        <div className="mb-6 flex gap-2 border-b border-slate-800 pb-3">
          {(["products", "slots", "games", "config"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={"rounded-lg px-4 py-2 text-sm font-medium capitalize " + (tab === t ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-slate-300")}>
              {t}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {/* ─── TAB: PRODUCTS ─── */}
        {tab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border border-slate-800 bg-slate-900 p-4 rounded-xl">
              <div><h2 className="font-semibold text-lg">Product Items</h2><p className="text-xs text-slate-400">Add, edit, or delete store items directly.</p></div>
              <button onClick={() => { setProductForm({ name: "", price: "", bulkPrice: "", image: "", desc: "", category: "", gameId: "" }); setEditingProduct(null); setShowProductForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium"><Plus className="h-4 w-4" /> Add Item</button>
            </div>

            {showProductForm && (
              <form onSubmit={submitProduct} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="font-medium">{editingProduct ? "Edit Item" : "Create Item"}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <input required value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} placeholder="Item name" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  <input required value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  <input required type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  <input type="number" step="0.01" value={productForm.bulkPrice} onChange={(e) => setProductForm((p) => ({ ...p, bulkPrice: e.target.value }))} placeholder="Bulk price (optional)" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  <select value={productForm.gameId} onChange={(e) => setProductForm((p) => ({ ...p, gameId: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none">
                    <option value="">Select Game</option>
                    {games.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
                <textarea value={productForm.desc} onChange={(e) => setProductForm((p) => ({ ...p, desc: e.target.value }))} placeholder="Description details..." rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Product Image</label>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm">
                      <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload local"}
                      <input type="file" accept="image/*" onChange={handleProductImage} className="hidden" />
                    </label>
                    <input value={productForm.image} onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))} placeholder="Or paste image URL" className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 outline-none" />
                  </div>
                  {productForm.image && <img src={imgUrl(productForm.image)} alt="preview" className="h-20 w-20 rounded border border-slate-800 object-cover mt-2" />}
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium disabled:opacity-50">Save Item</button>
                  <button type="button" onClick={() => setShowProductForm(false)} className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="grid gap-3">
              {productsLoading && <p className="text-slate-500 text-sm">Loading items...</p>}
              {products.map((p) => (
                <div key={p._id} className="flex gap-4 items-center justify-between border border-slate-800 bg-slate-900 p-4 rounded-xl">
                  <div className="flex gap-3 items-center min-w-0">
                    <img src={imgUrl(p.image)} alt="" className="h-12 w-12 rounded-lg object-cover bg-slate-950" />
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.category} • ${p.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => void toggleBestSeller(p._id)} className={"rounded px-3 py-1.5 text-xs font-semibold " + (bestSellers.includes(p._id) ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400")}>Best Seller</button>
                    <button onClick={() => {
                      setProductForm({ name: p.name, price: String(p.price), bulkPrice: p.bulkPrice ? String(p.bulkPrice) : "", image: p.image, desc: p.desc || "", category: p.category, gameId: p.gameId || "" });
                      setEditingProduct(p._id); setShowProductForm(true);
                    }} className="p-2 text-blue-400 bg-slate-800/50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => void deleteProduct(p._id)} className="p-2 text-red-400 bg-slate-800/50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: SLOTS ─── */}
        {tab === "slots" && (
          <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit">
              <div><h2 className="font-semibold text-lg">Vietnam Time Slots</h2><p className="text-xs text-slate-400">All slots are saved relative to your Vietnam time (`Asia/Ho_Chi_Minh`). Conversion for customers is automatic.</p></div>
              <form onSubmit={createSlots} className="space-y-4">
                <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                {ranges.map((row, idx) => (
                  <div key={idx} className="p-3 border border-slate-800 bg-slate-950 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <input type="time" required value={row.startTime} onChange={(e) => setRanges((p) => p.map((r, i) => (i === idx ? { ...r, startTime: e.target.value } : r)))} className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none" />
                      <input type="time" required value={row.endTime} onChange={(e) => setRanges((p) => p.map((r, i) => (i === idx ? { ...r, endTime: e.target.value } : r)))} className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <input placeholder="Note (optional)" value={row.note} onChange={(e) => setRanges((p) => p.map((r, i) => (i === idx ? { ...r, note: e.target.value } : r)))} className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs outline-none" />
                      {ranges.length > 1 && <button type="button" onClick={() => setRanges((p) => p.filter((_, i) => i !== idx))} className="text-red-400 text-xs hover:underline">Delete</button>}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRanges((p) => [...p, { startTime: "", endTime: "", note: "" }])} className="rounded bg-slate-800 px-4 py-2 text-xs">Add Range</button>
                  <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold disabled:opacity-50">Create Slots</button>
                </div>
              </form>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
              <h2 className="font-semibold text-lg">Active Slots (Vietnam Time)</h2>
              {slotsLoading && <p className="text-slate-500 text-sm">Loading slots...</p>}
              {slots.map((s) => (
                <div key={s.id} className="flex items-center justify-between border border-slate-800 bg-slate-950 p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{s.ownerStartText} - {s.ownerEndText}</p>
                    <p className="text-xs text-slate-500">Local conversion: {s.customerStartText} ({s.customerTimezone})</p>
                  </div>
                  <button onClick={() => void deleteSlot(s.id)} className="p-2 text-red-400 bg-slate-900 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: GAMES ─── */}
        {tab === "games" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border border-slate-800 bg-slate-900 p-4 rounded-xl">
              <div><h2 className="font-semibold text-lg">Game Catalog</h2><p className="text-xs text-slate-400">Configure separate games with unique tags.</p></div>
              <button onClick={() => { setEditingGame(null); setGameForm({ name: "", slug: "", image: "", active: true }); setShowGameForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium"><Plus className="h-4 w-4" /> Add Game</button>
            </div>

            {showGameForm && (
              <form onSubmit={submitGame} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="font-medium">{editingGame ? "Edit Game" : "New Game"}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <input required value={gameForm.name} onChange={(e) => setGameForm((p) => ({ ...p, name: e.target.value }))} placeholder="Game name" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  <input required value={gameForm.slug} onChange={(e) => setGameForm((p) => ({ ...p, slug: e.target.value }))} placeholder="Game slug" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  <input value={gameForm.image} onChange={(e) => setGameForm((p) => ({ ...p, image: e.target.value }))} placeholder="Image URL (optional)" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium disabled:opacity-50">Save Game</button>
                  <button type="button" onClick={() => setShowGameForm(false)} className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="grid gap-3">
              {gamesLoading && <p className="text-slate-500 text-sm">Loading games...</p>}
              {games.map((g) => (
                <div key={g._id} className="flex items-center justify-between border border-slate-800 bg-slate-900 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    {g.image && <img src={imgUrl(g.image)} alt="" className="h-10 w-10 rounded object-cover" />}
                    <p className="font-medium text-sm">{g.name} <span className="text-xs text-slate-500">({g.slug})</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setGameForm({ name: g.name, slug: g.slug, image: g.image || "", active: g.active }); setEditingGame(g._id); setShowGameForm(true); }} className="p-2 text-blue-400 bg-slate-800/50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => void deleteGame(g._id)} className="p-2 text-red-400 bg-slate-800/50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: CONFIG (BANNERS) ─── */}
        {tab === "config" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-6">
            <div><h2 className="font-semibold text-lg">Shop Banners</h2><p className="text-xs text-slate-400">Configure continuous scrolling showcase banners on the main shop layout.</p></div>
            <div className="flex items-center gap-3 flex-wrap">
              <input type="file" accept="image/*" onChange={(e) => setNewBannerFile(e.target.files?.[0] || null)} className="text-sm border border-slate-700 rounded p-2 bg-slate-950" />
              <button onClick={() => void handleBannerUpload()} disabled={submitting || !newBannerFile} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Upload Banner</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {banners.map((b, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-lg border border-slate-800">
                  <img src={imgUrl(b)} alt="" className="h-32 w-full object-cover" />
                  <button onClick={() => void deleteBanner(b)} className="absolute top-2 right-2 bg-red-600 text-white rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


