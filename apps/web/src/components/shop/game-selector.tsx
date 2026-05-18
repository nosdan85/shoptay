"use client";

import { useMemo } from "react";
import { Game } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GameSelectorDropdownProps {
  games: Game[];
  value: string | null;
  onChange: (gameId: string | null) => void;
  className?: string;
}

export function GameSelectorDropdown({
  games,
  value,
  onChange,
  className,
}: GameSelectorDropdownProps) {
  const activeGames = useMemo(
    () => games.filter((g) => g.isActive),
    [games]
  );

  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onChange(val === "all" ? null : val)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="All Games" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Games</SelectItem>
        {activeGames.map((game) => (
          <SelectItem key={game._id} value={game._id}>
            {game.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
