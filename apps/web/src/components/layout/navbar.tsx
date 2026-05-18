"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Sun, Moon, Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { getDiscordInviteUrl } from "@/lib/api-routes";

export function Navbar() {
  const pathname = usePathname();
  const { user, isOwner, isInitialized, checkOwner } = useAuth();
  const { itemCount, openCart } = useCart();
  const { theme, setTheme, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useUIStore();

  // Check owner status when user changes
  useEffect(() => {
    if (user?.discordId && isInitialized) {
      checkOwner();
    }
  }, [user?.discordId, isInitialized, checkOwner]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  const discordUrl = useMemo(() => getDiscordInviteUrl(), []);

  const navLinks = useMemo(() => {
    const links = [
      { href: "/proofs", label: "Proofs" },
      { href: discordUrl, label: "Discord", external: true },
    ];

    if (user?.discordId) {
      links.push({ href: "/wallet", label: "Wallet" });
    }

    if (isOwner) {
      links.push({ href: "/admin", label: "Admin" });
    }

    return links;
  }, [user?.discordId, isOwner, discordUrl]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src={process.env.NEXT_PUBLIC_SITE_LOGO || "/site-logo.png"}
            alt={process.env.NEXT_PUBLIC_SITE_NAME || "Nos Market"}
            className="h-8 w-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="hidden font-gothic text-xl font-bold sm:block">
            {process.env.NEXT_PUBLIC_SITE_NAME || "Nos Market"}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openCart}
            className="relative"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav links={navLinks} isOpen={isMobileMenuOpen} />
    </header>
  );
}
