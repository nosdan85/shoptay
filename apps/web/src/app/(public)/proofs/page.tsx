"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Proof } from "@/types";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProofGrid } from "@/components/proofs/proof-grid";
import { ProofModal } from "@/components/proofs/proof-modal";
import { ShieldCheck, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function ProofsPage() {
  const router = useRouter();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date>(new Date());

  const { user } = useAuthStore();

  const fetchProofs = useCallback(async () => {
    try {
      const response = await fetch(`/api/shop/proofs?limit=48&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setProofs(data.proofs || []);
        setLastFetched(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch proofs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkOwnerStatus = useCallback(async () => {
    if (!user?.discordId) {
      setIsOwner(false);
      return;
    }

    try {
      const response = await fetch("/api/shop/check-owner");
      if (response.ok) {
        const data = await response.json();
        setIsOwner(data.isOwner === true);
      }
    } catch {
      setIsOwner(false);
    }
  }, [user?.discordId]);

  useEffect(() => {
    fetchProofs();
    checkOwnerStatus();
  }, [fetchProofs, checkOwnerStatus]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchProofs, 15000);
    return () => clearInterval(interval);
  }, [fetchProofs]);

  // Refresh on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchProofs();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchProofs]);

  const handleDeleteProof = async (proofId: string) => {
    if (!confirm("Are you sure you want to delete this proof?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/shop/proofs/${proofId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProofs((prev) => prev.filter((p) => p.id !== proofId));
        if (selectedProof?.id === proofId) {
          setSelectedProof(null);
        }
      } else {
        alert("Failed to delete proof");
      }
    } catch (error) {
      console.error("Failed to delete proof:", error);
      alert("Failed to delete proof");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-4">
              <ShieldCheck className="mr-1 h-4 w-4" />
              Verified Deliveries
            </Badge>
            <h1 className="mb-4 font-gothic text-4xl font-bold md:text-6xl">
              Proof of Delivery
            </h1>
            <p className="mx-auto max-w-3xl font-serif text-muted-foreground">
              Every completed order is logged and verified. Browse through our
              delivery proofs to see real transactions from real customers.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  const vouchUrl = process.env.NEXT_PUBLIC_DISCORD_VOUCH_URL;
                  if (vouchUrl) {
                    window.open(vouchUrl, "_blank");
                  }
                }}
              >
                View Discord Vouch Channel
              </Button>
              <Button
                variant="outline"
                onClick={fetchProofs}
                disabled={isLoading}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            </div>
          </div>

          {/* Proof Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-border bg-secondary p-4"
                >
                  <Skeleton className="h-56 rounded-lg" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : proofs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No proofs yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {proofs.map((proof) => (
                <div
                  key={proof.id || (proof as any)._id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-secondary transition-all hover:border-border-medium hover:shadow-lg"
                  onClick={() => setSelectedProof(proof)}
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden bg-muted">
                    <img
                      src={proof.imageUrls[0] || "/proofs/placeholder.png"}
                      alt={`Proof for order ${proof.orderId}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {proof.imageUrls.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="absolute right-2 top-2 bg-black/50 text-white"
                      >
                        {proof.imageUrls.length} photos
                      </Badge>
                    )}
                    {isOwner && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute left-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProof(proof.id || (proof as any)._id);
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="space-y-1">
                      {proof.items.slice(0, 3).map((item, index) => (
                        <p
                          key={index}
                          className="text-sm text-muted-foreground line-clamp-1"
                        >
                          {item.deliveredLabel}
                        </p>
                      ))}
                      {proof.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{proof.items.length - 3} more
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-gothic text-lg font-semibold text-accent">
                        ${(proof.totalAmount / 100).toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        {new Date(proof.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Proof Modal */}
      <ProofModal
        proof={selectedProof}
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
      />
    </div>
  );
}
