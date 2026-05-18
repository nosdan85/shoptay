"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useShop } from "@/hooks/use-shop";
import { apiGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { BannerUploader } from "@/components/admin/banner-uploader";
import { BestSellerSelector } from "@/components/admin/best-seller-selector";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomepageAdminPage() {
  const router = useRouter();
  const { isOwner, isLoading: authLoading } = useAuth();
  const { products, fetchConfig } = useShop();
  const [banners, setBanners] = useState<string[]>([]);
  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push("/");
    }
  }, [authLoading, isOwner, router]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await apiGet(API_ROUTES.CONFIG);
        setBanners(response.banners || []);
        setBestSellerIds(response.bestSellerIds || []);
      } catch (error) {
        console.error("Failed to fetch config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOwner) {
      fetchConfig();
    }
  }, [isOwner]);

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
        <h1 className="mb-2 font-gothic text-3xl font-bold">Homepage</h1>
        <p className="text-muted-foreground">Customize your homepage content</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <BannerUploader
          banners={banners}
          onBannersChange={setBanners}
        />

        <BestSellerSelector
          products={products}
          selectedIds={bestSellerIds}
          onSelectionChange={setBestSellerIds}
        />
      </div>
    </div>
  );
}
