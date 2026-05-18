"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useShop } from "@/hooks/use-shop";
import { apiGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Product } from "@/types";
import { ProductForm } from "@/components/admin/product-form";
import { OrderTable } from "@/components/admin/order-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsAdminPage() {
  const router = useRouter();
  const { isOwner, isLoading: authLoading } = useAuth();
  const { games, fetchProducts } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push("/");
    }
  }, [authLoading, isOwner, router]);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const response = await apiGet<{ products: Product[] }>(API_ROUTES.ADMIN_PRODUCTS);
        setProducts(response.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOwner) {
      fetchProductsData();
    }
  }, [isOwner]);

  const handleSave = async () => {
    const response = await apiGet<{ products: Product[] }>(API_ROUTES.ADMIN_PRODUCTS);
    setProducts(response.products || []);
    setEditingProduct(null);
    fetchProducts(); // Refresh shop store
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await apiGet(`${API_ROUTES.ADMIN_PRODUCTS}/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  };

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
        <h1 className="mb-2 font-gothic text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Manage your product catalog</p>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Products</TabsTrigger>
          <TabsTrigger value="form">{editingProduct ? "Edit Product" : "Add Product"}</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bulk Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded border">
                      <img
                        src={product.image.startsWith("http") ? product.image : `/api/shop/product-images/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {product.bulkPrice ? formatCurrency(product.bulkPrice) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="form">
          <ProductForm
            product={editingProduct}
            games={games}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
