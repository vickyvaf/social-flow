"use client";

import { useState, useEffect, useRef } from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useWalletBalance,
  useDisconnect,
  useConnectModal,
} from "thirdweb/react";
import { client } from "@/lib/client";
import { defineChain } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";
import { supabase } from "@/supabase/client";
import { User } from "@supabase/supabase-js";
import { TopUpModal } from "./TopUpModal";
import { useRouter } from "next/navigation";

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
];

export function UserAuthProfile() {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { connect } = useConnectModal();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [profileData, setProfileData] = useState<{
    name: string;
    credits: number;
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const [imgError, setImgError] = useState(false);

  const { data: balanceData } = useWalletBalance({
    chain: defineChain(8453), // Base
    address: account?.address,
    client: client,
  });

  useEffect(() => {
    setImgError(false); // Reset error state when user changes
    // Check Supabase session
    async function getSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const { data: creditsData, error } = await supabase
          .from("user_credits")
          .select("credits_remaining")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn(
            "No credits found for user, might need initialization",
            error,
          );
        }

        setProfileData({
          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")?.[0] ||
            "User",
          credits: creditsData?.credits_remaining || 0,
        });
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      }
    }
    if (user) {
      fetchProfile();
    } else {
      setProfileData(null);
    }

    // Listen for credit updates from other components
    const handleCreditsUpdate = () => {
      if (user) fetchProfile();
    };

    window.addEventListener("creditsUpdated", handleCreditsUpdate);
    return () =>
      window.removeEventListener("creditsUpdated", handleCreditsUpdate);
  }, [user]);

  // Sync wallet to Supabase
  useEffect(() => {
    async function syncWallet() {
      if (!user || !account) return;

      try {
        // Find existing wallet for this user
        const { data: existingWallet } = await supabase
          .from("wallets")
          .select("id, address")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingWallet) {
          // Update if address changed or was null
          if (existingWallet.address !== account.address) {
            await supabase
              .from("wallets")
              .update({
                address: account.address,
                chain: "base",
                verified: true,
              })
              .eq("id", existingWallet.id);
          }
        } else {
          // Insert if doesn't exist (though trigger should handle it)
          await supabase.from("wallets").insert({
            user_id: user.id,
            address: account.address,
            chain: "base",
            verified: true,
          });
        }
      } catch (err) {
        console.error("Failed to sync wallet to Supabase:", err);
      }
    }

    syncWallet();
  }, [user?.id, account?.address]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }

      // Check for Thirdweb modals (they are attached to document.body)
      const isThirdwebModal =
        target instanceof Element &&
        (target.closest(".tw-connect-modal") ||
          target.closest('[id^="tw-"]') ||
          target.classList.contains("tw-modal-backdrop") ||
          document.querySelector(".tw-connect-modal")?.contains(target));

      if (isThirdwebModal) {
        return;
      }

      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Logout from Supabase
    await supabase.auth.signOut();

    // Disconnect wallet if connected
    if (wallet) {
      disconnect(wallet);
    }

    // Clear other auth cookies
    await fetch("/api/auth/disconnect", {
      method: "POST",
      body: JSON.stringify({ platform: "all" }),
    });

    window.location.reload();
    router.push("/");
  };

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleConnect = async () => {
    try {
      await connect({
        client,
        wallets,
        chain: defineChain(8453),
        size: "compact",
      });
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="group flex items-center gap-3 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 border border-zinc-200 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>
    );
  }

  const ethBalance = balanceData
    ? Number(balanceData.displayValue).toFixed(4)
    : "0.0000";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white p-1.5 pr-4 pl-2 text-left transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        {user.user_metadata?.avatar_url && !imgError ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Avatar"
            className="h-8 w-8 rounded-full object-cover shadow-sm"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 shadow-sm" />
        )}
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
            {user.user_metadata?.full_name ||
              user.email?.split("@")?.[0] ||
              "User"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {profileData?.credits ?? 0} Credits
            </span>
            {account && (
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                {ethBalance} ETH
              </span>
            )}
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-3 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Signed in as
            </p>
            <p className="mt-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user.email}
            </p>
          </div>

          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Balance
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-900 dark:text-zinc-100">
                  {profileData?.credits ?? 0}
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  Credits
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Top Up Credits
            </button>
          </div>

          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Wallet
              </p>
              {account && (
                <span className="text-[10px] font-mono text-zinc-400">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
              )}
            </div>

            {!account ? (
              <button
                onClick={handleConnect}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800">
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {ethBalance} ETH
                  </span>
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConnect}
                    className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-[10px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Change Wallet
                  </button>
                  <button
                    onClick={() => disconnect(wallet!)}
                    className="flex-1 rounded-lg border border-red-100 bg-red-50/50 py-1.5 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}

      {user && (
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          userId={user.id}
          onSuccess={() => {
            // Trigger a refresh of the profile data
            const event = new CustomEvent("creditsUpdated");
            window.dispatchEvent(event);
          }}
        />
      )}
    </div>
  );
}
