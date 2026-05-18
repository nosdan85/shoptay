"use client";

import { useState, useEffect } from "react";
import { Product, Game } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Image as ImageIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPost, apiPut, apiGet, apiUpload } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";

interface ProductFormProps {
  product?: Product | null;
  games: Game[];
  onSave: () => void;
  className?: string;
}

export function ProductForm({ product, games, onSave, className }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState(product?.image || "");

  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product ? (product.price / 100).toString() : "",
    bulkPrice: product?.bulkPrice ? (product.bulkPrice / 100).toString() : "",
    category: product?.category || "Chest",
    gameId: product?.gameId || "",
    desc: product?.desc || "",
  });

  useEffect(() => {
    // Fetch uploaded images
    const fetchImages = async () => {
      try {
        const response = await apiGet<{ images: string[] }>(API_ROUTES.ADMIN_PRODUCT_IMAGES);
        setImages(response.images || []);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    };
    fetchImages();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (image: string) => {
    setSelectedImage(image);
    setFormData((prev) => ({ ...prev, image }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      const response = await apiUpload<{ url: string }>(
        `${API_ROUTES.ADMIN_PRODUCT_IMAGES}/upload`,
        formData
      );
      setImages((prev) => [...prev, response.url]);
      setSelectedImage(response.url);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }

    const priceInCents = Math.round(parseFloat(formData.price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const bulkPriceInCents = formData.bulkPrice
      ? Math.round(parseFloat(formData.bulkPrice) * 100)
      : undefined;

    try {
      setIsLoading(true);
      const payload = {
        name: formData.name.trim(),
        price: priceInCents,
        bulkPrice: bulkPriceInCents,
        category: formData.category,
        gameId: formData.gameId || undefined,
        desc: formData.desc.trim() || undefined,
        image: selectedImage,
      };

      if (product) {
        await apiPut(`${API_ROUTES.ADMIN_PRODUCTS}/${product._id}`, payload);
      } else {
        await apiPost(API_ROUTES.ADMIN_PRODUCTS, payload);
      }

      onSave();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Add Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Product name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="9.99"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPrice">Bulk Price</Label>
                  <Input
                    id="bulkPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bulkPrice}
                    onChange={(e) => handleChange("bulkPrice", e.target.value)}
                    placeholder="7.99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleChange("category", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chest">Chest</SelectItem>
                      <SelectItem value="Reroll">Reroll</SelectItem>
                      <SelectItem value="Shard">Shard</SelectItem>
                      <SelectItem value="Seal">Seal</SelectItem>
                      <SelectItem value="Relic">Relic</SelectItem>
                      <SelectItem value="Sets">Sets</SelectItem>
                      <SelectItem value="Combo">Combo</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Game</Label>
                  <Select
                    value={formData.gameId}
                    onValueChange={(val) => handleChange("gameId", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select game" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Game</SelectItem>
                      {games.map((game) => (
                        <SelectItem key={game._id} value={game._id}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={formData.desc}
                  onChange={(e) => handleChange("desc", e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Image</Label>
                {selectedImage && (
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-secondary">
                    <img
                      src={selectedImage.startsWith("http") ? selectedImage : `/api/shop/product-images/${selectedImage}`}
                      alt="Selected"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Choose from Library</Label>
                <ScrollArea className="h-[200px] rounded-lg border">
                  <div className="grid grid-cols-4 gap-2 p-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleImageSelect(image)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded border",
                          selectedImage === image && "border-accent ring-2 ring-accent"
                        )}
                      >
                        <img
                          src={image.startsWith("http") ? image : `/api/shop/product-images/${image}`}
                          alt={`Image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  disabled={isLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : product ? "Update Product" : "Add Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
