"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingBag,
  Gamepad2,
  Clock,
  Home,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

const adminLinks = [
  { href: "/admin", label: "Orders", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/slots", label: "Delivery Slots", icon: Clock },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/wallet", label: "Wallet", icon: Wallet },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isAdminSidebarCollapsed, toggleAdminSidebar, setAdminSidebarCollapsed } =
    useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-border bg-background transition-all duration-300",
        isAdminSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          {!isAdminSidebarCollapsed && (
            <h2 className="font-gothic text-lg font-semibold">Admin</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAdminSidebar}
            className="h-8 w-8"
          >
            {isAdminSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {adminLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  isAdminSidebarCollapsed && "justify-center px-2"
                )}
                title={isAdminSidebarCollapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isAdminSidebarCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse indicator on mobile */}
        {isAdminSidebarCollapsed && (
          <div className="border-t border-border p-2">
            <p className="text-center text-xs text-muted-foreground">
              Collapsed
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
