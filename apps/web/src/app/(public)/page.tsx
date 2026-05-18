"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/hooks/use-shop";
import { useCart } from "@/hooks/use-cart";
import { useUIStore } from "@/stores/ui-store";
import { Product } from "@/types";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartModal } from "@/components/shop/cart-modal";
import { ProductDetailModal } from "@/components/shop/product-detail-modal";
import { ProductCard } from "@/components/shop/product-card";
import { SearchBar } from "@/components/shop/search-bar";
import { GameSelector } from "@/components/shop/category-filter";
import { CategoryFilter, SortSelect } from "@/components/shop/category-filter";
import { BannerCarousel } from "@/components/shop/banner-carousel";
import { BestSellersPanel } from "@/components/shop/best-sellers-panel";
import { RecentPurchasesTicker } from "@/components/shop/recent-purchases-ticker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheckIcon, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const {
    products,
    games,
    config,
    recentPurchases,
    isLoading,
    activeGameId,
    activeCategory,
    searchQuery,
    sortBy,
    filteredProducts,
    bestSellers,
    setActiveGameId,
    setActiveCategory,
    setSearchQuery,
    setSortBy,
  } = useShop();

  const { openCart } = useCart();
  const { proofNoticeSeen, dismissProofNotice } = useUIStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"browse" | "grid">("browse");

  const handleAddToCart = (product: Product, quantity: number) => {
    const { addToCart } = useCart.getState();
    addToCart(product, quantity);
  };

  // Products grouped by game for browse view
  const productsByGame = games.map((game) => ({
    game,
    products: filteredProducts.filter((p) => p.gameId === game._id),
  })).filter((group) => group.products.length > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Proof Notice Banner */}
      {!proofNoticeSeen && (
        <div className="fixed left-0 right-0 top-16 z-40 flex items-center justify-center gap-4 border-b border-border bg-accent/10 px-4 py-2">
          <ShieldCheckIcon className="h-5 w-5 text-accent" />
          <p className="text-sm">New here? See our receipts from real customers.</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => window.location.href = "/proofs"}
          >
            View Proof Logs
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
          <button
            onClick={dismissProofNotice}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className={cn("flex-1", !proofNoticeSeen && "pt-28")}>
        {/* Recent Purchases Ticker */}
        <RecentPurchasesTicker purchases={recentPurchases} />

        <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
          {/* Banner Carousel */}
          {config?.banners && config.banners.length > 0 && (
            <BannerCarousel banners={config.banners} />
          )}

          {/* Best Sellers Panel */}
          {bestSellers.length > 0 && (
            <section>
              <h2 className="mb-4 font-gothic text-2xl font-bold">Best Sellers</h2>
              <BestSellersPanel
                products={bestSellers}
                onOpenDetail={setSelectedProduct}
              />
            </section>
          )}

          {/* Search & Filters */}
          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                className="max-w-xl flex-1"
              />
              <div className="flex gap-2">
                <GameSelector
                  games={games}
                  activeGameId={activeGameId}
                  onGameChange={setActiveGameId}
                />
                <SortSelect value={sortBy} onChange={(v) => setSortBy(v as typeof sortBy)} />
              </div>
            </div>

            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </section>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "browse" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("browse")}
              >
                Browse by Game
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                All Items
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} products
            </p>
          </div>

          {/* Products */}
          {isLoading ? (
            <div className="products-loader">
              <div className="products-loader-emoji">🐕</div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-serif text-lg text-muted-foreground">
                No products found.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.slice(0, 12).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onOpenDetail={setSelectedProduct}
                  className="product-reveal"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {productsByGame.map(({ game, products }) => (
                <section key={game._id}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-gothic text-2xl font-bold">{game.name}</h2>
                    <Button variant="link" size="sm" className="text-accent">
                      View All
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {products.slice(0, 6).map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onOpenDetail={setSelectedProduct}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Cart Modal */}
      <CartModal isOpen={false} onClose={() => {}} />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
