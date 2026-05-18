"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiGet, apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { StatsCards } from "@/components/admin/stats-cards";
import { OrderTable } from "@/components/admin/order-table";
import { SlotManager } from "@/components/admin/slot-manager";
import { ProductForm } from "@/components/admin/product-form";
import { GameForm } from "@/components/admin/game-form";
import { BannerUploader } from "@/components/admin/banner-uploader";
import { BestSellerSelector } from "@/components/admin/best-seller-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Check, X, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order } from "@/types";
import type { AdminDashboardStats, AdminTopup } from "@shared/types/wallet";

type AdminTab = "orders" | "topups" | "slots" | "products" | "games" | "homepage";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isOwner, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingTopups, setPendingTopups] = useState<AdminTopup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push("/");
    }
  }, [authLoading, isOwner, router]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, topupsRes] = await Promise.all([
        apiGet<AdminDashboardStats>(API_ROUTES.ADMIN_STATS),
        apiGet<{ data: AdminTopup[] }>(API_ROUTES.ADMIN_TOPUPS, { status: "PENDING", limit: 100 }),
      ]);

      setStats(statsRes);
      setPendingTopups(topupsRes.data);
      
      const ordersRes = await apiGet<{ data: Order[] }>(API_ROUTES.ADMIN_ORDERS, { limit: 100 });
      setOrders(ordersRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) {
      fetchData();
    }
  }, [isOwner, fetchData]);

  const handleApproveTopup = async (topupId: string) => {
    setProcessingId(topupId);
    try {
      await apiPost(API_ROUTES.ADMIN_TOPUP_APPROVE(topupId), {});
      await fetchData();
    } catch (error) {
      console.error("Failed to approve topup:", error);
      alert("Failed to approve topup");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTopup = async (topupId: string, reason?: string) => {
    setProcessingId(topupId);
    try {
      await apiPost(API_ROUTES.ADMIN_TOPUP_REJECT(topupId), { reason });
      await fetchData();
    } catch (error) {
      console.error("Failed to reject topup:", error);
      alert("Failed to reject topup");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkPaid = async (orderId: string, txnId?: string) => {
    setProcessingId(orderId);
    try {
      await apiPost(API_ROUTES.ADMIN_ORDER_MARK_PAID(orderId), { txnId });
      await fetchData();
    } catch (error) {
      console.error("Failed to mark order paid:", error);
      alert("Failed to mark order as paid");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string, reason?: string) => {
    setProcessingId(orderId);
    try {
      await apiPost(API_ROUTES.ADMIN_ORDER_CANCEL(orderId), { reason });
      await fetchData();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      !searchQuery ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.discordUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.txnId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !isOwner) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="mb-2 font-gothic text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your orders, topups, and store</p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="topups">
            Topups
            {pendingTopups.length > 0 && (
              <Badge variant="warning" className="ml-2">
                {pendingTopups.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="slots">Slots</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-gothic text-xl font-semibold">All Orders</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <OrderTable
            orders={filteredOrders}
            isLoading={isLoading}
            onMarkPaid={handleMarkPaid}
            onCancel={handleCancelOrder}
          />
        </TabsContent>

        {/* Topups Tab */}
        <TabsContent value="topups" className="space-y-4">
          <h2 className="font-gothic text-xl font-semibold">Pending Topups</h2>
          {pendingTopups.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending topups
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingTopups.map((topup) => (
                <Card key={topup.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {topup.user?.username || topup.user?.discordId || "Unknown User"}
                          </p>
                          <Badge variant="warning">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {topup.user?.discordId && `Discord: ${topup.user.discordId}`}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {topup.referenceCode || `TOP-${topup.id.slice(-8).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(topup.createdAt)}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-xl font-bold font-gothic text-green-500">
                          +{formatCurrency(Math.round(topup.amount * 100))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Method: {topup.method}
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApproveTopup(topup.id)}
                            disabled={processingId === topup.id}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectTopup(topup.id)}
                            disabled={processingId === topup.id}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Slots Tab */}
        <TabsContent value="slots" className="space-y-4">
          <h2 className="font-gothic text-xl font-semibold">Delivery Slots</h2>
          <SlotManager />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <h2 className="font-gothic text-xl font-semibold">Products</h2>
          <ProductForm onSuccess={fetchData} />
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <h2 className="font-gothic text-xl font-semibold">Games</h2>
          <GameForm />
        </TabsContent>

        {/* Homepage Tab */}
        <TabsContent value="homepage" className="space-y-4">
          <h2 className="font-gothic text-xl font-semibold">Homepage Settings</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Banners</CardTitle>
              </CardHeader>
              <CardContent>
                <BannerUploader />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Best Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <BestSellerSelector />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
