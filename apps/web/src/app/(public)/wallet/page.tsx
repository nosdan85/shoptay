"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DiscordLogin } from "@/components/discord/discord-login";
import { BalanceCard } from "@/components/wallet/balance-card";
import { TopupForm } from "@/components/wallet/topup-form";
import { TransactionList } from "@/components/wallet/transaction-list";
import { CashAppGuide } from "@/components/payment/cashapp-guide";
import { PayPalGuide } from "@/components/payment/paypal-guide";
import { LTCGuide } from "@/components/payment/ltc-guide";
import { CashAppPayPanel } from "@/components/wallet/cashapp-pay-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BanknotesIcon, UserCircleIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function WalletPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { wallet, balance, transactions, isLoading, createTopup } = useWallet();

  const [topupData, setTopupData] = useState<{
    method: "paypal_ff" | "cashapp" | "ltc";
    amount: number;
    topupId?: string;
    instructions?: {
      paypal_ff?: { destination: string; memoExpected: string };
      cashapp?: {
        square: { applicationId: string; locationId: string; environment: string };
        referenceId: string;
      };
      ltc?: { payAddress: string; qrImageUrl?: string };
    };
  } | null>(null);

  const handleTopup = async (method: "paypal_ff" | "cashapp" | "ltc", amount: number) => {
    try {
      const response = await createTopup(method, amount);
      setTopupData({
        method,
        amount,
        topupId: response.topup.id,
        instructions: response.instructions,
      });
    } catch (error) {
      console.error("Failed to create topup:", error);
      alert("Failed to create topup. Please try again.");
    }
  };

  const handleCashAppComplete = async (sourceId: string) => {
    // Refresh wallet to get updated balance
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center pt-16">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5865F2]/10">
                <UserCircleIcon className="h-8 w-8 text-[#5865F2]" />
              </div>
              <CardTitle>Link Discord to view your balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Connect your Discord account to access your wallet and transaction history.
              </p>
              <DiscordLogin />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-8 font-gothic text-4xl font-bold">My Wallet</h1>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Balance & Topup */}
            <div className="space-y-6">
              <BalanceCard balanceCents={balance} />

              {!topupData ? (
                <TopupForm onSubmit={handleTopup} isLoading={isLoading} />
              ) : topupData.method === "paypal_ff" ? (
                <PayPalGuide
                  amount={topupData.amount}
                  email={topupData.instructions?.paypal_ff?.destination || ""}
                  memoExpected={topupData.instructions?.paypal_ff?.memoExpected || ""}
                  onCreateTicket={async () => {}}
                />
              ) : topupData.method === "ltc" ? (
                <LTCGuide
                  amount={topupData.amount}
                  payAddress={topupData.instructions?.ltc?.payAddress || ""}
                  qrImageUrl={topupData.instructions?.ltc?.qrImageUrl}
                  onCreateTicket={async () => {}}
                />
              ) : topupData.method === "cashapp" && topupData.topupId && topupData.instructions?.cashapp ? (
                <div className="space-y-4">
                  <CashAppGuide
                    amount={topupData.amount}
                    handle="$yoko276"
                    onCreateTicket={async () => {}}
                  />
                  <CashAppPayPanel
                    topupId={topupData.topupId}
                    referenceId={topupData.instructions.cashapp.referenceId}
                    amount={topupData.amount * 1.1}
                    onComplete={handleCashAppComplete}
                  />
                </div>
              ) : null}
            </div>

            {/* Right Column - Transaction History */}
            <div>
              <TransactionList transactions={transactions} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
