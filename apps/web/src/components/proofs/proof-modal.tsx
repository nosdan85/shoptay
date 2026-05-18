"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Proof } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface ProofModalProps {
  proof: Proof | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProofModal({ proof, isOpen, onClose }: ProofModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentImageIndex(0);
    }
  }, [isOpen]);

  if (!proof) return null;

  const goToPrev = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? proof.imageUrls.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === proof.imageUrls.length - 1 ? 0 : prev + 1
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, proof]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl p-0">
        <DialogHeader className="absolute left-4 top-4 z-10 flex-row gap-2">
          <DialogTitle>Order Proof</DialogTitle>
          {proof.source === "auto_vouch" && (
            <Badge variant="default" className="bg-green-600">
              Vouched
            </Badge>
          )}
        </DialogHeader>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Image Viewer */}
          <div className="relative bg-black md:col-span-3">
            <div className="aspect-square md:aspect-auto md:h-[600px]">
              {proof.imageUrls[currentImageIndex] ? (
                <Image
                  src={proof.imageUrls[currentImageIndex]}
                  alt={`Proof image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  No image available
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            {proof.imageUrls.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-70 transition-opacity hover:bg-black/70 hover:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-70 transition-opacity hover:bg-black/70 hover:opacity-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                  {currentImageIndex + 1} / {proof.imageUrls.length}
                </div>
              </>
            )}
          </div>

          {/* Info Panel */}
          <div className="flex flex-col p-6 md:col-span-2">
            <div className="space-y-4">
              {/* Total */}
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-gothic text-3xl font-bold text-accent">
                  {formatCurrency(proof.totalAmount)}
                </p>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Items</p>
                <div className="space-y-2">
                  {proof.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-secondary p-3"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.deliveredLabel || `${item.packQuantity || 1}x`}
                        </p>
                      </div>
                      <p className="font-mono text-sm">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Meta */}
              <div className="space-y-2 text-sm">
                {proof.discordUsername && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span>{proof.discordUsername}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono">{proof.orderId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span>{proof.imageUrls.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge variant="outline">{proof.source}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
