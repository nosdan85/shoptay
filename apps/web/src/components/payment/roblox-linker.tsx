"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Search, CheckCircle2, Loader2, User } from "lucide-react";
import { apiFetch, apiPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { cn } from "@/lib/utils";

interface RobloxLinkerProps {
  orderId: string;
  linkedUsername?: string;
  linkedUserId?: string;
  onLink: (username: string, userId: string, displayName: string) => Promise<void>;
  disabled?: boolean;
}

interface RobloxSearchResult {
  robloxUsername: string;
  robloxUserId: string;
  robloxDisplayName: string;
}

export function RobloxLinker({
  orderId,
  linkedUsername,
  linkedUserId,
  onLink,
  disabled = false,
}: RobloxLinkerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<RobloxSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const result = await apiFetch<RobloxSearchResult>(
        `${API_ROUTES.ROBLOX_SEARCH}?username=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchResult(result);
    } catch (err) {
      setSearchError("Failed to find Roblox user. Please check the username.");
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!searchResult || linking) return;

    setLinking(true);
    try {
      await onLink(
        searchResult.robloxUsername,
        searchResult.robloxUserId,
        searchResult.robloxDisplayName
      );
      setSearchQuery("");
      setSearchResult(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLinking(false);
    }
  };

  const isAlreadyLinked = linkedUsername && linkedUserId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Link Roblox Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAlreadyLinked ? (
          <div className="flex items-center gap-3 rounded-lg border border-success/50 bg-success/10 p-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <p className="font-medium text-success">Roblox Account Linked</p>
              <p className="text-sm text-muted-foreground">
                {linkedUsername} (ID: {linkedUserId})
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Search for your Roblox account to link it to this order for delivery.
            </p>

            {/* Search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter Roblox username"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                  disabled={disabled || searching}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={disabled || !searchQuery.trim() || searching}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {searchError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Search result */}
            {searchResult && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{searchResult.robloxDisplayName}</p>
                    <p className="text-sm text-muted-foreground">
                      @{searchResult.robloxUsername} • ID: {searchResult.robloxUserId}
                    </p>
                  </div>
                  <Button
                    onClick={handleConfirmLink}
                    disabled={disabled || linking}
                    className="ml-4"
                  >
                    {linking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "This is my account"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Make sure this is the correct Roblox account where you want items delivered.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
