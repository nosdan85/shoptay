"use client";

import { useState } from "react";
import Image from "next/image";
import { Proof } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTimeAgo } from "@/lib/format";

interface ProofCardProps {
  proof: Proof;
  onOpen: () => void;
  className?: string;
}

export function ProofCard({ proof, onOpen, className }: ProofCardProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = proof.imageUrls[0];
  const hasMultipleImages = proof.imageUrls.length > 1;

  // Handle both old _id and new id
  const proofId = (proof as any)._id || proof.id;

  return (
    <div
      className={cn(
        "group cursor-pointer overflow-hidden rounded-lg border border-border bg-secondary transition-all hover:border-border-medium hover:shadow-lg",
        className
      )}
      onClick={onOpen}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`Proof for order ${proof.orderId}`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        {hasMultipleImages && (
          <Badge
            variant="secondary"
            className="absolute right-2 top-2 bg-black/50 text-white"
          >
            {proof.imageUrls.length} photos
          </Badge>
        )}
        {proof.source === "auto_vouch" && (
          <Badge
            variant="default"
            className="absolute left-2 top-2 bg-green-600"
          >
            Vouched
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Items */}
        <div className="space-y-1">
          {proof.items.slice(0, 3).map((item, index) => (
            <p
              key={index}
              className="text-sm text-muted-foreground line-clamp-1"
            >
              {item.deliveredLabel || item.name}
            </p>
          ))}
          {proof.items.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{proof.items.length - 3} more
            </p>
          )}
        </div>

        {/* Total & Time */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-gothic text-lg font-semibold text-accent">
            {formatCurrency(proof.totalAmount)}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(proof.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
