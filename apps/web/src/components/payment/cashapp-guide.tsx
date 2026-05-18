"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface CashAppGuideProps {
  amount: number;
  handle: string;
  channelId?: string;
  onCreateTicket: () => Promise<void>;
  isCreatingTicket?: boolean;
  retryInSeconds?: number;
  className?: string;
}

export function CashAppGuide({
  amount,
  handle,
  onCreateTicket,
  isCreatingTicket,
  retryInSeconds,
  channelId,
  className,
}: CashAppGuideProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (value: string, field: string) => {
    await copyToClipboard(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💵</span>
          Cash App Payment Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversion Fee Warning */}
        <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
          <p className="text-yellow-200">
            <span className="font-medium">Important:</span> Cash App charges a 10%
            conversion fee. Send{" "}
            <span className="font-bold text-yellow-400">
              {formatCurrency(amount * 1.1)}
            </span>{" "}
            to cover the full amount.
          </p>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Send Amount</p>
          <p className="text-2xl font-bold text-yellow-400">
            {formatCurrency(amount * 1.1)}
          </p>
        </div>

        {/* Handle */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Send to</p>
          <div className="flex items-center gap-2">
            <Input value={handle} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(handle, "handle")}
            >
              {copiedField === "handle" ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 text-sm">
          <p className="font-medium">Steps:</p>
          <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
            <li>Open Cash App on your phone</li>
            <li>Enter the exact amount shown above</li>
            <li>Enter the cashtag shown above</li>
            <li>Review and send payment</li>
            <li>Keep your confirmation screenshot</li>
          </ol>
        </div>

        {/* Create Ticket Button */}
        <Button
          onClick={onCreateTicket}
          disabled={isCreatingTicket || !!retryInSeconds}
          className="w-full"
          size="lg"
        >
          {isCreatingTicket
            ? "Creating..."
            : retryInSeconds
            ? `Retry in ${retryInSeconds}s`
            : "Create Cash App Ticket"}
        </Button>

        {channelId && (
          <Button
            variant="outline"
            onClick={() => {
              const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
              const url = `https://discord.com/channels/${guildId}/${channelId}`;
              window.open(url, "_blank");
            }}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Discord Ticket
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
