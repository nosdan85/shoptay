"use client";

import { useMemo } from "react";
import { Proof } from "@/types";
import { ProofCard } from "./proof-card";

interface ProofGridProps {
  proofs: Proof[];
  onOpenProof: (proof: Proof) => void;
  isLoading?: boolean;
  className?: string;
}

export function ProofGrid({
  proofs,
  onOpenProof,
  isLoading,
  className,
}: ProofGridProps) {
  const sortedProofs = useMemo(
    () =>
      [...proofs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [proofs]
  );

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-border bg-secondary p-4"
            >
              <div className="h-56 rounded-lg bg-muted" />
              <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className={className}>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No proofs yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sortedProofs.map((proof) => (
          <ProofCard key={proof._id || proof.id} proof={proof} onOpen={() => onOpenProof(proof)} />
        ))}
      </div>
    </div>
  );
}
