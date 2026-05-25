"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
  Copy,
  CreditCard,
  QrCode,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const VISITOR_NOTICE_DISMISSED_KEY = "visitorNoticeDismissed";

function imgUrl(src: string | undefined | null): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

function maskName(name: string): string {
  if (!name || name.length <= 2) return "***";
  return name[0] + "*".repeat(Math.min(name.length - 1, 4));
}

function formatQtyLabel(quantity: number | undefined | null): string {
  return `(x${Math.max(1, Number(quantity) || 1)})`;
}

function formatPurchasedQtyLabel(item: { packQuantity?: number; quantity?: number }): string {
  const packQty = Math.max(1, Number(item.packQuantity) || 1);
  const orderQty = Math.max(1, Number(item.quantity) || 1);
  return `(x${packQty * orderQty})`;
}

function formatProductNameWithQty(name: string, quantity: number | undefined | null): string {
  return `${name} ${formatQtyLabel(quantity)}`;
}

function formatPurchasedProductName(item: { name: string; packQuantity?: number; quantity?: number }): string {
  return `${item.name} ${formatPurchasedQtyLabel(item)}`;
}

function formatSlotNote(note?: string): string {
  const map: Record<string, string> = {
    "Ca sáng": "Morning shift",
    "Ca trưa": "Midday shift",
    "Ca chiều": "Afternoon shift",
    "Ca tối": "Evening shift",
  };
  return map[String(note || "").trim()] || String(note || "");
}

function DiscordIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.8a13.7 13.7 0 0 0-.64 1.32 18.4 18.4 0 0 0-5.44 0 12.9 12.9 0 0 0-.65-1.32 19.7 19.7 0 0 0-4.95 1.57C.55 9.03-.32 13.58.1 18.07a19.9 19.9 0 0 0 6.08 3.08 14.5 14.5 0 0 0 1.3-2.1 12.8 12.8 0 0 1-2.05-.98c.17-.13.34-.26.5-.4a14.1 14.1 0 0 0 12.14 0l.5.4c-.65.39-1.33.72-2.05.98.38.74.82 1.44 1.3 2.1a19.8 19.8 0 0 0 6.08-3.08c.5-5.2-.86-9.7-3.58-13.7ZM8.02 15.31c-1.18 0-2.15-1.08-2.15-2.41 0-1.34.95-2.42 2.15-2.42s2.17 1.1 2.15 2.42c0 1.33-.95 2.41-2.15 2.41Zm7.96 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.34.95-2.42 2.15-2.42s2.17 1.1 2.15 2.42c0 1.33-.95 2.41-2.15 2.41Z" />
    </svg>
  );
}

function RobloxIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.1 2 22 6.1 17.9 22 2 17.9 6.1 2h1Zm3.72 7.2-1.62 5.98 5.98 1.62 1.62-5.98-5.98-1.62Zm1.28 2.6 2.1.57-.57 2.1-2.1-.57.57-2.1Z" />
    </svg>
  );
}

interface Product { _id: string; name: string; category: string; price: number; bulkPrice?: number; packQuantity?: number; image?: string; desc?: string; gameId?: string }
interface CartItem extends Product { quantity: number }
interface Game { _id: string; name: string; slug: string; image?: string }
interface Slot {
  id: string;
  ownerStartText: string;
  ownerEndText: string;
  customerStartText: string;
  customerEndText: string;
  customerDateKey: string;
  customerDateLabel: string;
  customerTimeLabel: string;
  customerSegments?: SlotSegment[];
  startAt: string;
  endAt: string;
  note?: string;
}
interface SlotSegment {
  id: string;
  slotId: string;
  customerStartAt?: string;
  customerEndAt?: string;
  customerDateKey: string;
  customerDateLabel: string;
  customerTimeLabel: string;
}
interface Purchase { username: string; items: string; price?: number }
interface TicketResult { channelId: string; guildId?: string; url?: string }
interface CheckoutSummary {
  subtotalAmount: number;
  discountAmount: number;
  discountPercent: number;
  totalAmount: number;
  items: Array<{ product?: string; _id?: string; name: string; quantity: number; packQuantity?: number; price: number }>;
}

type Step = "shop" | "roblox" | "delivery" | "ticket";
type PriceSort = "none" | "low-high" | "high-low";
type PaymentGuide = "paypal_ff" | "ltc";

const BEST_SELLERS_PER_PAGE = 4;
const PENDING_CHECKOUT_KEY = "pendingCheckout";
const PAYPAL_EMAIL = "nguyenquanghuy111106@gmail.com";
const LTC_ADDRESS = "ltc1ququ7e6ryccpnu7jgy0l4vukgc3mventxyulyge";
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function addMonths(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function getDateKeyInTimezone(timezone: string, value = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {}
  return value.toISOString().slice(0, 10);
}

function buildCalendarDays(monthKey: string): Array<{ key: string; day: number; inMonth: boolean }> {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(year, month - 1, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    };
  });
}

const ProductCard = memo(function ProductCard({
  product,
  index,
  onOpen,
  variant = "default",
}: {
  product: Product;
  index: number;
  onOpen: (product: Product) => void;
  variant?: "default" | "bestSeller";
}) {
  const handleOpen = useCallback(() => onOpen(product), [onOpen, product]);

  return (
    <div
      onClick={handleOpen}
      className="group product-card cursor-pointer overflow-hidden rounded-[22px] border border-[#1E1E1E] bg-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-200 active:scale-[0.98] animate-card-in md:transition-transform md:duration-200 md:hover:scale-[1.03]"
      style={{ animationDelay: `${index * (variant === "bestSeller" ? 0.08 : 0.05)}s` }}
    >
      <div className="aspect-square bg-[#050505] overflow-hidden">
        {product.image ? (
          <img src={imgUrl(product.image)} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-[#B5B5B5]/50" /></div>
        )}
      </div>
      {variant === "bestSeller" ? (
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-semibold leading-5">{product.name}</p>
          <p className="text-xs text-[#2F9BE6] mt-0.5">{formatQtyLabel(product.packQuantity)}</p>
          {product.desc && <p className="text-xs text-[#B5B5B5] mt-1 line-clamp-2">{product.desc}</p>}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#3DDC84]">${product.price.toFixed(2)}</span>
            <span className="text-xs text-[#2F9BE6]">View</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5">{product.name}</h3>
          <p className="text-xs text-[#2F9BE6] mt-0.5">{formatQtyLabel(product.packQuantity)}</p>
          <p className="text-xs text-[#B5B5B5]/80">{product.category}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-[#3DDC84]">${product.price.toFixed(2)}</span>
            <span className="text-xs text-[#2F9BE6]">View</span>
          </div>
        </div>
      )}
    </div>
  );
});

function LogoLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-sm">
      <style>{`
        @keyframes barFill {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }
        @keyframes logoSync {
          0% { left: 0%; transform: translate(-50%, -50%) rotate(0deg); }
          50% { left: 100%; transform: translate(-50%, -50%) rotate(360deg); }
          100% { left: 0%; transform: translate(-50%, -50%) rotate(720deg); }
        }
      `}</style>

      <div className="relative mb-6 w-80 max-w-[80vw]">
        {/* Bar */}
        <div className="h-3 overflow-hidden rounded-full border border-[#2F9BE6]/30 bg-[#111111]">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 animate-[barFill_2.5s_ease-in-out_infinite]" />
        </div>

        {/* Rolling Logo */}
        <div className="pointer-events-none absolute top-1/2 h-10 w-10 animate-[logoSync_2.5s_ease-in-out_infinite]">
          <img src="/pictures/logo.png" alt="Loading" className="h-full w-full rounded-[10px] object-contain" />
        </div>
      </div>

      <p className="text-sm font-medium text-white">Loading NOS Market...</p>
    </div>
  );
}
export default function ShopPage() {
  const { user, token, isLoading: authLoading, getOAuthUrl } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [banners, setBanners] = useState<string[]>([]);
  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceSort, setPriceSort] = useState<PriceSort>("none");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [step, setStep] = useState<Step>("shop");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [robloxUsernameInput, setRobloxUsernameInput] = useState("");
  const [customerTz, setCustomerTz] = useState(detectUserTimezone());
  const [tzSearch, setTzSearch] = useState("");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotDate, setSelectedSlotDate] = useState("");
  const [deliveryMonth, setDeliveryMonth] = useState("");
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<TicketResult | null>(null);
  const [selectedPaymentGuide, setSelectedPaymentGuide] = useState<PaymentGuide>("paypal_ff");
  const [copiedPaymentValue, setCopiedPaymentValue] = useState<string | null>(null);
  const [showVisitorNotice, setShowVisitorNotice] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState<string | number>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [robloxSearchResult, setRobloxSearchResult] = useState<null | { userId: string; username: string; displayName: string; avatar: string }>(null);
  const [bestSellerPage, setBestSellerPage] = useState(0);
  const remoteCartHydratedRef = useRef(false);
  const skipNextRemoteCartSyncRef = useRef(false);
  const checkoutInFlightRef = useRef(false);
  const ticketInFlightRef = useRef(false);
  const lastActionRef = useRef(0);
  const searchDebounceRef = useRef<number | null>(null);
  const resumeHandledRef = useRef(false);

  const ACTION_COOLDOWN_MS = 450;
  const canAct = () => { if (submitting || Date.now() - lastActionRef.current < ACTION_COOLDOWN_MS) return false; lastActionRef.current = Date.now(); return true; };

  const saveCart = useCallback((newCart: CartItem[], options?: { skipRemoteSync?: boolean }) => {
    if (options?.skipRemoteSync) skipNextRemoteCartSyncRef.current = true;
    setCart(newCart);
  }, []);

  const syncCartToAccount = useCallback(async (nextCart: CartItem[]) => {
    if (!token) return;
    await fetch("/api/shop/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cartItems: nextCart.map((i) => ({ product: i._id, quantity: i.quantity })) }),
    });
  }, [token]);

  const fetchRemoteCart = useCallback(async (signal?: AbortSignal): Promise<CartItem[]> => {
    if (!token) return [];
    const res = await fetch("/api/shop/cart", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load cart");
    return Array.isArray(data?.items) ? (data.items as CartItem[]) : [];
  }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, gRes, cRes, rRes] = await Promise.all([
        fetch("/api/shop/products", { cache: "no-store" }),
        fetch("/api/shop/games?nocache=" + Date.now(), { cache: "no-store" }),
        fetch("/api/shop/config", { cache: "no-store" }),
        fetch("/api/shop/recent-purchases?limit=10", { cache: "no-store" }),
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(VISITOR_NOTICE_DISMISSED_KEY) === "1") return;
    void fetch("/api/shop/visitor-notice", { method: "POST", cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof window !== "undefined" && window.localStorage.getItem(VISITOR_NOTICE_DISMISSED_KEY) === "1") return;
        setShowVisitorNotice(Boolean(data?.show));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!token || !user?.discordId) {
      remoteCartHydratedRef.current = false;
      return;
    }
    if (typeof window !== "undefined" && window.sessionStorage.getItem(PENDING_CHECKOUT_KEY)) {
      remoteCartHydratedRef.current = true;
      return;
    }

    const controller = new AbortController();
    remoteCartHydratedRef.current = false;
    void (async () => {
      try {
        const remoteItems = await fetchRemoteCart(controller.signal);
        if (controller.signal.aborted) return;
        saveCart(remoteItems, { skipRemoteSync: true });
      } catch {
        if (controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) remoteCartHydratedRef.current = true;
      }
    })();

    return () => {
      controller.abort();
    };
  }, [fetchRemoteCart, saveCart, token, user?.discordId]);

  useEffect(() => {
    if (authLoading || token) return;
    queueMicrotask(() => { saveCart([], { skipRemoteSync: true }); remoteCartHydratedRef.current = false; });
  }, [authLoading, saveCart, token]);

  useEffect(() => {
    if (!token || !user?.discordId) return;

    const syncRemoteCart = () => {
      void fetchRemoteCart()
        .then((remoteItems) => saveCart(remoteItems, { skipRemoteSync: true }))
        .catch(() => {});
    };

    const syncVisibleRemoteCart = () => {
      if (document.visibilityState === "visible") syncRemoteCart();
    };

    window.addEventListener("focus", syncRemoteCart);
    const intervalId = window.setInterval(syncVisibleRemoteCart, 30000);

    return () => {
      window.removeEventListener("focus", syncRemoteCart);
      window.clearInterval(intervalId);
    };
  }, [fetchRemoteCart, saveCart, token, user?.discordId]);

  useEffect(() => {
    if (!token || !user?.discordId || !remoteCartHydratedRef.current) return;
    if (skipNextRemoteCartSyncRef.current) {
      skipNextRemoteCartSyncRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncCartToAccount(cart).catch(() => {});
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [cart, syncCartToAccount, token, user?.discordId]);

  useEffect(() => {
    if (resumeHandledRef.current || typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return;

    try {
      const pending = JSON.parse(raw) as { orderId?: string; cart?: CartItem[]; customerTz?: string; checkoutSummary?: CheckoutSummary };
      if (!pending?.orderId) return;
      resumeHandledRef.current = true;
      queueMicrotask(() => {
        setOrderId(String(pending.orderId));
        setStep("roblox");
        setCart(Array.isArray(pending.cart) ? pending.cart : []);
        setCheckoutSummary(pending.checkoutSummary || null);
        if (pending.customerTz) {
          setCustomerTz(String(pending.customerTz));
        }
      });
    } catch {
      window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  }, [token]);

  const activeSelectedGame = selectedGame && games.some((g) => g._id === selectedGame)
    ? selectedGame
    : null;

  const filtered = useMemo(() => {
    let list = products;
    if (activeSelectedGame) list = list.filter((p) => p.gameId === activeSelectedGame);
    if (searchQuery) list = list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (priceSort !== "none") {
      list = [...list].sort((a, b) => priceSort === "low-high" ? a.price - b.price : b.price - a.price);
    }
    return list;
  }, [activeSelectedGame, priceSort, products, searchQuery]);

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
    return detected ? [{ country: detected.country, flag: "TZ", zones: [detected] }, ...groups] : groups;
  }, [timezoneOptions]);

  const selectedTimezoneLabel = useMemo(() => {
    const found = ALL_TIMEZONES.find((tz) => tz.value === customerTz);
    return found ? `${found.country} - ${found.label}` : `Detected - ${customerTz}`;
  }, [customerTz]);

  const persistPendingCheckout = useCallback((nextOrderId: string, nextCart = cart, nextTz = customerTz, nextSummary = checkoutSummary) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({
      orderId: nextOrderId,
      cart: nextCart,
      customerTz: nextTz,
      checkoutSummary: nextSummary,
    }));
  }, [cart, checkoutSummary, customerTz]);

  const clearPendingCheckout = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  }, []);

  const dismissVisitorNotice = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VISITOR_NOTICE_DISMISSED_KEY, "1");
    }
    setShowVisitorNotice(false);
  }, []);

  const fetchSlotsForTimezone = useCallback(async (tzValue: string) => {
    const res = await fetch(`/api/shop/delivery-slots?timezone=${encodeURIComponent(tzValue)}`, { cache: "no-store" });
    const data = await res.json();
    const nextSlots = Array.isArray(data?.slots) ? data.slots : [];
    const todayKey = getDateKeyInTimezone(tzValue);
    setSlots(nextSlots);
    setPickedSlot(null);
    setSelectedSlotDate((current) => {
      if (current && nextSlots.some((slot: Slot) => slot.customerDateKey === current || slot.customerSegments?.some((segment) => segment.customerDateKey === current))) return current;
      const firstDate = String(nextSlots[0]?.customerSegments?.[0]?.customerDateKey || nextSlots[0]?.customerDateKey || todayKey);
      setDeliveryMonth(firstDate.slice(0, 7));
      return firstDate;
    });
    return nextSlots;
  }, []);

  const selectTimezone = (tzValue: string) => {
    setCustomerTz(tzValue);
    setTzSearch("");
    setExpandedCountry(null);
    void fetchSlotsForTimezone(tzValue).catch(() => {});
  };

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const slotSegments = useMemo(() => {
    return slots.flatMap((slot) => {
      const segments = Array.isArray(slot.customerSegments) && slot.customerSegments.length > 0
        ? slot.customerSegments
        : [{
            id: `${slot.id}:${slot.customerDateKey}:0`,
            slotId: slot.id,
            customerStartAt: slot.startAt,
            customerEndAt: slot.endAt,
            customerDateKey: slot.customerDateKey,
            customerDateLabel: slot.customerDateLabel,
            customerTimeLabel: slot.customerTimeLabel || `${slot.customerStartText} - ${slot.customerEndText}`,
          }];
      return segments.map((segment) => ({
        ...segment,
        note: slot.note,
      }));
    });
  }, [slots]);

  const slotDates = useMemo(() => {
    const seen = new Set<string>();
    return slotSegments.filter((segment) => {
      if (!segment.customerDateKey || seen.has(segment.customerDateKey)) return false;
      seen.add(segment.customerDateKey);
      return true;
    }).map((segment) => ({
      key: segment.customerDateKey,
      label: segment.customerDateLabel || segment.customerDateKey,
    }));
  }, [slotSegments]);
  const slotDateSet = useMemo(() => new Set(slotDates.map((date) => date.key)), [slotDates]);
  const fallbackDeliveryDate = useMemo(() => getDateKeyInTimezone(customerTz), [customerTz]);
  const deliveryMonthKey = deliveryMonth || selectedSlotDate.slice(0, 7) || fallbackDeliveryDate.slice(0, 7);
  const deliveryCalendarDays = useMemo(() => buildCalendarDays(deliveryMonthKey), [deliveryMonthKey]);
  const visibleSlotSegments = useMemo(
    () => slotSegments.filter((segment) => !selectedSlotDate || segment.customerDateKey === selectedSlotDate),
    [selectedSlotDate, slotSegments]
  );
  const checkoutItems = checkoutSummary?.items?.length ? checkoutSummary.items : cart;
  const checkoutTotal = Number.isFinite(Number(checkoutSummary?.totalAmount)) ? Number(checkoutSummary?.totalAmount) : cartTotal;

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => setSearchQuery(value), 300);
  }, []);

  const openCart = useCallback(() => {
    setCartClosing(false);
    setCartOpen(true);
  }, []);

  const openProductModal = useCallback((p: Product) => {
    setSelectedProduct(p);
    setModalQty(1);
    setModalClosing(false);
    setModalOpen(true);
  }, []);

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
    if (!canAct()) return;
    if (!selectedProduct || submitting) return;
    const finalQty = Math.max(1, typeof modalQty === "number" ? modalQty : parseInt(modalQty) || 1);
    const updatedCart = [...cart];
    const exIndex = updatedCart.findIndex((i) => i._id === selectedProduct._id);
    if (exIndex > -1) {
      updatedCart[exIndex].quantity += finalQty;
    } else {
      updatedCart.push({ ...selectedProduct, quantity: finalQty });
    }
    saveCart(updatedCart);
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 300);
    closeProductModal();
  };

  const updateQty = (id: string, d: number) => {
    if (submitting) return;
    const updated = cart.map((i) => (i._id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
    saveCart(updated);
  };

  const removeItem = (id: string) => {
    if (submitting) return;
    const updated = cart.filter((i) => i._id !== id);
    saveCart(updated);
  };

  const clearCartState = () => {
    saveCart([], { skipRemoteSync: true });
    if (token) {
      void fetch("/api/shop/cart", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const doCheckout = async () => {
    if (!canAct()) return;
    if (cart.length === 0 || submitting) return;
    if (checkoutInFlightRef.current) return;
    checkoutInFlightRef.current = true;
    setSubmitting(true); setCheckoutLoading(true); setError(null);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cartItems: cart.map((i) => ({ product: i._id, name: i.name, quantity: i.quantity, price: i.price })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      const nextSummary: CheckoutSummary = {
        subtotalAmount: Number(data.subtotalAmount || 0),
        discountAmount: Number(data.discountAmount || 0),
        discountPercent: Number(data.discountPercent || 0),
        totalAmount: Number(data.totalAmount || 0),
        items: Array.isArray(data.items) ? data.items : cart,
      };
      setOrderId(data.orderId);
      setCheckoutSummary(nextSummary);
      persistPendingCheckout(data.orderId, cart, customerTz, nextSummary);
      setStep("roblox");
    } catch (e) { setError(e instanceof Error ? e.message : "Checkout failed"); }
    finally { setSubmitting(false); setCheckoutLoading(false); checkoutInFlightRef.current = false; }
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
    if (!token) {
      setError("Please login with Discord first.");
      return;
    }
    if (!robloxSearchResult || !orderId) return;
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

      await fetchSlotsForTimezone(customerTz);
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

  const copyPaymentValue = async (value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedPaymentValue(value);
    window.setTimeout(() => setCopiedPaymentValue((current) => current === value ? null : current), 1600);
  };

  const createTicket = async (method: PaymentGuide = selectedPaymentGuide) => {
    if (!canAct()) return;
    if (!orderId || !token || submitting) return;
    if (ticketInFlightRef.current) return;
    const action = method === "ltc" ? "create-ticket-ltc" : "create-ticket-paypal-ff";
    ticketInFlightRef.current = true;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}?action=${action}`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      const ticketUrl = data?.guildId && data?.channelId
        ? `https://discord.com/channels/${data.guildId}/${data.channelId}`
        : data?.panelUrl || "";
      setTicketResult({ channelId: data.channelId, guildId: data.guildId, url: ticketUrl });
      clearPendingCheckout();
      clearCartState();
      if (ticketUrl) window.location.href = ticketUrl;
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); ticketInFlightRef.current = false; }
  };

  if (loading) return <div className="min-h-screen bg-[#050505]"><Navbar showCart={step === "shop"} cartCount={cartCount} onCartClick={openCart} /><LogoLoader /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar cartCount={cartCount} showCart={step === "shop" && cartCount > 0} onCartClick={openCart} />

      {checkoutLoading && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#1E1E1E] bg-[#111111]/95 px-6 py-5 shadow-2xl animate-bounce-in">
            <Loader2 className="h-8 w-8 animate-spin text-[#2F9BE6]" />
            <p className="text-sm font-medium text-white">Processing checkout...</p>
          </div>
        </div>
      )}

      {showVisitorNotice && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[20px] border border-[#1E1E1E] bg-[#111111] p-5 shadow-2xl animate-bounce-in">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">New here?</h2>
                <p className="mt-2 text-sm leading-6 text-[#B5B5B5]">If you are new, please check our vouches before ordering.</p>
              </div>
              <button
                type="button"
                onClick={dismissVisitorNotice}
                className="rounded-full bg-[#1E1E1E] p-2 text-white hover:bg-[#2A2A2A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  dismissVisitorNotice();
                  window.location.href = "/proofs";
                }}
                className="rounded-[14px] bg-[#2F9BE6] px-4 py-3 text-sm font-medium text-white primary-hover-glow"
              >
                View Proofs
              </button>
              <button
                type="button"
                onClick={dismissVisitorNotice}
                className="rounded-[14px] bg-[#1E1E1E] px-4 py-3 text-sm font-medium text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "shop" && cartCount > 0 && (
        <button onClick={openCart} className={"hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 rounded-full bg-[#2F9BE6] px-5 py-3 text-base font-medium shadow-2xl transition-transform hover:scale-105 active:scale-95 cart-pulse primary-hover-glow " + (cartPulse ? "animate-pulse-glow" : "")}>
          <ShoppingCart className="h-5 w-5" /> Cart ({cartCount})
        </button>
      )}

      {(cartOpen || cartClosing) && (
        <div className={"fixed inset-0 z-[70] flex items-end sm:items-stretch bg-black/60 backdrop-blur-sm " + (cartClosing ? "animate-fade-out" : "animate-fade-in")} onClick={closeCart}>
          <div className={"w-full sm:ml-auto sm:h-full sm:max-w-md max-h-[80vh] bg-[#111111] border-t sm:border-l border-[#1E1E1E] flex flex-col rounded-t-[24px] sm:rounded-none " + (cartClosing ? "animate-cart-slide-out" : "animate-cart-slide-in")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#1E1E1E] px-4 py-4 sticky top-0 bg-[#111111] z-10">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-[#2A2A2A] absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
              <h2 className="text-base sm:text-lg font-semibold">Cart ({cartCount})</h2>
              <button onClick={closeCart} className="rounded-full bg-[#161616] p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {cart.map((item) => (
                <div key={item._id} className="flex gap-3 rounded-[16px] border border-[#1E1E1E] bg-[#050505] p-3 sm:p-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 overflow-hidden rounded-[12px] sm:rounded-[14px] bg-[#111111]">
                    {item.image ? <img src={imgUrl(item.image)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Package className="h-full w-full p-3 text-[#B5B5B5]/60" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium leading-5">{formatPurchasedProductName(item)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => updateQty(item._id, -1)} className="rounded bg-[#161616] p-1"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, 1)} className="rounded bg-[#161616] p-1"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm font-medium text-[#3DDC84]">${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeItem(item._id)} className="text-xs text-[#FF4D4F]">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-[#1E1E1E] px-4 py-4 space-y-3 sticky bottom-0 bg-[#111111]">
                <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="text-[#3DDC84]">${cartTotal.toFixed(2)}</span></div>
                <button onClick={() => { closeCart(); void doCheckout(); }} disabled={submitting} className="w-full rounded-[14px] bg-[#2F9BE6] py-3 font-medium transition-all hover:bg-[#49B6FF] primary-hover-glow disabled:opacity-50">{submitting ? "Processing..." : "Checkout"}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {(modalOpen || modalClosing) && selectedProduct && (
        <div className={"fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 " + (modalClosing ? "animate-fade-out" : "animate-fade-in")} onClick={closeProductModal}>
          <div className={"motion-panel relative mx-3 w-full max-w-[340px] max-h-[82dvh] overflow-hidden rounded-[20px] border border-[#1E1E1E] bg-[#0A0A0A] shadow-2xl " + (modalClosing ? "animate-modal-zoom-out" : "animate-modal-zoom-in")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#1E1E1E] bg-[#0A0A0A] px-4 py-2.5">
              <h3 className="text-sm font-semibold text-white">Product Details</h3>
              <button onClick={closeProductModal} className="rounded-full bg-[#1E1E1E] p-2 active:scale-90"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[calc(82dvh-96px)] overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              <div className="mx-auto aspect-square w-full max-w-[120px] overflow-hidden rounded-[14px] bg-[#050505]">
                {selectedProduct.image ? <img src={imgUrl(selectedProduct.image)} alt="" loading="lazy" className="h-full w-full object-contain" /> : <Package className="h-full w-full p-8 text-[#B5B5B5]/50" />}
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold leading-tight">{formatProductNameWithQty(selectedProduct.name, selectedProduct.packQuantity)}</h2>
                {<p className="text-xs text-[#2F9BE6]">Pack {formatQtyLabel(selectedProduct.packQuantity)}</p>}
                
                <div className="flex items-baseline gap-1.5"><span className="text-xl font-bold text-[#3DDC84]">${selectedProduct.price.toFixed(2)}</span><span className="text-[10px] text-[#B5B5B5]">USD</span></div>
                {selectedProduct.bulkPrice && (
                  <p className="text-[10px] leading-4 text-[#2F9BE6]">Bulk: ${selectedProduct.bulkPrice?.toFixed(2)}</p>
                )}
              </div>
            </div>
            {selectedProduct.desc && (
              <div className="mt-2 rounded-[12px] bg-[#0D0D0D] p-3">
                <p className="whitespace-pre-wrap text-[11px] leading-4 text-[#9A9A9A]">{selectedProduct.desc}</p>
              </div>
            )}
            <div className="mt-2">
              
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setModalQty(Math.max(1, (typeof modalQty === "number" ? modalQty : parseInt(modalQty) || 1) - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#2A2A2A] active:scale-90"><Minus className="h-3.5 w-3.5" /></button>
                <input type="text" value={modalQty} onChange={(e) => { const val = e.target.value; if (val === "") { setModalQty(""); } else { const parsed = parseInt(val); if (!isNaN(parsed)) { setModalQty(Math.max(1, parsed)); } } }} className="w-14 rounded-[14px] border-2 border-[#2A2A2A] bg-[#0A0A0A] py-1.5 text-center text-base font-bold outline-none focus:border-[#2F9BE6]"
                />
                <button onClick={() => setModalQty((typeof modalQty === "number" ? modalQty : parseInt(modalQty) || 1) + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#2A2A2A] active:scale-90"><Plus className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            </div>
            <div className="border-t border-[#1E1E1E] bg-[#0A0A0A] px-4 py-3">
              <button onClick={addToCartFromModal} className="w-full rounded-full bg-gradient-to-r from-[#2F9BE6] to-[#49B6FF] py-3.5 text-sm font-semibold text-white active:scale-95 primary-hover-glow">Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-4 sm:py-6 animate-page-enter">
        {error && <div className="mb-4 rounded-[16px] border border-[#FF4D4F]/20 bg-[#FF4D4F]/10 px-4 py-3 text-sm text-[#FF4D4F]">{error}</div>}

        {step !== "shop" && (
          <div className="mx-auto max-w-2xl space-y-6 animate-page-enter">
            <button onClick={() => (() => { setStep("shop"); setOrderId(null); setCheckoutSummary(null); clearPendingCheckout(); })()} className="flex items-center gap-2 text-sm text-[#B5B5B5] hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Shop
            </button>
            <div className="flex gap-2">{(["roblox", "delivery", "ticket"] as const).map((s) => (
              <div key={s} className={"h-2 flex-1 rounded-full transition-colors " + (step === s ? "bg-[#49B6FF]" : (["roblox", "delivery", "ticket"].indexOf(step) > ["roblox", "delivery", "ticket"].indexOf(s) ? "bg-[#3DDC84]" : "bg-[#161616]"))} />
            ))}</div>
            <div className="motion-panel rounded-[24px] border border-[#1E1E1E] bg-[#111111] p-4 sm:p-6 space-y-4 animate-section-enter">
              <div className="border-b border-[#1E1E1E] pb-3">
                <p className="text-sm text-[#B5B5B5]">Order {orderId}</p>
                <div className="mt-2 space-y-1">{checkoutItems.map((i) => (
                  <div key={String(i._id || ("product" in i ? i.product : "") || i.name)} className="flex justify-between text-sm"><span>{formatPurchasedProductName(i)}</span><span className="text-[#B5B5B5]">${(Number(i.price || 0) * Number(i.quantity || 1)).toFixed(2)}</span></div>
                ))}<div className="flex justify-between border-t border-[#1E1E1E] pt-2 font-semibold"><span>Total</span><span className="text-[#3DDC84]">${checkoutTotal.toFixed(2)}</span></div></div>
              </div>
              {step === "roblox" && (
                <div className="space-y-4">
                  <div className="rounded-[16px] border border-[#1E1E1E] bg-[#050505] p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><DiscordIcon className="h-5 w-5 text-[#5865F2]" />Discord Login</h3>
                    {token && user ? (
                      <div className="rounded-[14px] border border-[#3DDC84]/25 bg-[#3DDC84]/10 px-4 py-3 text-sm text-[#3DDC84]">
                        Logged in as {user.discordUsername}
                      </div>
                    ) : (
                      <a
                        href={getOAuthUrl("/shop")}
                        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#5865F2] py-3 text-center font-medium text-white transition-all hover:bg-[#6875ff]"
                      >
                        <DiscordIcon className="h-5 w-5" />
                        Login with Discord
                      </a>
                    )}
                  </div>
                  {!robloxSearchResult ? (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold"><RobloxIcon className="h-5 w-5 text-white" />Enter Roblox Username</h3>
                      <div className="flex flex-col gap-3">
                        <input
                          value={robloxUsernameInput}
                          onChange={(e) => setRobloxUsernameInput(e.target.value)}
                          placeholder="Enter Roblox username..."
                          className="w-full rounded-[14px] border border-[#1E1E1E] bg-[#050505] px-4 py-3 outline-none focus:border-[#2F9BE6]"
                        />
                        <button
                          onClick={() => void lookupRobloxUsername()}
                          disabled={submitting || !robloxUsernameInput.trim() || robloxUsernameInput.length < 3}
                          className="w-full rounded-[14px] bg-[#2F9BE6] py-3 font-medium transition-all hover:bg-[#49B6FF] primary-hover-glow disabled:opacity-50"
                        >
                          {submitting ? "Searching..." : "Lookup Account"}
                        </button>
                      </div>
                      <p className="text-xs text-[#B5B5B5]/80">Enter at least 3 characters to search</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold"><RobloxIcon className="h-5 w-5 text-white" />Verify Roblox Account</h3>
                      <p className="text-sm text-[#B5B5B5]">Is this your Roblox account?</p>
                      <div className="flex items-center gap-4 rounded-[16px] border border-[#1E1E1E] bg-[#050505] p-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-[#161616]">
                          {robloxSearchResult.avatar ? (
                            <img src={robloxSearchResult.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-full w-full p-3 text-[#B5B5B5]/60" />
                          )}
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-[#B5B5B5]">Display Name</p>
                          <p className="text-lg font-semibold text-white">{robloxSearchResult.displayName}</p>
                          <p className="text-sm text-[#2F9BE6]">@{robloxSearchResult.username}</p>
                          <a
                            href={`https://www.roblox.com/users/${robloxSearchResult.userId}/profile`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-[#B5B5B5] hover:text-white"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => { setRobloxSearchResult(null); setRobloxUsernameInput(""); }}
                          className="rounded-[14px] bg-[#1E1E1E] py-3 font-medium transition-colors hover:bg-[#1E1E1E]"
                        >
                          Re-enter
                        </button>
                        <button
                          onClick={() => void linkRobloxUsername()}
                          disabled={submitting || !token}
                          className="rounded-[14px] bg-[#3DDC84] py-3 font-medium transition-colors hover:bg-[#3DDC84]/90 primary-hover-glow disabled:opacity-50"
                        >
                          {token ? "Confirm" : "Login first"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {step === "delivery" && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" />Delivery Time</h3>
                  <div className="space-y-3 rounded-[16px] border border-[#1E1E1E] bg-[#050505] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#B5B5B5]/80">Your timezone</p>
                        <p className="text-sm font-medium text-[#B5B5B5]">{selectedTimezoneLabel}</p>
                        <p className="text-xs text-[#B5B5B5]/80">{customerTz}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const detected = detectUserTimezone();
                          selectTimezone(detected);
                        }}
                        className="rounded-[14px] bg-[#161616] px-3 py-2 text-xs font-medium text-[#B5B5B5] hover:bg-[#1E1E1E]"
                      >
                        Auto detect
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B5B5B5]/80" />
                      <input
                        value={tzSearch}
                        onChange={(e) => setTzSearch(e.target.value)}
                        placeholder="Search country or timezone..."
                        className="w-full rounded-[14px] border border-[#1E1E1E] bg-[#111111] py-3 pl-9 pr-3 text-sm outline-none focus:border-[#2F9BE6]"
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
                              className={"w-full rounded-[14px] border p-3 text-left transition-all " + (!hasMultiple && isAnySelected ? "border-[#2F9BE6] bg-[#49B6FF]/10" : "border-[#1E1E1E] bg-[#111111] hover:border-[#1E1E1E]")}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-white">{group.flag} {group.country}</span>
                                {hasMultiple ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-[#B5B5B5]/80"><span>{group.zones.length} zones</span><ChevronDown className={"h-3 w-3 transition-transform " + (isExpanded ? "rotate-180" : "")} /></span>
                                ) : (
                                  <span className="text-xs text-[#B5B5B5]/80">{group.zones[0].value.split("/").pop()?.replaceAll("_", " ")}</span>
                                )}
                              </div>
                              {!hasMultiple && <p className="mt-1 text-xs text-[#B5B5B5]">{group.zones[0].label}</p>}
                            </button>
                            {hasMultiple && isExpanded && (
                              <div className="ml-4 space-y-1 border-l-2 border-[#1E1E1E] pl-3">
                                {group.zones.map((tz) => (
                                  <button
                                    key={tz.value}
                                    type="button"
                                    onClick={() => selectTimezone(tz.value)}
                                    className={"w-full rounded-[14px] border p-2 text-left transition-all " + (customerTz === tz.value ? "border-[#2F9BE6] bg-[#49B6FF]/10" : "border-[#1E1E1E] bg-[#050505] hover:border-[#1E1E1E]")}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-sm text-[#B5B5B5]">{tz.label}</span>
                                      <span className="text-xs text-[#B5B5B5]/80">{tz.value.split("/").pop()?.replaceAll("_", " ")}</span>
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
                  <div className="space-y-3">
                    <div className="space-y-3 rounded-[16px] border border-[#1E1E1E] bg-[#050505] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <button type="button" onClick={() => setDeliveryMonth((current) => addMonths(current || deliveryMonthKey, -1))} className="rounded-[12px] bg-[#111111] p-2 text-[#B5B5B5] hover:text-white">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <p className="text-sm font-semibold text-white">{getMonthLabel(deliveryMonthKey)}</p>
                        <button type="button" onClick={() => setDeliveryMonth((current) => addMonths(current || deliveryMonthKey, 1))} className="rounded-[12px] bg-[#111111] p-2 text-[#B5B5B5] hover:text-white">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#B5B5B5]/70">
                        {WEEKDAY_LABELS.map((day) => <div key={day}>{day}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {deliveryCalendarDays.map((day) => {
                          const hasSlots = slotDateSet.has(day.key);
                          return (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => {
                                if (!day.inMonth) return;
                                setSelectedSlotDate(day.key);
                                setPickedSlot(null);
                              }}
                              disabled={!day.inMonth}
                              className={"relative h-10 rounded-[12px] text-sm font-medium transition-all " + (selectedSlotDate === day.key
                                ? "bg-[#2F9BE6] text-white"
                                : hasSlots
                                  ? "bg-[#111111] text-white hover:bg-[#1E1E1E]"
                                  : day.inMonth
                                    ? "bg-[#080808] text-[#B5B5B5] hover:bg-[#111111]"
                                    : "bg-transparent text-[#B5B5B5]/20")}
                            >
                              {day.day}
                              {hasSlots && selectedSlotDate !== day.key && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#3DDC84]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {visibleSlotSegments.length === 0 && <p className="text-sm text-[#B5B5B5]">No available times for this date.</p>}
                    {visibleSlotSegments.map((s) => (
                      <button key={s.id} onClick={() => setPickedSlot(s.id)} className={"w-full rounded-[16px] border p-4 text-left transition-all " + (pickedSlot === s.id ? "border-[#2F9BE6] bg-[#49B6FF]/10" : "border-[#1E1E1E] bg-[#050505] hover:border-[#1E1E1E]")}>
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#2F9BE6]" /><span className="text-sm font-medium">{s.customerTimeLabel}</span></div>
                        {s.note && <p className="mt-1 pl-6 text-xs text-[#2F9BE6]">{formatSlotNote(s.note)}</p>}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => void confirmSlot()} disabled={!pickedSlot || submitting} className="w-full rounded-[14px] bg-[#2F9BE6] py-3 font-medium primary-hover-glow disabled:opacity-50">{submitting ? "Saving..." : "Confirm time"}</button>
                </div>
              )}
              {step === "ticket" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Select Payment Method</h3>
                  {!ticketResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentGuide("paypal_ff")}
                          className={"flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-medium transition-all " + (selectedPaymentGuide === "paypal_ff" ? "border-[#2F9BE6] bg-[#49B6FF]/10 text-white" : "border-[#1E1E1E] bg-[#050505] text-[#B5B5B5] hover:text-white")}
                        >
                          <CreditCard className="h-4 w-4" />
                          PayPal
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentGuide("ltc")}
                          className={"flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-medium transition-all " + (selectedPaymentGuide === "ltc" ? "border-[#2F9BE6] bg-[#49B6FF]/10 text-white" : "border-[#1E1E1E] bg-[#050505] text-[#B5B5B5] hover:text-white")}
                        >
                          <QrCode className="h-4 w-4" />
                          Litecoin
                        </button>
                      </div>

                      <div className="rounded-[16px] border border-[#1E1E1E] bg-[#050505] p-4 space-y-4">
                        {selectedPaymentGuide === "paypal_ff" ? (
                          <>
                            <div className="space-y-1">
                              <h4 className="text-base font-semibold text-white">PayPal Payment Guide</h4>
                              <p className="text-sm text-[#B5B5B5]">Payment Method: <span className="font-semibold text-white">Friends and Family</span></p>
                              <p className="text-sm text-[#B5B5B5]">Payment Amount: <span className="font-semibold text-[#3DDC84]">${checkoutTotal.toFixed(2)}</span></p>
                            </div>
                            <div>
                              <p className="mb-2 text-sm text-[#B5B5B5]">Send to</p>
                              <div className="flex gap-2">
                                <div className="min-w-0 flex-1 break-all rounded-[14px] border border-[#1E1E1E] bg-[#111111] px-3 py-3 font-mono text-sm text-white">{PAYPAL_EMAIL}</div>
                                <button type="button" onClick={() => void copyPaymentValue(PAYPAL_EMAIL)} className="rounded-[14px] bg-[#1E1E1E] px-3 text-white">
                                  {copiedPaymentValue === PAYPAL_EMAIL ? <CheckCircle2 className="h-4 w-4 text-[#3DDC84]" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm leading-6 text-[#B5B5B5]">
                              <p><span className="font-semibold text-white">1.</span> Select <span className="font-semibold text-white">Friends and Family</span> as the payment method.</p>
                              <p><span className="font-semibold text-white">2.</span> Send <span className="font-semibold text-white">${checkoutTotal.toFixed(2)}</span> to the PayPal email address above.</p>
                              <p><span className="font-semibold text-white">3.</span> After completing the payment, click the <span className="font-semibold text-white">Create Ticket</span> button below.</p>
                              <p><span className="font-semibold text-white">4.</span> Send your payment screenshot in the ticket after it opens.</p>
                            </div>
                            <div className="rounded-[14px] border border-[#FF4D4F]/30 bg-[#FF4D4F]/10 p-3 text-sm text-[#FFB3B3]">
                              Payments sent using Goods and Services instead of Friends and Family are not eligible for a refund.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <h4 className="text-base font-semibold text-white">LTC Payment Guide</h4>
                              <p className="text-sm text-[#B5B5B5]">Payment Method: <span className="font-semibold text-white">Litecoin (LTC)</span></p>
                              <p className="text-sm text-[#B5B5B5]">Payment Amount: <span className="font-semibold text-[#3DDC84]">${checkoutTotal.toFixed(2)}</span></p>
                            </div>
                            <div>
                              <p className="mb-2 text-sm text-[#B5B5B5]">Payment Address</p>
                              <div className="flex gap-2">
                                <div className="min-w-0 flex-1 break-all rounded-[14px] border border-[#1E1E1E] bg-[#111111] px-3 py-3 font-mono text-sm text-white">{LTC_ADDRESS}</div>
                                <button type="button" onClick={() => void copyPaymentValue(LTC_ADDRESS)} className="rounded-[14px] bg-[#1E1E1E] px-3 text-white">
                                  {copiedPaymentValue === LTC_ADDRESS ? <CheckCircle2 className="h-4 w-4 text-[#3DDC84]" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <img src="/pictures/payments/ltc.png" alt="Litecoin QR code" className="h-44 w-44 rounded-[14px] border border-[#1E1E1E] bg-white p-2" />
                            <div className="space-y-2 text-sm leading-6 text-[#B5B5B5]">
                              <p><span className="font-semibold text-white">1.</span> Select <span className="font-semibold text-white">Litecoin (LTC)</span> as the payment method.</p>
                              <p><span className="font-semibold text-white">2.</span> Send <span className="font-semibold text-white">${checkoutTotal.toFixed(2)}</span> worth of LTC to the wallet address above, or scan the QR code.</p>
                              <p><span className="font-semibold text-white">3.</span> After completing the payment, click the <span className="font-semibold text-white">Create Ticket</span> button below.</p>
                              <p><span className="font-semibold text-white">4.</span> Send your payment screenshot in the ticket after it opens.</p>
                            </div>
                            <div className="rounded-[14px] border border-[#FF4D4F]/30 bg-[#FF4D4F]/10 p-3 text-sm text-[#FFB3B3]">
                              Please double-check the wallet address before sending. Crypto payments are non-refundable once confirmed on the blockchain.
                            </div>
                          </>
                        )}
                      </div>
                      <button onClick={() => void createTicket(selectedPaymentGuide)} disabled={submitting} className="w-full rounded-[14px] bg-[#3DDC84] py-3 font-medium primary-hover-glow disabled:opacity-50">
                        {submitting ? "Creating..." : selectedPaymentGuide === "ltc" ? "Create LTC Ticket" : "Create PayPal Ticket"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-[16px] border border-[#3DDC84]/30 bg-[#3DDC84]/10 p-4"><CheckCircle2 className="h-5 w-5 text-[#3DDC84]" /><span className="text-sm">Ticket created!</span></div>
                      <button onClick={() => { (() => { setStep("shop"); setOrderId(null); setCheckoutSummary(null); clearPendingCheckout(); })(); clearCartState(); setOrderId(null); setRobloxUsernameInput(""); setPickedSlot(null); setTicketResult(null); }} className="w-full rounded-[14px] bg-[#161616] py-3 text-sm">Continue Shopping</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "shop" && (
          <div className="space-y-8">
            <div className="motion-panel overflow-hidden rounded-[20px] border border-[#1E1E1E] bg-[#111111]/70 py-3 animate-section-enter">
              <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap">
                {[...recentPurchases, ...recentPurchases].map((p, i) => (
                  <span key={i} className="mx-4 inline-flex items-center gap-2 text-sm text-[#B5B5B5] sm:mx-6">
                    <span className="text-[#2F9BE6] font-medium">{maskName(p.username)}</span>
                    <span className="text-[#B5B5B5]/80">purchased</span>
                    <span className="text-[#3DDC84]">{p.items}</span>
                    {p.price && <span className="text-[#B5B5B5]">@ ${p.price.toFixed(2)}</span>}
                  </span>
                ))}
              </div>
              <style>{`@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
            </div>

            <div className="relative animate-section-enter mb-6">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#B5B5B5]" />
              <input value={searchInput} onChange={handleSearchChange} placeholder="Search items..." className="w-full rounded-[20px] border border-[#1E1E1E] bg-[#111111] py-4 pl-11 pr-4 text-base outline-none transition-colors focus:border-[#2F9BE6]" />
            </div>

            <div className="mb-6 flex items-center gap-2 animate-section-enter">
              <span className="text-sm text-[#B5B5B5]/80">Price</span>
              {([
                ["none", "Default"],
                ["low-high", "Low to High"],
                ["high-low", "High to Low"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriceSort(value)}
                  className={"rounded-full px-4 py-2 text-sm font-medium transition-all " + (priceSort === value ? "bg-[#2F9BE6] text-white" : "bg-[#111111] text-[#B5B5B5] hover:text-white")}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 animate-section-enter scrollbar-hide">
              <button onClick={() => setSelectedGame(null)} className={"shrink-0 rounded-full px-5 py-3 text-sm font-medium transition-all " + (!activeSelectedGame ? "bg-[#2F9BE6] text-white shadow-lg" : "bg-[#111111] text-[#B5B5B5] active:bg-[#161616]")}>
                All Games
              </button>
              {games.map((g) => (
                <button key={g._id} onClick={() => setSelectedGame(g._id)} className={"flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all " + (activeSelectedGame === g._id ? "bg-[#2F9BE6] text-white shadow-lg" : "bg-[#111111] text-[#B5B5B5] active:bg-[#161616]")}>
                  {g.image && <img src={imgUrl(g.image)} alt="" className="h-5 w-5 rounded object-cover" />}
                  {g.name}
                </button>
              ))}
            </div>

            {banners.length > 0 && (
              <div className="motion-panel overflow-hidden rounded-[24px] border border-[#1E1E1E] animate-section-enter mb-8">
                <img src={imgUrl(banners[0])} alt="" className="w-full max-w-full h-auto object-cover max-h-[220px] sm:max-h-[320px] md:max-h-[400px]" />
              </div>
            )}

            {bestSellers.length > 0 && !showAll && !activeSelectedGame && !searchQuery && (
              <div className="animate-section-enter">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-[#2F9BE6]">Best Sellers</h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBestSellerPage((page) => Math.max(0, page - 1))}
                      disabled={bestSellerPage === 0}
                      className="rounded-[14px] border border-[#1E1E1E] bg-[#111111] p-2 text-[#B5B5B5] hover:border-[#2F9BE6]/40 hover:bg-[#161616] disabled:opacity-40"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBestSellerPage((page) => Math.min(Math.max(0, Math.ceil(bestSellers.length / BEST_SELLERS_PER_PAGE) - 1), page + 1))}
                      disabled={bestSellerPage >= Math.ceil(bestSellers.length / BEST_SELLERS_PER_PAGE) - 1}
                      className="rounded-[14px] border border-[#1E1E1E] bg-[#111111] p-2 text-[#B5B5B5] hover:border-[#2F9BE6]/40 hover:bg-[#161616] disabled:opacity-40"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {bestSellers
                    .slice(bestSellerPage * BEST_SELLERS_PER_PAGE, (bestSellerPage + 1) * BEST_SELLERS_PER_PAGE)
                    .map((p, idx) => (
                      <ProductCard key={p._id} product={p} index={idx} onOpen={openProductModal} variant="bestSeller" />
                    ))}
                </div>
              </div>
            )}

            <div className="animate-section-enter">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">{activeSelectedGame ? games.find((g) => g._id === activeSelectedGame)?.name || "Items" : "All Items"}</h2>
                {!showAll && filtered.length > 8 && !searchQuery && (
                  <button onClick={() => setShowAll(true)} className="rounded-[14px] bg-[#161616] px-4 py-2 text-sm transition-colors hover:bg-[#1E1E1E]">View Full</button>
                )}
              </div>
                {showAll && (
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button onClick={() => setShowAll(false)} className="flex items-center gap-2 rounded-[14px] bg-[#1E1E1E] px-4 py-2 text-sm transition-colors hover:bg-[#1E1E1E]"><ArrowLeft className="h-4 w-4" /> Back</button>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-[#B5B5B5]/80">Price</span>
                      {([
                        ["none", "Default"],
                        ["low-high", "Low to High"],
                        ["high-low", "High to Low"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPriceSort(value)}
                          className={"rounded-full px-4 py-2 text-sm font-medium transition-all " + (priceSort === value ? "bg-[#2F9BE6] text-white" : "bg-[#111111] text-[#B5B5B5] hover:text-white")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {(showAll ? filtered : filtered.slice(0, 8)).map((p, idx) => (
                  <ProductCard key={p._id} product={p} index={idx} onOpen={openProductModal} />
                ))}
              </div>
              {filtered.length === 0 && <div className="py-20 text-center text-[#B5B5B5]"><Package className="mx-auto mb-4 h-16 w-16 opacity-30" /><p>No items found.</p></div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

























