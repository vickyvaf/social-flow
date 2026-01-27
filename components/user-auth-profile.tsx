"use client";

import { useState } from "react";
import { useAccount, useDisconnect, useConnect } from "wagmi";
import { supabase } from "@/supabase/client";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useIDRXBalance } from "@/hooks/useIDRX";
import { FaucetModal } from "@/components/FaucetModal";

export function UserAuthProfile() {
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  const { user, loading } = useWalletAuth();
  const { address: walletAddress, isConnected } = useAccount();
  const { balanceFormatted } = useIDRXBalance();
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState(false);

  const handleLogout = async () => {
    if (isConnected) {
      disconnect();
    }
    // Optional: Clear any local session state if we added any manually,
    // but since we rely on `useAccount`, simply disconnecting should suffice to trigger the useEffects.
    // setUser(null); // Managed by hook now, or just reload page fixes it
    // setProfileData(null);

    // We might not even need the API call if it was just for clearing cookies
    try {
      await fetch("/api/auth/disconnect", {
        method: "POST",
        body: JSON.stringify({ platform: "all" }),
      });
    } catch (e) {
      console.error(e);
    }

    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* IDRX Balance Display with Faucet Button */}
      <div className="flex items-center rounded-full border border-zinc-200 bg-white p-1 pr-1 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="px-3 text-sm font-medium text-zinc-900 dark:text-white">
          {balanceFormatted} IDRX
        </span>
        <button
          onClick={() => setIsFaucetModalOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-3 text-xs font-bold text-white transition-all hover:from-blue-700 hover:to-blue-800 active:scale-95"
          title="Claim free IDRX"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
              clipRule="evenodd"
            />
          </svg>
          FAUCET
        </button>
      </div>

      {/* Standalone Logout Button */}
      <button
        onClick={handleLogout}
        className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        title="Logout"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      <FaucetModal
        isOpen={isFaucetModalOpen}
        onClose={() => setIsFaucetModalOpen(false)}
      />
    </div>
  );
}
