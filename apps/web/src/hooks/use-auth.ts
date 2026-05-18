"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export interface AuthUser {
  id: string;
  discordId: string;
  discordUsername: string;
  username?: string;
  email?: string;
  avatar?: string;
  role?: string;
  isOwner?: boolean;
}

export function useAuth() {
  const {
    user,
    token,
    isOwner,
    isLoading,
    isInitialized,
    refreshToken: storedRefreshToken,
    setUser,
    setToken,
    setRefreshToken,
    loginDiscord,
    logout: storeLogout,
    checkOwner,
    initialize,
    fetchUser,
  } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const isAuthenticated = !!token && !!user;

  return {
    user,
    token,
    isOwner,
    isLoading,
    isInitialized,
    isAuthenticated,
    loginDiscord,
    logout: storeLogout,
    checkOwner,
    setUser,
    setToken,
    setRefreshToken,
    fetchUser,
  };
}

/**
 * Hook to require authentication - redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [isInitialized, isAuthenticated, redirectTo, pathname, router]);

  return {
    isAuthenticated,
    isInitialized,
    isLoading: !isInitialized,
  };
}

/**
 * Hook to require owner access - redirects to home if not owner
 */
export function useRequireOwner(redirectTo = "/") {
  const router = useRouter();
  const pathname = usePathname();
  const { isOwner, isAuthenticated, isInitialized } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isInitialized && !hasRedirected.current) {
      if (!isAuthenticated) {
        hasRedirected.current = true;
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
      } else if (!isOwner) {
        hasRedirected.current = true;
        router.push(redirectTo);
      }
    }
  }, [isInitialized, isOwner, isAuthenticated, redirectTo, pathname, router]);

  return {
    isOwner,
    isAuthenticated,
    isInitialized,
    isLoading: !isInitialized,
  };
}

/**
 * Hook to get auth state without redirects
 */
export function useAuthState() {
  const { user, token, isOwner, isAuthenticated, isInitialized } = useAuth();

  return {
    user,
    token,
    isOwner,
    isAuthenticated,
    isInitialized,
  };
}

/**
 * Hook for conditional auth checks (no redirects)
 */
export function useOptionalAuth() {
  const {
    user,
    token,
    isOwner,
    isAuthenticated,
    isLoading,
    isInitialized,
    initialize,
  } = useAuth();

  return {
    user,
    token,
    isOwner,
    isAuthenticated,
    isLoading: isLoading || !isInitialized,
    isInitialized,
    initialize,
  };
}
