import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL } from "./api-routes";

// Constants for retry logic
const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 15000;
const MAX_RETRIES = 2;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Add a subscriber to wait for token refresh
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that a new token is available
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number, baseDelay: number = BASE_RETRY_DELAY_MS): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), MAX_RETRY_DELAY_MS);
  return delay;
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retry-able
 */
function isRetryableError(error: AxiosError): boolean {
  // Network errors (no response)
  if (!error.response) {
    return true;
  }

  const status = error.response.status;

  // 429 Too Many Requests
  if (status === 429) {
    return true;
  }

  // 503 Service Unavailable
  if (status === 503) {
    return true;
  }

  // 502 Bad Gateway
  if (status === 502) {
    return true;
  }

  // 504 Gateway Timeout
  if (status === 504) {
    return true;
  }

  // Timeout
  if (error.code === "ECONNABORTED") {
    return true;
  }

  return false;
}

/**
 * Get retry delay from response headers or body
 */
function getRetryAfterMs(error: AxiosError): number | null {
  // Check Retry-After header
  const retryAfterHeader = error.response?.headers?.["retry-after"];
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }
  }

  // Check response data for retry info
  const data = error.response?.data as { retryAfterMs?: number; retryAfterSeconds?: number; retry_after?: number } | undefined;
  if (data) {
    if (data.retryAfterMs) {
      return data.retryAfterMs;
    }
    if (data.retryAfterSeconds) {
      return data.retryAfterSeconds * 1000;
    }
    if (data.retry_after) {
      return data.retry_after * 1000;
    }
  }

  return null;
}

/**
 * Refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/shop/auth/refresh`,
      { refreshToken },
      { timeout: 10000 }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Store new tokens
    localStorage.setItem("auth_token", accessToken);
    if (newRefreshToken) {
      localStorage.setItem("refresh_token", newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    // Refresh failed - clear auth
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    return null;
  }
}

/**
 * Request interceptor - add auth token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      // Try to get token from localStorage first
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle errors and token refresh
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number; _sent?: boolean };

    // Prevent infinite loops
    if (!originalRequest || originalRequest._sent) {
      return Promise.reject(formatError(error));
    }

    // Handle 401 - token expired or invalid
    if (error.response?.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;

          if (newToken) {
            // Update authorization header
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            originalRequest._sent = true;

            // Notify waiting requests
            onTokenRefreshed(newToken);

            // Retry the original request
            return api(originalRequest);
          } else {
            // Refresh failed - redirect to login
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      } else {
        // Wait for token refresh to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest._sent = true;
            resolve(api(originalRequest));
          });
        });
      }

      return Promise.reject(formatError(error));
    }

    // For retryable errors, attempt retry with exponential backoff
    if (isRetryableError(error)) {
      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;

        // Get retry delay from response or use exponential backoff
        const retryAfterMs = getRetryAfterMs(error);
        const delay = retryAfterMs || getRetryDelay(originalRequest._retryCount);

        console.log(`Retrying request (attempt ${originalRequest._retryCount}/${MAX_RETRIES}) in ${delay}ms`);

        await sleep(delay);

        originalRequest._sent = true;
        return api(originalRequest);
      }
    }

    return Promise.reject(formatError(error));
  }
);

/**
 * Format error for consistent API response
 */
function formatError(error: AxiosError): {
  message: string;
  code: string;
  status: number | undefined;
  data: any;
  retryAfterMs?: number;
} {
  // Get retry info if available
  const retryAfterMs = getRetryAfterMs(error);

  // Handle network errors
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return {
        message: "Request timeout. Please try again.",
        code: "ECONNABORTED",
        status: undefined,
        data: null,
        retryAfterMs: getRetryDelay(1),
      };
    }

    return {
      message: "Network error. Please check your connection.",
      code: "NETWORK_ERROR",
      status: undefined,
      data: null,
    };
  }

  // Format error from response data
  const errorData = error.response?.data as {
    message?: string | string[];
    error?: string;
    statusCode?: number;
    retryAfterMs?: number;
    retryAfterSeconds?: number;
  } | undefined;

  let message = "An unexpected error occurred";

  if (errorData?.message) {
    if (Array.isArray(errorData.message)) {
      message = errorData.message[0];
    } else {
      message = errorData.message;
    }
  } else if (errorData?.error) {
    message = errorData.error;
  } else if (error.message) {
    message = error.message;
  }

  return {
    message,
    code: error.response?.status?.toString() || "UNKNOWN",
    status: error.response?.status,
    data: errorData,
    retryAfterMs,
  };
}

// Helper methods for common requests
export const apiGet = async <T>(
  url: string,
  params?: Record<string, unknown>,
  options?: { timeout?: number }
): Promise<T> => {
  const response = await api.get<T>(url, { params, ...options });
  return response.data;
};

export const apiPost = async <T>(
  url: string,
  data?: unknown,
  options?: { timeout?: number }
): Promise<T> => {
  const response = await api.post<T>(url, data, options);
  return response.data;
};

export const apiPut = async <T>(
  url: string,
  data?: unknown,
  options?: { timeout?: number }
): Promise<T> => {
  const response = await api.put<T>(url, data, options);
  return response.data;
};

export const apiPatch = async <T>(
  url: string,
  data?: unknown,
  options?: { timeout?: number }
): Promise<T> => {
  const response = await api.patch<T>(url, data, options);
  return response.data;
};

export const apiDelete = async <T>(
  url: string,
  options?: { timeout?: number }
): Promise<T> => {
  const response = await api.delete<T>(url, options);
  return response.data;
};

// Multipart form data helper
export const apiUpload = async <T>(
  url: string,
  formData: FormData,
  options?: { timeout?: number }
): Promise<T> => {
  const response = await api.post<T>(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    ...options,
  });
  return response.data;
};

// Retry-aware auth request with exponential backoff
export const apiAuthWithRetry = async <T>(
  url: string,
  data?: { code: string; redirect_uri?: string },
  options?: { timeout?: number }
): Promise<T> => {
  const maxRetries = MAX_RETRIES;
  let attempt = 0;
  let delay = BASE_RETRY_DELAY_MS;

  while (attempt <= maxRetries) {
    try {
      const response = await api.post<T>(url, data, {
        timeout: options?.timeout || 15000,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Check if retryable
      if (isRetryableError(axiosError)) {
        attempt++;

        if (attempt <= maxRetries) {
          console.log(`Auth request retry ${attempt}/${maxRetries} in ${delay}ms`);

          const retryAfterMs = getRetryAfterMs(axiosError);
          if (retryAfterMs) {
            await sleep(retryAfterMs);
          } else {
            await sleep(delay);
            delay = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
          }
          continue;
        }
      }

      throw formatError(axiosError);
    }
  }

  throw new Error("Max retries exceeded");
};

export default api;
