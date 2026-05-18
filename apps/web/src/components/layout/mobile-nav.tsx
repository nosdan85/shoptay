"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

interface MobileNavProps {
  links: NavLink[];
  isOpen: boolean;
}

export function MobileNav({ links, isOpen }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 top-full border-b border-border bg-background py-4 md:hidden">
      <nav className="flex flex-col gap-2 px-4">
        {links.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
