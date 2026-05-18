import Cookies from "js-cookie";
import { User } from "@/types";
import api, { apiGet, apiPost } from "./api";
import { API_ROUTES, DISCORD_OAUTH, getDiscordInviteUrl } from "./api-routes";

// Token management
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export interface DiscordTokenResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Get stored token
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || Cookies.get(TOKEN_KEY) || null;
}

// Set tokens
export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, tokens.token);
  Cookies.set(TOKEN_KEY, tokens.token, { expires: 7 });

  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { expires: 30 });
  }
}

// Clear tokens
export function clearTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

// Get stored user
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

// Set stored user
export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Login with Discord
export async function loginWithDiscord(code: string, redirectUri: string): Promise<DiscordTokenResponse> {
  const response = await apiPost<DiscordTokenResponse>(API_ROUTES.DISCORD_AUTH, {
    code,
    redirect_uri: redirectUri,
  });

  setTokens({
    token: response.token,
    refreshToken: response.refreshToken,
  });

  setStoredUser(response.user);

  return response;
}

// Check if user is owner
export async function checkOwner(): Promise<boolean> {
  try {
    const response = await api.get<{ isOwner: boolean }>(API_ROUTES.CHECK_OWNER);
    return response.data?.isOwner ?? false;
  } catch {
    return false;
  }
}

// Refresh token
export async function refreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const response = await apiPost<{ token: string }>("/api/shop/auth/refresh", {
      refreshToken,
    });

    setTokens({ token: response.token, refreshToken });
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// Get OAuth URL for web flow
export function getOAuthUrl(): string {
  const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || window.location.origin + "/auth/discord/callback";
  const state = generateState();
  sessionStorage.setItem("oauth_state", state);
  return DISCORD_OAUTH.getAuthorizeUrl(redirectUri, state);
}

// Get OAuth URL for app flow (mobile)
export function getOAuthAppUrl(): string {
  const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || window.location.origin + "/auth/discord/callback";
  return DISCORD_OAUTH.getAppAuthorizeUrl(redirectUri);
}

// Verify OAuth state
export function verifyState(state: string): boolean {
  if (typeof window === "undefined") return false;
  const storedState = sessionStorage.getItem("oauth_state");
  return storedState === state;
}

// Generate random state for OAuth
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Get Discord invite link
export function getDiscordLink(): string {
  return getDiscordInviteUrl();
}

// Open Discord link
export function openDiscordLink(linkMethod?: "web" | "app"): void {
  const url = getDiscordLink();

  if (linkMethod === "app" || (typeof window !== "undefined" && /mobile|android|iphone/i.test(navigator.userAgent))) {
    // Try app protocol first
    const appUrl = getOAuthAppUrl();
    const opened = window.open(appUrl, "_blank");

    if (!opened) {
      // Fallback to web
      window.open(url, "_blank");
    }
  } else {
    window.open(url, "_blank");
  }
}

// Initialize auth state from storage
export function initializeAuth(): { token: string | null; user: User | null } {
  const token = getToken();
  const user = getStoredUser();
  return { token, user };
}

// Logout
export function logout(): void {
  clearTokens();
  window.location.href = "/";
}

// Set link method for Discord linking
export function setDiscordLinkMethod(method: "web" | "app"): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("discordLinkMethod", method);
  }
}

// Get Discord link method
export function getDiscordLinkMethod(): "web" | "app" {
  if (typeof window === "undefined") return "web";
  return (localStorage.getItem("discordLinkMethod") as "web" | "app") || "web";
}
