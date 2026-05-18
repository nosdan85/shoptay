"use client";

import { useState } from "react";
import { DeliverySlot, COUNTRY_TIMEZONES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Power, PowerOff, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { formatDateTime } from "@/lib/format";

interface SlotManagerProps {
  className?: string;
}

interface TimeRange {
  start: string;
  end: string;
  note: string;
}

export function SlotManager({ className }: SlotManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [filter, setFilter] = useState<"active" | "inactive">("active");
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { start: "", end: "", note: "" },
  ]);

  const [formData, setFormData] = useState({
    ownerTimezone: "UTC",
    date: "",
  });

  const fetchSlots = async () => {
    try {
      const response = await apiGet<{ slots: DeliverySlot[] }>(API_ROUTES.DELIVERY_SLOTS_MANAGE);
      setSlots(response.slots || []);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    }
  };

  const handleAddRange = () => {
    setTimeRanges((prev) => [...prev, { start: "", end: "", note: "" }]);
  };

  const handleRemoveRange = (index: number) => {
    setTimeRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRangeChange = (
    index: number,
    field: keyof TimeRange,
    value: string
  ) => {
    setTimeRanges((prev) =>
      prev.map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      )
    );
  };

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      alert("Please select a date");
      return;
    }

    const validRanges = timeRanges.filter((r) => r.start && r.end);
    if (validRanges.length === 0) {
      alert("Please add at least one time range");
      return;
    }

    try {
      setIsLoading(true);

      const ranges = validRanges.map((range) => {
        const startDate = new Date(`${formData.date}T${range.start}`);
        const endDate = new Date(`${formData.date}T${range.end}`);
        return {
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          note: range.note || undefined,
        };
      });

      await apiPost(API_ROUTES.DELIVERY_SLOTS_BULK, {
        ownerTimezone: formData.ownerTimezone,
        date: formData.date,
        ranges,
      });

      setTimeRanges([{ start: "", end: "", note: "" }]);
      setFormData((prev) => ({ ...prev, date: "" }));
      await fetchSlots();
      alert("Slots created successfully");
    } catch (error) {
      console.error("Failed to create slots:", error);
      alert("Failed to create slots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSlot = async (slotId: string, active: boolean) => {
    try {
      await apiPatch(API_ROUTES.DELIVERY_SLOT_UPDATE(slotId), { active });
      await fetchSlots();
    } catch (error) {
      console.error("Failed to toggle slot:", error);
      alert("Failed to update slot");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    try {
      await apiDelete(API_ROUTES.DELIVERY_SLOT_UPDATE(slotId));
      await fetchSlots();
    } catch (error) {
      console.error("Failed to delete slot:", error);
      alert("Failed to delete slot");
    }
  };

  const filteredSlots = slots.filter((slot) =>
    filter === "active" ? slot.active : !slot.active
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Create Slots Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Delivery Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSlots} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Owner Timezone</Label>
                <Select
                  value={formData.ownerTimezone}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, ownerTimezone: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRY_TIMEZONES).map(([code, tz]) => (
                      <SelectItem key={code} value={tz}>
                        {code} ({tz})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Time Ranges</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddRange}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Range
                </Button>
              </div>

              {timeRanges.map((range, index) => (
                <div key={index} className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={range.start}
                      onChange={(e) => handleRangeChange(index, "start", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={range.end}
                      onChange={(e) => handleRangeChange(index, "end", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs">Note (optional)</Label>
                    <Input
                      placeholder="e.g., Morning"
                      value={range.note}
                      onChange={(e) => handleRangeChange(index, "note", e.target.value)}
                    />
                  </div>
                  {timeRanges.length > 1 && (
                    <div className="flex items-end pb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRange(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating..." : "Create All Slots"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Manage Slots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Slots</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
              >
                Active ({slots.filter((s) => s.active).length})
              </Button>
              <Button
                variant={filter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("inactive")}
              >
                Inactive ({slots.filter((s) => !s.active).length})
              </Button>
              <Button variant="outline" size="icon" onClick={fetchSlots}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Owner TZ</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSlots.map((slot) => (
                <TableRow key={slot._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDateTime(slot.startAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{slot.ownerTimezone}</TableCell>
                  <TableCell>{slot.note || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleSlot(slot._id, !slot.active)}
                      >
                        {slot.active ? (
                          <PowerOff className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Power className="h-4 w-4 text-success" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSlot(slot._id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
