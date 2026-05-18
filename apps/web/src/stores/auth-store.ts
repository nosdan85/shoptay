import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";

export interface AuthUser {
  id: string;
  discordId: string;
  discordUsername: string;
  username?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isOwner: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  loginDiscord: (userData: AuthUser, token: string, refreshToken?: string) => void;
  logout: () => void;
  checkOwner: () => Promise<void>;
  initialize: () => void;
  fetchUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isOwner: false,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => {
        set({ user });
        if (user?.discordId) {
          get().checkOwner();
        }
      },

      setToken: (token) => {
        set({ token });
        if (token) {
          if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", token);
          }
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
          }
          delete api.defaults.headers.common.Authorization;
        }
      },

      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
        if (refreshToken) {
          if (typeof window !== "undefined") {
            localStorage.setItem("refresh_token", refreshToken);
          }
        } else {
          if (typeof window !== "undefined") {
            localStorage.removeItem("refresh_token");
          }
        }
      },

      loginDiscord: (userData, token, refreshToken) => {
        set({
          user: userData,
          token,
          refreshToken: refreshToken || null,
          isLoading: false,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(userData));
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
        }

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        get().checkOwner();
      },

      logout: () => {
        // Call logout endpoint if authenticated
        const { token } = get();
        if (token && typeof window !== "undefined") {
          api.post("/api/shop/auth/logout").catch(() => {
            // Ignore errors
          });
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          isOwner: false,
        });

        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("auth_user");
        }

        delete api.defaults.headers.common.Authorization;
      },

      checkOwner: async () => {
        const { user, token } = get();
        if (!user?.discordId || !token) {
          set({ isOwner: false });
          return;
        }

        try {
          const response = await api.get<{ isOwner: boolean }>(API_ROUTES.CHECK_OWNER);
          set({ isOwner: response.data?.isOwner ?? false });
        } catch {
          set({ isOwner: false });
        }
      },

      initialize: () => {
        if (typeof window === "undefined") return;

        const storedToken = localStorage.getItem("auth_token");
        const storedRefreshToken = localStorage.getItem("refresh_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken) {
          api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
          set({ token: storedToken, isInitialized: true });
        }

        if (storedRefreshToken) {
          set({ refreshToken: storedRefreshToken });
        }

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser) as AuthUser;
            set({ user });
            get().checkOwner();
          } catch {
            // Invalid stored user
          }
        }

        set({ isInitialized: true });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });

        try {
          const response = await api.get<AuthUser>("/api/shop/auth/me");
          const user = response.data;

          set({ user, isLoading: false });

          if (typeof window !== "undefined") {
            localStorage.setItem("auth_user", JSON.stringify(user));
          }

          // Check owner status
          get().checkOwner();
        } catch (error) {
          set({ isLoading: false });

          // If unauthorized, clear auth state
          if ((error as { status?: number }).status === 401) {
            get().logout();
          }
        }
      },

      refreshToken: async () => {
        const { refreshToken: currentRefreshToken } = get();
        if (!currentRefreshToken) return false;

        try {
          const response = await api.post<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
          }>("/api/shop/auth/refresh", {
            refreshToken: currentRefreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          set({
            token: accessToken,
            refreshToken: newRefreshToken,
          });

          if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", accessToken);
            localStorage.setItem("refresh_token", newRefreshToken);
          }

          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

          return true;
        } catch {
          // Refresh failed - clear auth
          get().logout();
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isOwner: state.isOwner,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => !!state.token && !!state.user;
export const selectIsOwner = (state: AuthState) => state.isOwner;
