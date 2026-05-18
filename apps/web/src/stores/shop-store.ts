import { create } from "zustand";
import { Product, Game, ShopConfig, RecentPurchase } from "@/types";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";

type SortOption = "default" | "price_asc" | "price_desc";
type ViewMode = "browse" | "grid";

interface ShopState {
  products: Product[];
  games: Game[];
  config: ShopConfig | null;
  recentPurchases: RecentPurchase[];
  isLoading: boolean;
  error: string | null;
  activeGameId: string | null;
  activeCategory: string;
  searchQuery: string;
  sortBy: SortOption;
  viewMode: ViewMode;

  // Actions
  fetchProducts: () => Promise<void>;
  fetchGames: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  fetchRecentPurchases: (limit?: number) => Promise<void>;
  fetchAll: () => Promise<void>;
  setActiveGameId: (id: string | null) => void;
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  getFilteredProducts: () => Product[];
}

// Normalize category from API
const normalizeCategory = (category: string): string => {
  const normalized = category.trim();
  const validCategories = [
    "Chest",
    "Reroll",
    "Shard",
    "Seal",
    "Relic",
    "Sets",
    "Combo",
    "Other",
  ];
  if (validCategories.includes(normalized)) return normalized;
  return "Other";
};

export const useShopStore = create<ShopState>()((set, get) => ({
  products: [],
  games: [],
  config: null,
  recentPurchases: [],
  isLoading: false,
  error: null,
  activeGameId: null,
  activeCategory: "",
  searchQuery: "",
  sortBy: "default",
  viewMode: "browse",

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ products: Product[] }>(API_ROUTES.PRODUCTS);
      const products = (response.data?.products || []).map((p) => ({
        ...p,
        category: normalizeCategory(p.category) as Product["category"],
      }));
      set({ products, isLoading: false });

      // Cache in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "productsCache",
          JSON.stringify({ data: products, ts: Date.now() })
        );
      }
    } catch (error) {
      // Try to load from cache
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("productsCache");
        if (cached) {
          try {
            const { data } = JSON.parse(cached);
            set({ products: data, error: null });
          } catch {
            set({ error: "Failed to load products", isLoading: false });
          }
        } else {
          set({ error: "Failed to load products", isLoading: false });
        }
      }
    }
  },

  fetchGames: async () => {
    try {
      const response = await api.get<{ games: Game[] }>(API_ROUTES.GAMES);
      const games = response.data?.games || [];
      set({ games });

      // Set first game as active if none selected
      const { activeGameId } = get();
      if (!activeGameId && games.length > 0) {
        set({ activeGameId: games[0]._id });
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
    }
  },

  fetchConfig: async () => {
    try {
      const response = await api.get<ShopConfig>(API_ROUTES.CONFIG);
      set({ config: response.data || null });
    } catch (error) {
      console.error("Failed to fetch config:", error);
    }
  },

  fetchRecentPurchases: async (limit = 30) => {
    try {
      const response = await api.get<{ purchases: RecentPurchase[] }>(
        API_ROUTES.RECENT_PURCHASES,
        { params: { limit } }
      );
      set({ recentPurchases: response.data?.purchases || [] });
    } catch (error) {
      console.error("Failed to fetch recent purchases:", error);
    }
  },

  fetchAll: async () => {
    set({ isLoading: true, error: null });

    try {
      await Promise.all([
        get().fetchProducts(),
        get().fetchGames(),
        get().fetchConfig(),
        get().fetchRecentPurchases(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveGameId: (id) => set({ activeGameId: id }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setViewMode: (mode) => set({ viewMode: mode }),

  getFilteredProducts: () => {
    const { products, activeGameId, activeCategory, searchQuery, sortBy } =
      get();

    let filtered = [...products];

    // Filter by game
    if (activeGameId) {
      filtered = filtered.filter((p) => p.gameId === activeGameId);
    }

    // Filter by category
    if (activeCategory) {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.desc?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  },
}));

// Selectors
export const selectFilteredProducts = (state: ShopState) =>
  state.getFilteredProducts();
export const selectIsLoading = (state: ShopState) => state.isLoading;
export const selectProductsByGame = (gameId: string) => (state: ShopState) =>
  state.products.filter((p) => p.gameId === gameId);
