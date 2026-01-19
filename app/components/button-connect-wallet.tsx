"use client";

import { ConnectButton } from "thirdweb/react";
import { defineChain } from "thirdweb";
import { client } from "../app/client";

export function ButtonConnectWallet() {
  return (
    <div className="flex justify-center border border-zinc-200 dark:border-zinc-800 rounded-full overflow-hidden">
      <ConnectButton
        client={client}
        chain={defineChain(8453)}
        connectButton={{
          label: "Connect Wallet",
          style: {
            fontSize: "0.875rem",
            fontWeight: 500,
          },
        }}
        detailsButton={{
          displayBalanceToken: {},
          style: {
            fontSize: "0.875rem",
            fontWeight: 500,
          },
        }}
      />
    </div>
  );
}
