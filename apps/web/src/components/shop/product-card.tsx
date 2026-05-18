"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { cn, getProductImageUrl } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  className?: string;
}

export function ProductCard({ product, onOpenDetail, className }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const isSetsCategory = product.category === "Sets";

  const imageUrl = imageError
    ? "/products/placeholder.png"
    : getProductImageUrl(product.image);

  return (
    <div
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-secondary p-3 transition-all duration-200 hover:border-border-medium hover:shadow-lg",
        className
      )}
      onClick={() => onOpenDetail(product)}
    >
      {/* Category Label */}
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {product.category}
      </p>

      {/* Product Name */}
      <h3
        className={cn(
          "mb-2 line-clamp-2 text-[13px] font-gothic leading-tight transition-colors group-hover:text-accent",
          isSetsCategory && "text-center"
        )}
      >
        {product.name}
      </h3>

      {/* Image Container */}
      <div
        className={cn(
          "relative mx-auto flex aspect-square max-h-[150px] w-[90%] items-center justify-center overflow-hidden rounded-lg border bg-background",
          isSetsCategory && "w-full"
        )}
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className={cn(
            "object-contain transition-transform duration-200",
            isSetsCategory ? "scale-[1.10] group-hover:scale-[1.17]" : "group-hover:scale-105"
          )}
          onError={() => setImageError(true)}
          unoptimized
        />
      </div>

      {/* Description */}
      {product.desc && (
        <p className="mt-2 text-[11px] leading-snug font-serif text-muted-foreground">
          {product.desc}
        </p>
      )}

      {/* Price */}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-gothic text-sm font-semibold text-accent">
          {formatCurrency(product.price)}
        </span>
        {product.bulkPrice && product.bulkPrice < product.price && (
          <span className="text-[10px] text-muted-foreground">
            Bulk: {formatCurrency(product.bulkPrice)}
          </span>
        )}
      </div>
    </div>
  );
}
