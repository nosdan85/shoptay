"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SlotManager } from "@/components/admin/slot-manager";
import { Skeleton } from "@/components/ui/skeleton";

export default function SlotsAdminPage() {
  const router = useRouter();
  const { isOwner, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push("/");
    }
  }, [authLoading, isOwner, router]);

  if (authLoading || !isOwner) {
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="mb-2 font-gothic text-3xl font-bold">Delivery Slots</h1>
        <p className="text-muted-foreground">Manage delivery time slots</p>
      </div>

      <SlotManager />
    </div>
  );
}
