"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import type {
  AdminDashboardStats,
  AdminOrder,
  AdminUser,
  AdminTopup,
} from "@shared/types/wallet";

export interface UseAdminStatsReturn {
  stats: AdminDashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGet<AdminDashboardStats>(API_ROUTES.ADMIN_STATS);
      setStats(data);
    } catch (err) {
      setError("Failed to load dashboard stats");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

export interface UseAdminOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface UseAdminOrdersReturn {
  orders: AdminOrder[];
  isLoading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
}

export function useAdminOrders(options: UseAdminOrdersOptions = {}) {
  const { page = 1, limit = 20, status, search } = options;
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await apiGet<{
        data: AdminOrder[];
        meta: typeof meta;
      }>(API_ROUTES.ADMIN_ORDERS, params);
      
      setOrders(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError("Failed to load orders");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    meta,
    refetch: fetchOrders,
  };
}

export interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UseAdminUsersReturn {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const { page = 1, limit = 20, search } = options;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;

      const response = await apiGet<{
        data: AdminUser[];
        meta: typeof meta;
      }>(API_ROUTES.ADMIN_USERS, params);
      
      setUsers(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    meta,
    refetch: fetchUsers,
  };
}

export interface UseAdminTopupsOptions {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
}

export interface UseAdminTopupsReturn {
  topups: AdminTopup[];
  isLoading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
}

export function useAdminTopups(options: UseAdminTopupsOptions = {}) {
  const { page = 1, limit = 20, status, method } = options;
  const [topups, setTopups] = useState<AdminTopup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchTopups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;
      if (method) params.method = method;

      const response = await apiGet<{
        data: AdminTopup[];
        meta: typeof meta;
      }>(API_ROUTES.ADMIN_TOPUPS, params);
      
      setTopups(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError("Failed to load topups");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, method]);

  useEffect(() => {
    fetchTopups();
  }, [fetchTopups]);

  return {
    topups,
    isLoading,
    error,
    meta,
    refetch: fetchTopups,
  };
}

export interface UseWalletAdminReturn {
  pendingTopups: AdminTopup[];
  allTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    orderId: string | null;
    user: { username: string; discordId: string };
    createdAt: Date;
  }>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWalletAdmin() {
  const [pendingTopups, setPendingTopups] = useState<AdminTopup[]>([]);
  const [allTransactions, setAllTransactions] = useState<Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    orderId: string | null;
    user: { username: string; discordId: string };
    createdAt: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [topupsRes, transactionsRes] = await Promise.all([
        apiGet<{ data: AdminTopup[] }>(API_ROUTES.WALLET_ADMIN_TOPUPS, { page: 1, limit: 50 }),
        apiGet<{ data: typeof allTransactions }>(API_ROUTES.WALLET_ADMIN_TRANSACTIONS, { page: 1, limit: 100 }),
      ]);

      setPendingTopups(topupsRes.data);
      setAllTransactions(transactionsRes.data);
    } catch (err) {
      setError("Failed to load wallet admin data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    pendingTopups,
    allTransactions,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export async function approveTopup(topupId: string): Promise<{ success: boolean }> {
  return apiPost(API_ROUTES.ADMIN_TOPUP_APPROVE(topupId), {});
}

export async function rejectTopup(topupId: string, reason?: string): Promise<{ success: boolean }> {
  return apiPost(API_ROUTES.ADMIN_TOPUP_REJECT(topupId), { reason });
}

export async function adjustUserBalance(
  userId: string,
  amountCents: number,
  note?: string
): Promise<{
  success: boolean;
  previousBalance: number;
  adjustment: number;
  newBalance: number;
}> {
  return apiPost(API_ROUTES.WALLET_ADMIN_ADJUST, { userId, amountCents, note });
}

export async function markOrderPaid(
  orderId: string,
  txnId?: string,
  note?: string
): Promise<{ success: boolean }> {
  return apiPost(API_ROUTES.ADMIN_ORDER_MARK_PAID(orderId), { txnId, note });
}

export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<{ success: boolean }> {
  return apiPost(API_ROUTES.ADMIN_ORDER_CANCEL(orderId), { reason });
}
