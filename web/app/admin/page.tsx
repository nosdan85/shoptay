"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Loader2, Plus, Edit2, Trash2, X, Upload, Image as ImageIcon, CalendarDays, Package, RefreshCcw } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  price: number;
  bulkPrice?: number;
  image: string;
  desc?: string;
  category: string;
}

interface ProductFormData {
  name: string;
  price: string;
  bulkPrice: string;
  image: string;
  desc: string;
  category: string;
}

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

const OWNER_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function AdminPage() {
  const { user, token, isLoading, getOAuthUrl } = useAuth();
  const [tab, setTab] = useState<"products" | "slots">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: "",
    price: "",
    bulkPrice: "",
    image: "",
    desc: "",
    category: "",
  });
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [slotTimezone, setSlotTimezone] = useState("America/New_York");
  const [slotDate, setSlotDate] = useState("");
  const [ranges, setRanges] = useState([{ startTime: "", endTime: "", note: "" }]);
  const [creatingSlots, setCreatingSlots] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.isOwner && token) {
      void fetchProducts();
      void fetchSlots();
    }
  }, [isLoading, user?.isOwner, token]);

  const fetchProducts = async () => {
    if (!token) return;
    setProductsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/owner/products", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch products");
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading products");
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!token) return;
    setSlotsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/delivery-slots?manage=1", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch slots");
      setSlots(Array.isArray(data?.slots) ? data.slots : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [slots]
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/shop/owner/product-images/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setProductForm((prev) => ({ ...prev, image: data.filename }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!productForm.name || !productForm.price || !productForm.category || !productForm.image) {
      setError("Missing required product fields");
      return;
    }
    setProductsLoading(true);
    setError(null);
    try {
      const payload = {
        name: productForm.name.trim(),
        price: Number(productForm.price),
        bulkPrice: productForm.bulkPrice ? Number(productForm.bulkPrice) : null,
        image: productForm.image.trim(),
        desc: productForm.desc.trim(),
        category: productForm.category.trim(),
      };
      const url = editingId ? `/api/shop/owner/products/${editingId}` : "/api/shop/owner/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      resetProductForm();
      setShowProductForm(false);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setProductsLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    if (!token || !confirm("Delete this item?")) return;
    setProductsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/owner/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setProductsLoading(false);
    }
  };

  const beginEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      price: String(product.price),
      bulkPrice: product.bulkPrice ? String(product.bulkPrice) : "",
      image: product.image,
      desc: product.desc || "",
      category: product.category,
    });
    setEditingId(product._id);
    setShowProductForm(true);
    setTab("products");
  };

  const resetProductForm = () => {
    setProductForm({ name: "", price: "", bulkPrice: "", image: "", desc: "", category: "" });
    setEditingId(null);
  };

  const addRangeRow = () => setRanges((prev) => [...prev, { startTime: "", endTime: "", note: "" }]);
  const removeRangeRow = (index: number) => setRanges((prev) => prev.filter((_, i) => i !== index));
  const updateRangeRow = (index: number, field: "startTime" | "endTime" | "note", value: string) => {
    setRanges((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const createBulkSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const cleanRanges = ranges
      .map((row) => ({ startTime: row.startTime, endTime: row.endTime, note: row.note.trim() }))
      .filter((row) => row.startTime && row.endTime);
    if (!slotDate || cleanRanges.length === 0) {
      setError("Pick a date and at least one valid time range");
      return;
    }
    setCreatingSlots(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/delivery-slots?manage=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerTimezone: slotTimezone,
          date: slotDate,
          ranges: cleanRanges,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create slots");
      setRanges([{ startTime: "", endTime: "", note: "" }]);
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create slots");
    } finally {
      setCreatingSlots(false);
    }
  };

  const deleteSlot = async (id: string) => {
    if (!token || !confirm("Delete this slot?")) return;
    setSlotsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/delivery-slots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete slot failed");
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete slot failed");
    } finally {
      setSlotsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-24">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h1 className="text-2xl font-semibold">Admin login required</h1>
            <p className="mt-3 text-slate-400">Login with Discord owner account.</p>
            <a href={getOAuthUrl()} className="mt-6 inline-flex rounded-lg bg-[#5865F2] px-5 py-3 font-medium">Login with Discord</a>
          </div>
        </div>
      </div>
    );
  }

  if (!user.isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-24">
          <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="mt-3 text-slate-400">Owner role required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Products, delivery slots, real store data.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void fetchProducts()} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm"><RefreshCcw className="h-4 w-4" />Refresh products</button>
            <button onClick={() => void fetchSlots()} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm"><RefreshCcw className="h-4 w-4" />Refresh slots</button>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button onClick={() => setTab("products")} className={`rounded-lg px-4 py-2 text-sm ${tab === "products" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300"}`}>Products</button>
          <button onClick={() => setTab("slots")} className={`rounded-lg px-4 py-2 text-sm ${tab === "slots" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300"}`}>Delivery Slots</button>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        {tab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div>
                <h2 className="text-xl font-semibold">Items</h2>
                <p className="text-sm text-slate-400">Add, edit, delete items directly on web.</p>
              </div>
              <button
                onClick={() => {
                  resetProductForm();
                  setShowProductForm((prev) => !prev);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add item
              </button>
            </div>

            {showProductForm && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{editingId ? "Edit item" : "New item"}</h3>
                  <button onClick={() => { setShowProductForm(false); resetProductForm(); }} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={submitProduct} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} placeholder="Item name" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                    <input value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                    <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                    <input type="number" step="0.01" value={productForm.bulkPrice} onChange={(e) => setProductForm((p) => ({ ...p, bulkPrice: e.target.value }))} placeholder="Bulk price" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  </div>
                  <textarea value={productForm.desc} onChange={(e) => setProductForm((p) => ({ ...p, desc: e.target.value }))} placeholder="Details" rows={4} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                  <div className="space-y-3">
                    <label className="text-sm text-slate-300">Image</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload image"}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <input value={productForm.image} onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))} placeholder="Or paste image URL" className="min-w-[280px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                    </div>
                    {productForm.image ? (
                      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <img src={productForm.image} alt="Preview" className="h-40 w-full rounded-lg object-contain bg-slate-900" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={productsLoading} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium disabled:opacity-50">{editingId ? "Save changes" : "Create item"}</button>
                    <button type="button" onClick={() => { setShowProductForm(false); resetProductForm(); }} className="rounded-lg bg-slate-800 px-5 py-3 text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-3">
              {productsLoading && products.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Loading items...</div> : null}
              {!productsLoading && products.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">No items yet.</div> : null}
              {products.map((product) => (
                <div key={product._id} className="grid grid-cols-[96px_1fr_auto] gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                    {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-slate-600" />}
                  </div>
                  <div>
                    <div className="font-medium text-white">{product.name}</div>
                    <div className="mt-1 text-sm text-slate-400">{product.category}</div>
                    <div className="mt-2 text-sm text-slate-300">{product.desc || "No details"}</div>
                    <div className="mt-3 flex gap-3 text-sm">
                      <span className="font-medium text-emerald-300">${Number(product.price || 0).toFixed(2)}</span>
                      {product.bulkPrice ? <span className="text-sky-300">Bulk ${Number(product.bulkPrice).toFixed(2)}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <button onClick={() => beginEditProduct(product)} className="rounded-lg bg-blue-500/15 p-2 text-blue-300"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => void removeProduct(product._id)} className="rounded-lg bg-red-500/15 p-2 text-red-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "slots" && (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Create Slots</h2>
                <p className="text-sm text-slate-400">Multiple time ranges in one day. Customers see converted local time.</p>
              </div>
              <form onSubmit={createBulkSlots} className="space-y-4">
                <select value={slotTimezone} onChange={(e) => setSlotTimezone(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none">
                  {OWNER_TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
                <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
                <div className="space-y-3">
                  {ranges.map((row, index) => (
                    <div key={index} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input type="time" value={row.startTime} onChange={(e) => updateRangeRow(index, "startTime", e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none" />
                        <input type="time" value={row.endTime} onChange={(e) => updateRangeRow(index, "endTime", e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <input value={row.note} onChange={(e) => updateRangeRow(index, "note", e.target.value)} placeholder="Optional note" className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none" />
                        {ranges.length > 1 ? <button type="button" onClick={() => removeRangeRow(index)} className="rounded-lg bg-red-500/15 px-3 py-2 text-red-300">Remove</button> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={addRangeRow} className="rounded-lg bg-slate-800 px-4 py-3 text-sm">Add range</button>
                  <button type="submit" disabled={creatingSlots} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium disabled:opacity-50">{creatingSlots ? "Creating..." : "Create slots"}</button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Existing Slots</h2>
                  <p className="text-sm text-slate-400">Owner-side base time shown here.</p>
                </div>
                <CalendarDays className="h-5 w-5 text-slate-500" />
              </div>
              <div className="space-y-3">
                {slotsLoading && sortedSlots.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">Loading slots...</div> : null}
                {!slotsLoading && sortedSlots.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">No slots yet.</div> : null}
                {sortedSlots.map((slot) => (
                  <div key={slot.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div>
                      <div className="font-medium text-white">{slot.ownerStartText} - {slot.ownerEndText}</div>
                      <div className="mt-1 text-xs text-slate-500">Timezone: {slot.ownerTimezone}</div>
                      {slot.note ? <div className="mt-2 text-sm text-slate-300">{slot.note}</div> : null}
                    </div>
                    <button onClick={() => void deleteSlot(slot.id)} className="rounded-lg bg-red-500/15 p-2 text-red-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

