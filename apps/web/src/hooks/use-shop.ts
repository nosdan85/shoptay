"use client";

import { useCallback, useEffect } from "react";
import { useShopStore } from "@/stores/shop-store";
import { Product, Game, ShopConfig, RecentPurchase } from "@/types";

export function useShop() {
  const {
    products,
    games,
    config,
    recentPurchases,
    isLoading,
    error,
    activeGameId,
    activeCategory,
    searchQuery,
    sortBy,
    viewMode,
    fetchProducts,
    fetchGames,
    fetchConfig,
    fetchRecentPurchases,
    fetchAll,
    setActiveGameId,
    setActiveCategory,
    setSearchQuery,
    setSortBy,
    setViewMode,
    getFilteredProducts,
  } = useShopStore();

  // Fetch all shop data on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh recent purchases
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentPurchases(30);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [fetchRecentPurchases]);

  const filteredProducts = getFilteredProducts();

  const productsByGame = useCallback(
    (gameId: string | null) => {
      if (!gameId) return products;
      return products.filter((p) => p.gameId === gameId);
    },
    [products]
  );

  const bestSellers = config?.bestSellerIds
    ? products.filter((p) => config.bestSellerIds.includes(p._id))
    : [];

  return {
    products,
    games,
    config,
    recentPurchases,
    isLoading,
    error,
    activeGameId,
    activeCategory,
    searchQuery,
    sortBy,
    viewMode,
    filteredProducts,
    productsByGame,
    bestSellers,
    fetchProducts,
    fetchGames,
    fetchConfig,
    fetchRecentPurchases,
    fetchAll,
    setActiveGameId,
    setActiveCategory,
    setSearchQuery,
    setSortBy,
    setViewMode,
  };
}
