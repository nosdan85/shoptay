"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const NAMESPACE = "/realtime";

interface LiveIndicatorProps {
  className?: string;
  showTimestamp?: boolean;
  autoReconnect?: boolean;
}

export function LiveIndicator({
  className,
  showTimestamp = true,
  autoReconnect = true,
}: LiveIndicatorProps) {
  const [status, setStatus] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      transports: ["websocket", "polling"],
      reconnection: autoReconnect,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      setStatus("connected");
      setLastUpdate(new Date());
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    socket.on("connect_error", () => {
      setStatus("reconnecting");
    });

    socket.on("stock:update", () => {
      setLastUpdate(new Date());
    });

    socket.on("purchase:new", () => {
      setLastUpdate(new Date());
    });

    socketRef.current = socket;
  }, [autoReconnect]);

  useEffect(() => {
    connect();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [connect]);

  useEffect(() => {
    if (!lastUpdate || !showTimestamp) return;

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 5) {
        setTimeSinceUpdate("just now");
      } else if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceUpdate(`${minutes}m ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate, showTimestamp]);

  const handleManualReconnect = () => {
    socketRef.current?.disconnect();
    setStatus("reconnecting");
    setTimeout(connect, 100);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs",
        status === "connected" && "text-green-500",
        status === "reconnecting" && "text-yellow-500",
        status === "disconnected" && "text-red-500",
        className
      )}
    >
      {status === "connected" && <Wifi className="h-3 w-3" />}
      {status === "reconnecting" && (
        <RefreshCw className="h-3 w-3 animate-spin" />
      )}
      {status === "disconnected" && <WifiOff className="h-3 w-3" />}
      
      <span>
        {status === "connected" && "Live"}
        {status === "reconnecting" && "Reconnecting..."}
        {status === "disconnected" && "Offline"}
      </span>
      
      {showTimestamp && timeSinceUpdate && status === "connected" && (
        <span className="text-muted-foreground">{timeSinceUpdate}</span>
      )}

      {status === "disconnected" && autoReconnect && (
        <button
          onClick={handleManualReconnect}
          className="ml-1 rounded px-1 py-0.5 text-[10px] hover:bg-muted"
        >
          Retry
        </button>
      )}
    </div>
  );
}
