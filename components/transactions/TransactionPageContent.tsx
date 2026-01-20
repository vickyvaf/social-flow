"use client";

import { useActiveAccount } from "thirdweb/react";
import { StatsCards } from "@/components/transactions/StatsCards";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { PromoBanner } from "@/components/transactions/PromoBanner";
import { ConnectWalletState } from "@/components/transactions/ConnectWalletState";

export function TransactionPageContent() {
  const account = useActiveAccount();

  if (!account) {
    return <ConnectWalletState />;
  }

  return (
    <div className="space-y-8">
      <StatsCards />
      <TransactionTable />
      <PromoBanner />
    </div>
  );
}
