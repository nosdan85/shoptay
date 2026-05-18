"use client";

import { useState, useRef } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiDelete, apiUpload } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";

interface BannerUploaderProps {
  banners: string[];
  onBannersChange: (banners: string[]) => void;
  className?: string;
}

export function BannerUploader({ banners, onBannersChange, className }: BannerUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiUpload<{ url: string }>(
        `${API_ROUTES.CONFIG_BANNERS}/upload`,
        formData
      );

      onBannersChange([...banners, response.url]);
    } catch (error) {
      console.error("Failed to upload banner:", error);
      alert("Failed to upload banner");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (bannerUrl: string) => {
    if (!confirm("Delete this banner?")) return;

    try {
      await apiDelete(API_ROUTES.CONFIG_BANNERS, { data: { bannerUrl } });
      onBannersChange(banners.filter((b) => b !== bannerUrl));
    } catch (error) {
      console.error("Failed to delete banner:", error);
      alert("Failed to delete banner");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBanners = [...banners];
    const draggedItem = newBanners[draggedIndex];
    newBanners.splice(draggedIndex, 1);
    newBanners.splice(index, 0, draggedItem);
    onBannersChange(newBanners);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Banners</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {banners.map((banner, index) => (
            <div
              key={banner}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-video cursor-grab overflow-hidden rounded-lg border bg-secondary",
                draggedIndex === index && "opacity-50"
              )}
            >
              <img
                src={banner.startsWith("http") ? banner : `/api/banners/${banner}`}
                alt={`Banner ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => handleDelete(banner)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive/90 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Upload Button */}
        <div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? "Uploading..." : "Upload Banner"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Drag banners to reorder. Click the X to delete.
        </p>
      </CardContent>
    </Card>
  );
}
