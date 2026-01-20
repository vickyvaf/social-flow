import { ConnectButton } from "thirdweb/react";
import { client } from "@/app/client";
import { defineChain } from "thirdweb/chains";

export function ConnectWalletState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-6 rounded-full bg-blue-50 p-4 dark:bg-blue-900/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8 text-blue-600 dark:text-blue-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
        Connect Your Wallet
      </h3>
      <p className="mb-8 max-w-sm text-zinc-500 dark:text-zinc-400">
        You need to connect your wallet to view your transaction history, check
        your balance, and track your spending.
      </p>
      <ConnectButton
        client={client}
        chains={[defineChain(8453)]} // Base
        theme={"dark"}
        connectModal={{
          size: "compact",
        }}
        appMetadata={{
          name: "PromptDesk Onchain",
          url: "https://promptdesk.xyz", // Replace with your actual URL
          description:
            "Audit and track your crypto-powered content generations",
        }}
      />
    </div>
  );
}
