"use client";

import { useState } from "react";
import { Game } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { cn, slugify } from "@/lib/utils";
import { apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";

interface GameFormProps {
  games: Game[];
  onSave: () => void;
  className?: string;
}

export function GameForm({ games, onSave, className }: GameFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    isActive: true,
  });

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Game name is required");
      return;
    }

    if (!formData.slug.trim()) {
      alert("Game slug is required");
      return;
    }

    try {
      setIsLoading(true);

      if (editingId) {
        await apiPut(`${API_ROUTES.ADMIN_GAMES}/${editingId}`, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          isActive: formData.isActive,
        });
      } else {
        await apiPost(API_ROUTES.ADMIN_GAMES, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          isActive: formData.isActive,
        });
      }

      setFormData({ name: "", slug: "", isActive: true });
      setEditingId(null);
      onSave();
    } catch (error) {
      console.error("Failed to save game:", error);
      alert("Failed to save game");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingId(game._id);
    setFormData({
      name: game.name,
      slug: game.slug,
      isActive: game.isActive,
    });
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    try {
      setIsLoading(true);
      await apiDelete(`${API_ROUTES.ADMIN_GAMES}/${gameId}`);
      onSave();
    } catch (error) {
      console.error("Failed to delete game:", error);
      alert("Failed to delete game");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", slug: "", isActive: true });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Game" : "Add Game"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Game name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="game-slug"
                  pattern="[a-z0-9-]+"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : editingId ? "Update Game" : "Add Game"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle>Games</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game._id}>
                  <TableCell className="font-gothic font-medium">{game.name}</TableCell>
                  <TableCell>
                    <code className="text-xs">{game.slug}</code>
                  </TableCell>
                  <TableCell>
                    {game.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(game)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(game._id)}
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
