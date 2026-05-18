"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface PayPalGuideProps {
  amount: number;
  email: string;
  memoExpected: string;
  channelId?: string;
  onCreateTicket: () => Promise<void>;
  isCreatingTicket?: boolean;
  retryInSeconds?: number;
  className?: string;
}

export function PayPalGuide({
  amount,
  email,
  memoExpected,
  channelId,
  onCreateTicket,
  isCreatingTicket,
  retryInSeconds,
  className,
}: PayPalGuideProps) {
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
          <span className="text-2xl">💳</span>
          PayPal Payment Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Method */}
        <div className="rounded-lg bg-blue-500/10 p-3 text-sm">
          <span className="font-medium text-blue-400">Method:</span>{" "}
          <span>Friends and Family</span>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Send Amount</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
          </div>
        </div>

        {/* Recipient Email */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Send to</p>
          <div className="flex items-center gap-2">
            <Input
              value={email}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(email, "email")}
            >
              {copiedField === "email" ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Memo */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Important - Include Note</p>
          <div className="flex items-center gap-2">
            <Input
              value={memoExpected}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(memoExpected, "memo")}
            >
              {copiedField === "memo" ? (
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
            <li>Choose &ldquo;Friends and Family&rdquo; as payment type</li>
            <li>Enter the exact amount shown above</li>
            <li>Write the exact note/memo shown above</li>
            <li>Send payment and keep the screenshot</li>
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
            : "Create PayPal Ticket"}
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
