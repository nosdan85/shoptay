"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCompactNumber } from "@/lib/format";
import { DollarSign, ShoppingBag, Users, Clock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminDashboardStats } from "@shared/types/wallet";

interface StatsCardsProps {
  stats: AdminDashboardStats;
  className?: string;
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(Math.round(stats.revenue.total * 100)),
      subtitle: `${stats.revenue.completedOrders} completed orders`,
      icon: DollarSign,
      className: "text-green-500",
    },
    {
      title: "Total Orders",
      value: formatCompactNumber(stats.orders.total),
      subtitle: `${stats.orders.pending} pending, ${stats.orders.processing} processing`,
      icon: ShoppingBag,
      className: "text-accent",
    },
    {
      title: "Users Linked",
      value: formatCompactNumber(stats.users.total),
      subtitle: `${stats.users.linkedDiscord} with Discord`,
      icon: Users,
      className: "text-blue-500",
    },
    {
      title: "Pending Topups",
      value: formatCurrency(Math.round(stats.pendingTopups.totalAmount * 100)),
      subtitle: `${stats.pendingTopups.count} pending deposits`,
      icon: Clock,
      className: "text-yellow-500",
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={cn("h-4 w-4", card.className)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-gothic">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
