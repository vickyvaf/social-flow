"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { supabase } from "@/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useIDRXBalance } from "@/hooks/useIDRX";

export function StatsCards() {
  const { address } = useAccount();
  const { balanceFormatted, isLoading: isBalanceLoading } = useIDRXBalance();
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalTransactions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        if (!address) {
          setStats({ totalSpent: 0, totalTransactions: 0 });
          setIsLoading(false);
          return;
        }

        // 1. Get user_id from profiles table using wallet address
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("wallet_address", address)
          .single();

        if (profileError || !profileData) {
          console.warn("Profile not found for address:", address);
          setStats({ totalSpent: 0, totalTransactions: 0 });
          setIsLoading(false);
          return;
        }

        const userId = profileData.id;

        // Fetch transactions for stats
        const { data: transactions, error } = await supabase
          .from("post_transactions")
          .select("amount_eth, status, created_at, currency")
          .eq("user_id", userId);

        if (error) throw error;

        if (transactions) {
          // Map to match previous structure slightly for calculation
          const mappedTransactions = transactions.map((t) => ({
            amount: t.amount_eth,
            status: t.status,
            created_at: t.created_at,
            token_symbol: t.currency,
          }));

          const totalSpent = mappedTransactions
            .filter((t) => t.status === "confirmed") // Changed from success to confirmed
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

          // Count recent (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const recentCount = mappedTransactions.filter(
            (t) => new Date(t.created_at) > thirtyDaysAgo,
          ).length;

          setStats({
            totalSpent,
            totalTransactions: recentCount,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [address]);

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-4">
      {/* Current Balance Card */}
      <div className="col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-black md:col-span-1">
        <div className="mb-2 flex items-start justify-between sm:mb-4">
          <span className="text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
            Balance
          </span>
          <div className="hidden rounded-lg bg-blue-50 p-1.5 text-blue-600 sm:block sm:p-2 dark:bg-blue-900/20 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <path
                fillRule="evenodd"
                d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="mb-1 truncate text-lg font-bold text-zinc-900 sm:text-3xl dark:text-white">
          {isBalanceLoading || isLoading ? (
            <Skeleton className="h-6 w-24 sm:h-9 sm:w-32" />
          ) : (
            `${Number(balanceFormatted).toFixed(2)} IDRX`
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="truncate text-zinc-500 dark:text-zinc-400">
            Base Sepolia
          </span>
        </div>
      </div>

      {/* Total Spent Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-black">
        <div className="mb-2 flex items-start justify-between sm:mb-4">
          <span className="text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
            Total Spent
          </span>
          <div className="hidden rounded-lg bg-blue-50 p-1.5 text-blue-600 sm:block sm:p-2 dark:bg-blue-900/20 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <path
                fillRule="evenodd"
                d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.272.272 0 01-.35.25A90.043 90.043 0 001.75 14.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="mb-1 truncate text-lg font-bold text-zinc-900 sm:text-3xl dark:text-white">
          {isLoading ? (
            <Skeleton className="h-6 w-16 sm:h-9 sm:w-20" />
          ) : (
            `${stats.totalSpent.toFixed(2)} IDRX`
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="truncate text-zinc-500 dark:text-zinc-400">
            Lifetime spend
          </span>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-black">
        <div className="mb-2 flex items-start justify-between sm:mb-4">
          <span className="text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
            Activity (30d)
          </span>
          <div className="hidden rounded-lg bg-blue-50 p-1.5 text-blue-600 sm:block sm:p-2 dark:bg-blue-900/20 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h5.25a.75.75 0 00.75-.75v-5.25z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-10.5v4.5h4.5a.75.75 0 000-1.5h-3.75v-3a.75.75 0 00-1.5 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="mb-1 truncate text-lg font-bold text-zinc-900 sm:text-3xl dark:text-white">
          {isLoading ? (
            <Skeleton className="h-6 w-16 sm:h-9 sm:w-24" />
          ) : (
            `${stats.totalTransactions} Txns`
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="truncate text-zinc-500 dark:text-zinc-400">
            last 30 days
          </span>
        </div>
      </div>
    </div>
  );
}
