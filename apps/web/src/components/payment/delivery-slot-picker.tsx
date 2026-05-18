"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Clock, Globe, RefreshCw, Calendar, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { COUNTRY_TIMEZONES } from "@/types";
import { cn } from "@/lib/utils";

interface DeliverySlotPickerProps {
  orderId: string;
  selectedSlotId?: string;
  onSlotSelect: (slotId: string, customerTimezone: string) => Promise<void>;
  disabled?: boolean;
}

interface Slot {
  id: string;
  startAt: string;
  endAt: string;
  ownerTimezone: string;
  note?: string;
  maxOrders: number;
  currentOrders: number;
  availableSpots: number;
  isFull: boolean;
  localStartAt: string;
  localEndAt: string;
  localDate: string;
}

interface GroupedSlots {
  [date: string]: Slot[];
}

export function DeliverySlotPicker({
  orderId,
  selectedSlotId,
  onSlotSelect,
  disabled = false,
}: DeliverySlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [groupedSlots, setGroupedSlots] = useState<GroupedSlots>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timezone, setTimezone] = useState<string>("America/New_York");

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<{
        slots: Slot[];
        groupedByDate: GroupedSlots;
        timezone: string;
      }>(`${API_ROUTES.DELIVERY_SLOTS}?timezone=${encodeURIComponent(timezone)}`);

      setSlots(data.slots || []);
      setGroupedSlots(data.groupedByDate || {});
    } catch (err) {
      setError("Failed to load delivery slots");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [timezone]);

  const handleSelectSlot = async (slotId: string) => {
    if (disabled || submitting) return;

    setSubmitting(true);
    try {
      await onSlotSelect(slotId, timezone);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Select Delivery Slot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchSlots}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Select Delivery Slot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timezone selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={disabled}
            >
              {Object.entries(COUNTRY_TIMEZONES).map(([code, tz]) => (
                <option key={code} value={tz}>
                  {code} ({tz.split("/").pop()?.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSlots}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Slots grouped by date */}
        {Object.keys(groupedSlots).length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">No delivery slots available</p>
            <p className="text-sm">Please check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date}>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  {formatDate(date)}
                </h4>
                <div className="grid gap-2">
                  {dateSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedSlotId === slot.id ? "default" : "outline"}
                      className={cn(
                        "h-auto justify-start py-3",
                        slot.isFull && "opacity-50"
                      )}
                      onClick={() => handleSelectSlot(slot.id)}
                      disabled={disabled || slot.isFull || submitting}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium">
                            {formatTime(slot.localStartAt)} - {formatTime(slot.localEndAt)}
                          </span>
                          {slot.note && (
                            <span className="text-xs text-muted-foreground">
                              {slot.note}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {slot.isFull ? (
                            <Badge variant="secondary">Full</Badge>
                          ) : (
                            <Badge variant="success">
                              {slot.availableSpots} spots left
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {submitting && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Selecting slot...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
