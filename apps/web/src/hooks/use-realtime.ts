"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth-store";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const NAMESPACE = "/realtime";

export interface StockUpdate {
  productId: string;
  stock: number;
  productName?: string;
  timestamp: number;
}

export interface OrderUpdate {
  orderId: string;
  orderNumber: string;
  userId: string;
  status: string;
  timestamp: number;
}

export interface NewPurchase {
  discordUsername: string;
  productName: string;
  totalAmount: number;
  orderNumber: string;
  timestamp: number;
}

export interface UserNotification {
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected: Date | null;
  socketId: string | null;
}

export function useRealtimeConnection() {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastConnected: null,
    socketId: null,
  });

  const { token } = useAuthStore();

  useEffect(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      auth: {
        token: token || undefined,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        lastConnected: new Date(),
        socketId: socket.id || null,
      }));
    });

    socket.on("disconnect", () => {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    });

    socket.on("connect_error", () => {
      setConnectionState((prev) => ({
        ...prev,
        isReconnecting: true,
      }));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  return {
    socket: socketRef.current,
    ...connectionState,
    disconnect,
    reconnect,
  };
}

export function useStockUpdates(productId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      if (productId) {
        socket.emit("subscribe:product", productId);
      } else {
        socket.emit("subscribe:products");
      }
    });

    socket.on("stock:update", (data: StockUpdate) => {
      setStockUpdates((prev) => [data, ...prev.slice(0, 49)]);
    });

    socketRef.current = socket;

    return () => {
      if (productId) {
        socket.emit("unsubscribe:product", productId);
      } else {
        socket.emit("unsubscribe:products");
      }
      socket.disconnect();
    };
  }, [productId]);

  const latestUpdate = stockUpdates[0] || null;

  return {
    stockUpdates,
    latestUpdate,
    isConnected,
  };
}

export function useOrderUpdates() {
  const socketRef = useRef<Socket | null>(null);
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([]);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!user?.discordId || !token) return;

    const socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      socket.emit("subscribe:orders", user.discordId);
    });

    socket.on("order:update", (data: OrderUpdate) => {
      setOrderUpdates((prev) => [data, ...prev.slice(0, 49)]);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("unsubscribe:orders", user.discordId);
      socket.disconnect();
    };
  }, [user?.discordId, token]);

  const latestUpdate = orderUpdates[0] || null;

  return {
    orderUpdates,
    latestUpdate,
  };
}

export function useNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!user?.discordId || !token) return;

    const socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      socket.emit("subscribe:notifications");
    });

    socket.on("notification", (data: UserNotification) => {
      setNotifications((prev) => [data, ...prev.slice(0, 99)]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user?.discordId, token]);

  const markAsRead = useCallback((notificationIds: string[]) => {
    socketRef.current?.emit("notifications:mark-read", { notificationIds });
    setNotifications((prev) =>
      prev.filter((n) => !notificationIds.includes(`${n.timestamp}`))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const latestNotification = notifications[0] || null;
  const unreadCount = notifications.length;

  return {
    notifications,
    latestNotification,
    unreadCount,
    markAsRead,
    clearAll,
  };
}

export function useNewPurchases() {
  const socketRef = useRef<Socket | null>(null);
  const [purchases, setPurchases] = useState<NewPurchase[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("subscribe:purchases");
    });

    socket.on("purchase:new", (data: NewPurchase) => {
      setPurchases((prev) => [data, ...prev.slice(0, 29)]);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("unsubscribe:purchases");
      socket.disconnect();
    };
  }, []);

  const latestPurchase = purchases[0] || null;

  return {
    purchases,
    latestPurchase,
    isConnected,
  };
}

export function useRealtimeAdmin() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    const socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      socket.emit("admin:join");
    });

    socketRef.current = socket;

    return () => {
      socket.emit("admin:leave");
      socket.disconnect();
    };
  }, [token]);

  const emitStockUpdate = useCallback((data: StockUpdate) => {
    socketRef.current?.emit("stock:broadcast", data);
  }, []);

  const emitOrderUpdate = useCallback((data: OrderUpdate) => {
    socketRef.current?.emit("order:broadcast", data);
  }, []);

  const emitNewPurchase = useCallback((data: NewPurchase) => {
    socketRef.current?.emit("purchase:broadcast", data);
  }, []);

  return {
    emitStockUpdate,
    emitOrderUpdate,
    emitNewPurchase,
  };
}
