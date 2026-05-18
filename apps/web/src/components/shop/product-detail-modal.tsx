"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, X } from "lucide-react";
import { QuantitySelector } from "@/components/shop/quantity-selector";
import { cn, getProductImageUrl } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setImageError(false);
    }
  }, [product?._id]);

  if (!product) return null;

  const isPortrait =
    product.category === "Sets" || product.category === "Relic";
  const imageUrl = imageError
    ? "/products/placeholder.png"
    : getProductImageUrl(product.image);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          {/* Left - Image */}
          <div
            className={cn(
              "relative flex items-center justify-center bg-secondary md:col-span-3",
              isPortrait ? "aspect-[3/4] max-h-[300px]" : "aspect-square"
            )}
          >
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className={cn(
                "object-contain p-4 transition-transform duration-200",
                product.category === "Sets" && "scale-110"
              )}
              onError={() => setImageError(true)}
              unoptimized
            />
          </div>

          {/* Right - Details */}
          <div className="flex flex-col justify-center p-6 md:col-span-2">
            {/* Category */}
            <p className="text-xs uppercase tracking-wider text-accent">
              {product.category}
            </p>

            {/* Name */}
            <h2 className="mt-1 font-gothic text-3xl tracking-tight md:text-2xl">
              {product.name}
            </h2>

            {/* Description */}
            {product.desc && (
              <p className="mt-2 font-serif text-sm text-muted-foreground">
                {product.desc}
              </p>
            )}

            {/* Benefits */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span>Secure Transaction</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-6">
              <label className="text-sm font-medium">Quantity</label>
              <div className="mt-2">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={100000}
                />
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="mt-6 w-full py-4 text-base"
              size="xl"
            >
              Add to Cart - {formatCurrency(product.price * quantity)}
            </Button>

            {/* Bulk Pricing Info */}
            {product.bulkPrice && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Bulk pricing available: {formatCurrency(product.bulkPrice)} per unit
                for 10+ units
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
