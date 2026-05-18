"use client";

import { useState } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";

interface BestSellerSelectorProps {
  products: Product[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  className?: string;
}

export function BestSellerSelector({
  products,
  selectedIds,
  onSelectionChange,
  className,
}: BestSellerSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = async (productId: string) => {
    const isSelected = selectedIds.includes(productId);
    let newIds: string[];

    if (isSelected) {
      newIds = selectedIds.filter((id) => id !== productId);
    } else {
      newIds = [...selectedIds, productId];
    }

    try {
      await apiPut(API_ROUTES.CONFIG_BEST_SELLERS, {
        bestSellerIds: newIds,
      });
      onSelectionChange(newIds);
    } catch (error) {
      console.error("Failed to update best sellers:", error);
      alert("Failed to update best sellers");
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Best Sellers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Product List */}
        <ScrollArea className="h-[300px] rounded-lg border">
          <div className="space-y-1 p-2">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.includes(product._id);
              return (
                <button
                  key={product._id}
                  onClick={() => toggleProduct(product._id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                    isSelected
                      ? "bg-accent/10 border border-accent"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-secondary">
                    <img
                      src={
                        product.image.startsWith("http")
                          ? product.image
                          : `/api/shop/product-images/${product.image}`
                      }
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.category} - ${(product.price / 100).toFixed(2)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground">
          {selectedIds.length} products selected as best sellers
        </p>
      </CardContent>
    </Card>
  );
}
