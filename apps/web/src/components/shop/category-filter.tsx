"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Game } from "@/types";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

const CATEGORIES = [
  "Chest",
  "Reroll",
  "Shard",
  "Seal",
  "Relic",
  "Sets",
  "Combo",
];

export function CategoryFilter({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryFilterProps) {
  const allCategories = useMemo(
    () => ["All", ...CATEGORIES],
    []
  );

  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {allCategories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category === "All" ? "" : category)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
            (category === "All" ? "" : category) === activeCategory
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-secondary text-muted-foreground hover:border-border-medium hover:text-foreground"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

interface GameSelectorProps {
  games: Game[];
  activeGameId: string | null;
  onGameChange: (gameId: string | null) => void;
  className?: string;
}

export function GameSelector({
  games,
  activeGameId,
  onGameChange,
  className,
}: GameSelectorProps) {
  const filteredGames = useMemo(
    () => games.filter((game) => game.isActive),
    [games]
  );

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
    >
      <button
        onClick={() => onGameChange(null)}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
          activeGameId === null
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-secondary text-muted-foreground hover:border-border-medium hover:text-foreground"
        )}
      >
        All
      </button>
      {filteredGames.map((game) => (
        <button
          key={game._id}
          onClick={() => onGameChange(game._id)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
            activeGameId === game._id
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-secondary text-muted-foreground hover:border-border-medium hover:text-foreground"
          )}
        >
          {game.name}
        </button>
      ))}
    </div>
  );
}

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SortSelect({ value, onChange, className }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
    >
      <option value="default">Default</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
