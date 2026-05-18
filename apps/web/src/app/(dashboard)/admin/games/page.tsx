"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Game } from "@/types";
import { GameForm } from "@/components/admin/game-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function GamesAdminPage() {
  const router = useRouter();
  const { isOwner, isLoading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push("/");
    }
  }, [authLoading, isOwner, router]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await apiGet<{ games: Game[] }>(API_ROUTES.ADMIN_GAMES);
        setGames(response.games || []);
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOwner) {
      fetchGames();
    }
  }, [isOwner]);

  const handleSave = () => {
    apiGet<{ games: Game[] }>(API_ROUTES.ADMIN_GAMES).then((response) => {
      setGames(response.games || []);
    });
  };

  if (authLoading || !isOwner) {
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="mb-2 font-gothic text-3xl font-bold">Games</h1>
        <p className="text-muted-foreground">Manage your game categories</p>
      </div>

      <GameForm games={games} onSave={handleSave} />
    </div>
  );
}
