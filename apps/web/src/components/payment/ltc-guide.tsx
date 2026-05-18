"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface LTCGuideProps {
  amount: number;
  payAddress: string;
  qrImageUrl?: string;
  channelId?: string;
  onCreateTicket: () => Promise<void>;
  isCreatingTicket?: boolean;
  retryInSeconds?: number;
  className?: string;
}

export function LTCGuide({
  amount,
  payAddress,
  qrImageUrl,
  channelId,
  onCreateTicket,
  isCreatingTicket,
  retryInSeconds,
  className,
}: LTCGuideProps) {
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
          <span className="text-2xl">₿</span>
          Litecoin Payment Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Send Equivalent of</p>
          <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
          <p className="text-xs text-muted-foreground">
            in LTC to the address below
          </p>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Litecoin Address</p>
          <div className="flex items-center gap-2">
            <Input
              value={payAddress}
              readOnly
              className="font-mono text-xs break-all"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(payAddress, "address")}
            >
              {copiedField === "address" ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* QR Code */}
        {qrImageUrl && (
          <div className="flex justify-center">
            <div className="relative h-48 w-48 rounded-lg border bg-white p-2">
              <Image
                src={qrImageUrl}
                alt="LTC QR Code"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2 text-sm">
          <p className="font-medium">Steps:</p>
          <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
            <li>Open your Litecoin wallet</li>
            <li>Send the equivalent amount to the address above</li>
            <li>Wait for at least 1 network confirmation</li>
            <li>Keep your transaction ID as proof</li>
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
            : "Create LTC Ticket"}
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
